import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  Collection,
  CollectionNode,
  CollectionDetail,
  CollectionMember,
  CollectionRefType,
  MemberOption,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toCollection(r: any, ownCount: number): Collection {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    parentId: r.parent_id,
    visibility: r.visibility,
    status: r.status,
    order: r.order ?? 0,
    ownCount,
    rollupCount: ownCount, // ajustado ao montar a árvore
    createdAt: r.created_at,
  };
}

/** Coleções como floresta (raízes com filhos aninhados) + contagem própria e rollup. */
export async function listCollections(): Promise<CollectionNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, name, description, parent_id, visibility, status, order, created_at, collection_members(count)")
    .order("order");
  if (error) throw new Error(`listCollections: ${error.message}`);

  const nodes = new Map<string, CollectionNode>();
  for (const r of data ?? []) {
    const own = r.collection_members?.[0]?.count ?? 0;
    nodes.set(r.id, { ...toCollection(r, own), children: [], depth: 0 });
  }

  const roots: CollectionNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const setDepthAndRollup = (node: CollectionNode, depth: number): number => {
    node.depth = depth;
    node.children.sort((a, b) => a.order - b.order);
    let rollup = node.ownCount;
    for (const c of node.children) rollup += setDepthAndRollup(c, depth + 1);
    node.rollupCount = rollup;
    return rollup;
  };
  roots.sort((a, b) => a.order - b.order);
  for (const r of roots) setDepthAndRollup(r, 0);

  return roots;
}

async function resolveNames(
  supabase: any,
  members: { refType: CollectionRefType; refId: string }[]
): Promise<Map<string, string>> {
  const itemIds = members.filter((m) => m.refType === "item").map((m) => m.refId);
  const protoIds = members.filter((m) => m.refType === "protocol").map((m) => m.refId);
  const names = new Map<string, string>();
  const [items, protos] = await Promise.all([
    itemIds.length ? supabase.from("items").select("id, name").in("id", itemIds) : { data: [] },
    protoIds.length ? supabase.from("protocols").select("id, name").in("id", protoIds) : { data: [] },
  ]);
  for (const i of items.data ?? []) names.set(`item:${i.id}`, i.name);
  for (const p of protos.data ?? []) names.set(`protocol:${p.id}`, p.name);
  return names;
}

export async function getCollectionById(id: string): Promise<CollectionDetail | null> {
  const supabase = await createClient();
  const { data: col, error } = await supabase
    .from("collections")
    .select("id, slug, name, description, parent_id, visibility, status, order, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getCollectionById: ${error.message}`);
  if (!col) return null;

  // Descendentes (para o rollup) a partir da lista completa.
  const { data: all } = await supabase.from("collections").select("id, parent_id, name");
  const childrenOf = new Map<string | null, any[]>();
  for (const c of all ?? []) {
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c);
  }
  const nameById = new Map((all ?? []).map((c: any) => [c.id, c.name]));
  const descendants: string[] = [];
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const c = stack.pop();
    descendants.push(c.id);
    stack.push(...(childrenOf.get(c.id) ?? []));
  }

  const ids = [id, ...descendants];
  const { data: rows } = await supabase
    .from("collection_members")
    .select("id, collection_id, ref_type, ref_id, order")
    .in("collection_id", ids);

  const names = await resolveNames(
    supabase,
    (rows ?? []).map((r: any) => ({ refType: r.ref_type, refId: r.ref_id }))
  );

  const toMember = (r: any, fromChild?: string): CollectionMember => ({
    id: r.id,
    refType: r.ref_type,
    refId: r.ref_id,
    order: r.order ?? 0,
    name: names.get(`${r.ref_type}:${r.ref_id}`) ?? "—",
    fromChild,
  });

  const members: CollectionMember[] = (rows ?? [])
    .filter((r: any) => r.collection_id === id)
    .map((r: any) => toMember(r))
    .sort((a: CollectionMember, b: CollectionMember) => a.order - b.order);

  const rollupMembers: CollectionMember[] = (rows ?? [])
    .filter((r: any) => r.collection_id !== id)
    .map((r: any) => toMember(r, nameById.get(r.collection_id) as string))
    .sort((a: CollectionMember, b: CollectionMember) => a.order - b.order);

  return {
    ...toCollection(col, members.length),
    rollupCount: members.length + rollupMembers.length,
    parentName: col.parent_id ? (nameById.get(col.parent_id) as string) ?? null : null,
    members,
    rollupMembers,
  };
}

/** Itens e protocolos como opções de membro. */
export async function listMemberOptions(): Promise<MemberOption[]> {
  const supabase = await createClient();
  const [items, protos] = await Promise.all([
    supabase.from("items").select("id, name").order("name"),
    supabase.from("protocols").select("id, name").order("name"),
  ]);
  return [
    ...(items.data ?? []).map((i: any) => ({ refType: "item" as const, refId: i.id, name: i.name })),
    ...(protos.data ?? []).map((p: any) => ({ refType: "protocol" as const, refId: p.id, name: p.name })),
  ];
}

/** Opções de coleção-pai (para o seletor de hierarquia). */
export async function listParentOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("id, name").order("name");
  return (data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
}

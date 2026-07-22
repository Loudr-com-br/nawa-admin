import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */
//
// Storefront v2 (spec catalogo-protocolos-v2 §10). Serve APENAS o que é
// published + public. medical_only NUNCA sai — nem dentro do rollup de coleção.
// Nunca servir: cost, external_ref, claim_internal, supplier_id.
// Usa o admin client (service role, ignora RLS) → o filtro é manual e explícito.

/** Itens/SKUs publicados, públicos e que vendem avulso. */
export async function getPublishedItems() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("items")
    .select("slug, name, item_type, pharmaceutical_form, description, composition, price, is_glp1")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("sells_standalone", true)
    .order("name");

  return {
    items: (data ?? []).map((i: any) => ({
      slug: i.slug,
      name: i.name,
      itemType: i.item_type,
      form: i.pharmaceutical_form,
      description: i.description ?? "",
      composition: i.composition ?? {},
      price: Number(i.price),
      isGlp1: i.is_glp1,
    })),
  };
}

/** Protocolos/kits publicados e públicos, com itens. Claim público só se aprovado. */
export async function getPublishedProtocols() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("protocols")
    .select(
      "slug, name, clinical_description, page_content, claim_public, claim_status, price, " +
        "protocol_items(quantity, item:items(name, pharmaceutical_form, composition, visibility))"
    )
    .eq("status", "published")
    .eq("visibility", "public");

  const protocols = (data ?? [])
    // Fail-closed (§7): se algum item virou medical_only depois, o kit não sai.
    .filter((p: any) => !(p.protocol_items ?? []).some((pi: any) => pi.item?.visibility === "medical_only"))
    .map((p: any) => ({
      slug: p.slug,
      name: p.name,
      clinicalDescription: p.clinical_description ?? "",
      pageContent: typeof p.page_content?.body === "string" ? p.page_content.body : "",
      claimPublic: p.claim_status === "approved" ? p.claim_public ?? "" : "",
      price: Number(p.price),
      items: (p.protocol_items ?? []).map((pi: any) => ({
        name: pi.item?.name ?? "",
        form: pi.item?.pharmaceutical_form ?? "",
        composition: pi.item?.composition ?? {},
        quantity: pi.quantity,
      })),
    }));

  return { protocols };
}

/** Coleções publicadas e públicas, com membros e rollup dos filhos — tudo filtrado. */
export async function getPublishedCollections() {
  const supabase = createAdminClient();

  const { data: cols } = await supabase
    .from("collections")
    .select("id, slug, name, description, parent_id")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("order");
  const publicCols = cols ?? [];
  const publicIds = new Set(publicCols.map((c: any) => c.id));

  // Membros de todas as coleções públicas (own + base do rollup).
  const { data: rows } = await supabase
    .from("collection_members")
    .select("collection_id, ref_type, ref_id, order")
    .in("collection_id", publicCols.map((c: any) => c.id).length ? publicCols.map((c: any) => c.id) : ["00000000-0000-0000-0000-000000000000"]);
  const memberRows = rows ?? [];

  // Resolve refs para slug/nome, filtrando published + public.
  const itemIds = memberRows.filter((m: any) => m.ref_type === "item").map((m: any) => m.ref_id);
  const protoIds = memberRows.filter((m: any) => m.ref_type === "protocol").map((m: any) => m.ref_id);
  const [items, protos] = await Promise.all([
    itemIds.length ? supabase.from("items").select("id, slug, name, status, visibility").in("id", itemIds) : Promise.resolve({ data: [] }),
    protoIds.length ? supabase.from("protocols").select("id, slug, name, status, visibility").in("id", protoIds) : Promise.resolve({ data: [] }),
  ]);
  const pub = new Map<string, { slug: string; name: string; refType: string }>();
  for (const i of (items as any).data ?? []) {
    if (i.status === "published" && i.visibility === "public") pub.set(`item:${i.id}`, { slug: i.slug, name: i.name, refType: "item" });
  }
  for (const p of (protos as any).data ?? []) {
    if (p.status === "published" && p.visibility === "public") pub.set(`protocol:${p.id}`, { slug: p.slug, name: p.name, refType: "protocol" });
  }

  // Membros filtrados por coleção.
  const membersByCol = new Map<string, any[]>();
  for (const m of memberRows) {
    const resolved = pub.get(`${m.ref_type}:${m.ref_id}`);
    if (!resolved) continue; // medical_only / não-publicado nunca entra
    if (!membersByCol.has(m.collection_id)) membersByCol.set(m.collection_id, []);
    membersByCol.get(m.collection_id)!.push({ ...resolved, order: m.order ?? 0 });
  }

  // Descendentes (só coleções públicas) para o rollup.
  const childrenOf = new Map<string, any[]>();
  for (const c of publicCols) {
    if (!c.parent_id || !publicIds.has(c.parent_id)) continue;
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c.id);
  }
  const descendantsOf = (id: string): string[] => {
    const out: string[] = [];
    const stack = [...(childrenOf.get(id) ?? [])];
    while (stack.length) { const cur = stack.pop()!; out.push(cur); stack.push(...(childrenOf.get(cur) ?? [])); }
    return out;
  };
  const slugById = new Map(publicCols.map((c: any) => [c.id, c.slug]));

  const collections = publicCols.map((c: any) => {
    const own = (membersByCol.get(c.id) ?? []).sort((a, b) => a.order - b.order);
    const rollup: any[] = [];
    for (const d of descendantsOf(c.id)) rollup.push(...(membersByCol.get(d) ?? []));
    return {
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      parentSlug: c.parent_id && slugById.has(c.parent_id) ? slugById.get(c.parent_id) : null,
      members: own.map((m) => ({ refType: m.refType, slug: m.slug, name: m.name })),
      rollupMembers: rollup.map((m) => ({ refType: m.refType, slug: m.slug, name: m.name })),
    };
  });

  return { collections };
}

/** Formulários de anamnese publicados com perguntas ordenadas. (inalterado v1) */
export async function getPublishedAnamnesis() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("anamnesis_forms")
    .select("slug, name, anamnesis_questions(order, type, label, required, options, conditional_logic)")
    .eq("status", "published");

  return {
    forms: (data ?? []).map((f: any) => ({
      slug: f.slug,
      name: f.name,
      questions: (f.anamnesis_questions ?? [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((q: any) => ({
          order: q.order,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.options ?? [],
          conditional: q.conditional_logic ?? {},
        })),
    })),
  };
}

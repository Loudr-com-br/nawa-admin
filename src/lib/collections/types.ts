// Coleções v2 — categorização mercadológica que absorve jornadas e nomenclatura
// (spec catalogo-protocolos-v2 §5). Plana (parent_id nulo) ou árvore. Membros = item|protocolo.
import type { ContentStatus } from "@/lib/catalog/types";

export type CollectionVisibility = "public" | "internal";
export type CollectionRefType = "item" | "protocol";

export interface CollectionMember {
  id: string; // collection_members.id
  refType: CollectionRefType;
  refId: string;
  order: number;
  name: string; // resolvido (item ou protocolo)
  fromChild?: string; // nome da coleção-filha, quando vem do rollup
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string;
  parentId: string | null;
  visibility: CollectionVisibility;
  status: ContentStatus;
  order: number;
  ownCount: number; // membros diretos
  rollupCount: number; // membros incluindo descendentes
  createdAt: string;
}

/** Nó da árvore de coleções (para a UI hierárquica). */
export interface CollectionNode extends Collection {
  children: CollectionNode[];
  depth: number;
}

export interface CollectionDetail extends Collection {
  parentName: string | null;
  members: CollectionMember[]; // diretos
  rollupMembers: CollectionMember[]; // dos descendentes (não duplica linha)
}

/** Opção do seletor de membro (item ou protocolo do catálogo). */
export interface MemberOption {
  refType: CollectionRefType;
  refId: string;
  name: string;
}

export const collectionVisibilityLabels: Record<CollectionVisibility, string> = {
  public: "Pública",
  internal: "Interna",
};

export const refTypeLabels: Record<CollectionRefType, string> = {
  item: "Item",
  protocol: "Protocolo",
};

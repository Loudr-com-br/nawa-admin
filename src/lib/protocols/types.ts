import type { ContentStatus } from "@/lib/catalog/types";

export type PharmaceuticalForm =
  | "capsule"
  | "sachet"
  | "sublingual"
  | "topical"
  | "other";

export type Supplier = "botane" | "partner";

export interface Formula {
  id: string;
  protocolId: string;
  name: string;
  pharmaceuticalForm: PharmaceuticalForm;
  dosage: string;
  supplier: Supplier;
  isGlp1: boolean;
  externalRef: string | null;
  eligibilityNotes: string;
  createdAt: string;
}

export interface Protocol {
  id: string;
  slug: string;
  name: string;
  clinicalDescription: string;
  externalRef: string | null;
  status: ContentStatus;
  formulaCount: number;
  createdAt: string;
}

export interface ProtocolDetail extends Protocol {
  formulas: Formula[];
}

export const pharmaceuticalForms: PharmaceuticalForm[] = [
  "capsule",
  "sachet",
  "sublingual",
  "topical",
  "other",
];

export const formLabels: Record<PharmaceuticalForm, string> = {
  capsule: "Cápsula",
  sachet: "Sachê",
  sublingual: "Sublingual",
  topical: "Tópico",
  other: "Outro",
};

export const supplierLabels: Record<Supplier, string> = {
  botane: "Botane",
  partner: "Parceiro",
};

import type { ContentStatus } from "@/lib/catalog/types";

export type QuestionType =
  | "text"
  | "number"
  | "boolean"
  | "single_choice"
  | "multiple_choice"
  | "scale";

export interface Conditional {
  dependsOn?: string;
  equals?: string | number | boolean;
}

export interface Question {
  id: string;
  formId: string;
  order: number;
  type: QuestionType;
  label: string;
  required: boolean;
  riskWeight: number;
  options: string[];
  conditional: Conditional;
}

export interface AnamnesisForm {
  id: string;
  slug: string;
  name: string;
  status: ContentStatus;
  questionCount: number;
  createdAt: string;
}

export interface AnamnesisFormDetail extends AnamnesisForm {
  questions: Question[];
}

export const questionTypes: QuestionType[] = [
  "text",
  "number",
  "boolean",
  "single_choice",
  "multiple_choice",
  "scale",
];

export const questionTypeLabels: Record<QuestionType, string> = {
  text: "Texto",
  number: "Número",
  boolean: "Sim / Não",
  single_choice: "Escolha única",
  multiple_choice: "Múltipla escolha",
  scale: "Escala (0–10)",
};

/** Tipos que exigem lista de opções. */
export const typesWithOptions: QuestionType[] = ["single_choice", "multiple_choice"];

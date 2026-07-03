export type AttributeScope = "catalog" | "protocol" | "journey";

export interface Attribute {
  id: string;
  scope: AttributeScope;
  key: string;
  label: string;
  type: string;
  createdAt: string;
}

export const scopeLabels: Record<AttributeScope, string> = {
  catalog: "Catálogo",
  protocol: "Protocolo",
  journey: "Jornada",
};

export const attributeTypes = ["text", "number", "boolean", "date", "select"] as const;

export const typeLabels: Record<string, string> = {
  text: "Texto",
  number: "Número",
  boolean: "Booleano",
  date: "Data",
  select: "Seleção",
};

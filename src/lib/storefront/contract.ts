import { z } from "zod";

/**
 * Contrato da Storefront (lado PRODUTOR). Espelha os schemas do front
 * (`frontoffice-nawa/src/lib/storefront/schema.ts`) — os dois repos são
 * independentes (spec §1), então o contrato é duplicado de propósito; estes
 * schemas são o ponto de reconciliação. Servem como auto-verificação: em
 * não-produção, `storefrontJson` valida a saída contra eles e falha ALTO no
 * teste/CI se o backoffice produzir um shape fora do contrato.
 *
 * Aditivo-safe: campos extras (ex.: `total`/`page` na paginação de items) são
 * ignorados pelo zod; só erra quando um campo do contrato some ou muda de tipo.
 */

const composition = z.record(z.string(), z.unknown());

const ItemSchema = z.object({
  slug: z.string(),
  name: z.string(),
  itemType: z.string(),
  form: z.string(),
  description: z.string(),
  composition,
  price: z.number(),
  isGlp1: z.boolean(),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

const ProtocolSchema = z.object({
  slug: z.string(),
  name: z.string(),
  clinicalDescription: z.string(),
  pageContent: z.string(),
  claimPublic: z.string(),
  price: z.number(),
  items: z.array(
    z.object({ name: z.string(), form: z.string(), composition, quantity: z.number() }),
  ),
  imageUrl: z.string().optional(),
});

const CollectionMemberSchema = z.object({
  refType: z.enum(["item", "protocol"]),
  slug: z.string(),
  name: z.string(),
  imageUrl: z.string().optional(),
});

const CollectionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  parentSlug: z.string().nullable(),
  members: z.array(CollectionMemberSchema),
  rollupMembers: z.array(CollectionMemberSchema),
  imageUrl: z.string().optional(),
});

const AnamnesisFormSchema = z.object({
  slug: z.string(),
  name: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      type: z.enum(["text", "number", "boolean", "single_choice", "multiple_choice", "scale"]),
      label: z.string(),
      required: z.boolean(),
      options: z.array(z.string()),
      conditional: z.object({
        dependsOn: z.string().optional(),
        equals: z.union([z.string(), z.number(), z.boolean()]).optional(),
      }),
    }),
  ),
});

export const CONTRACT = {
  items: z.object({ items: z.array(ItemSchema) }),
  protocols: z.object({ protocols: z.array(ProtocolSchema) }),
  collections: z.object({ collections: z.array(CollectionSchema) }),
  anamnesis: z.object({ forms: z.array(AnamnesisFormSchema) }),
  search: z.object({
    results: z.array(
      z.object({
        refType: z.enum(["item", "protocol"]),
        slug: z.string(),
        name: z.string(),
        price: z.number(),
        imageUrl: z.string().optional(),
      }),
    ),
  }),
} as const;

export type ContractKey = keyof typeof CONTRACT;

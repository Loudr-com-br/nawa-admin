import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
//
// MAPEAMENTO SIMPLES score → recomendação.  ⚠️ PLACEHOLDER.
// A regra real (qual anamnese → qual protocolo + upsells) é decisão
// clínica/comercial ainda em aberto. Aqui vai um stand-in determinístico só
// para destravar o loop anamnese → carrinho: escolhe o protocolo por faixa de
// score (mais intenso = mais caro) e sugere alguns itens avulsos como upsell.
// Trocar por uma config/motor de regras quando a NAWA definir.

export type Band = "low" | "moderate" | "high";

export interface RecoRef {
  id: string; // uso interno (linha do carrinho); não exposto na API
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
}
export interface Recommendation {
  protocol: RecoRef | null;
  upsells: RecoRef[];
}

export function bandFromScore(score: number): Band {
  return score < 34 ? "low" : score < 67 ? "moderate" : "high";
}

export async function buildRecommendation(sb: any, band: Band): Promise<Recommendation> {
  // Protocolos publicados e públicos, do mais barato ao mais caro.
  const { data: protos } = await sb
    .from("protocols")
    .select("id, slug, name, price, image_url")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("price", { ascending: true });

  const list: any[] = protos ?? [];
  let protocol: RecoRef | null = null;
  if (list.length) {
    // faixa → índice (placeholder: baixo=base, alto=mais completo)
    const idx = band === "low" ? 0 : band === "high" ? list.length - 1 : Math.floor((list.length - 1) / 2);
    const p = list[idx];
    protocol = { id: p.id, slug: p.slug, name: p.name, price: Number(p.price), imageUrl: p.image_url ?? "" };
  }

  // Upsells: itens avulsos publicados e públicos (top 3 mais baratos).
  const { data: items } = await sb
    .from("items")
    .select("id, slug, name, price, image_url")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("sells_standalone", true)
    .order("price", { ascending: true })
    .limit(3);

  const upsells: RecoRef[] = ((items ?? []) as any[]).map((i) => ({
    id: i.id, slug: i.slug, name: i.name, price: Number(i.price), imageUrl: i.image_url ?? "",
  }));

  return { protocol, upsells };
}

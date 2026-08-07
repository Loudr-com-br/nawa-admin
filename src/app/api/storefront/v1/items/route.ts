import { guardStorefront } from "@/lib/storefront/guard";
import { getPublishedItems } from "@/lib/storefront/read";
import { storefrontJson } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

// GET /api/storefront/v1/items?q=&page=&limit=  (busca/paginação aditivas)
export async function GET(request: Request) {
  const guard = await guardStorefront(request);
  if (!guard.ok) return guard.response;
  const sp = new URL(request.url).searchParams;
  const q = sp.get("q") ?? undefined;
  const page = sp.get("page") ? Number(sp.get("page")) : undefined;
  const limit = sp.get("limit") ? Math.min(100, Number(sp.get("limit")) || 24) : undefined;
  return storefrontJson(await getPublishedItems({ q, page, limit }), STOREFRONT_TAGS.items, "items", guard.rateLimit);
}

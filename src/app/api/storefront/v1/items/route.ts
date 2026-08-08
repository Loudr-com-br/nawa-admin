import { serveStorefront } from "@/lib/storefront/guard";
import { getPublishedItems } from "@/lib/storefront/read";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

// GET /api/storefront/v1/items?q=&page=&limit=  (busca/paginação aditivas)
export async function GET(request: Request) {
  return serveStorefront(request, { tag: STOREFRONT_TAGS.items, contract: "items" }, () => {
    const sp = new URL(request.url).searchParams;
    const q = sp.get("q") ?? undefined;
    const page = sp.get("page") ? Number(sp.get("page")) : undefined;
    const limit = sp.get("limit") ? Math.min(100, Number(sp.get("limit")) || 24) : undefined;
    return getPublishedItems({ q, page, limit });
  });
}

import { serveStorefront } from "@/lib/storefront/guard";
import { searchCatalog } from "@/lib/storefront/read";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

// GET /api/storefront/v1/search?q=&limit=  (itens + protocolos, fail-closed)
export async function GET(request: Request) {
  return serveStorefront(request, { tag: STOREFRONT_TAGS.items, contract: "search" }, () => {
    const sp = new URL(request.url).searchParams;
    const q = sp.get("q") ?? "";
    const limit = Math.min(50, Number(sp.get("limit")) || 20);
    return searchCatalog(q, limit);
  });
}

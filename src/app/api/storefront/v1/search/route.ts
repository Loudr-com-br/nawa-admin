import { authenticateStorefront } from "@/lib/storefront/auth";
import { searchCatalog } from "@/lib/storefront/read";
import { storefrontJson, storefrontUnauthorized } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

// GET /api/storefront/v1/search?q=&limit=  (itens + protocolos, fail-closed)
export async function GET(request: Request) {
  if (!(await authenticateStorefront(request))) return storefrontUnauthorized();
  const sp = new URL(request.url).searchParams;
  const q = sp.get("q") ?? "";
  const limit = Math.min(50, Number(sp.get("limit")) || 20);
  return storefrontJson(await searchCatalog(q, limit), STOREFRONT_TAGS.items, "search");
}

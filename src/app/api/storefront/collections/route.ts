import { authenticateStorefront } from "@/lib/storefront/auth";
import { getPublishedCollections } from "@/lib/storefront/read";
import { storefrontJson, storefrontUnauthorized } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

export async function GET(request: Request) {
  if (!(await authenticateStorefront(request))) return storefrontUnauthorized();
  return storefrontJson(await getPublishedCollections(), STOREFRONT_TAGS.collections);
}

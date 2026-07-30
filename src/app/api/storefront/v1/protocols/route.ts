import { authenticateStorefront } from "@/lib/storefront/auth";
import { getPublishedProtocols } from "@/lib/storefront/read";
import { storefrontJson, storefrontUnauthorized } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

export async function GET(request: Request) {
  if (!(await authenticateStorefront(request))) return storefrontUnauthorized();
  return storefrontJson(await getPublishedProtocols(), STOREFRONT_TAGS.protocols);
}

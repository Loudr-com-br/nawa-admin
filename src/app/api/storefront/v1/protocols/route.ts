import { guardStorefront } from "@/lib/storefront/guard";
import { getPublishedProtocols } from "@/lib/storefront/read";
import { storefrontJson } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

export async function GET(request: Request) {
  const guard = await guardStorefront(request);
  if (!guard.ok) return guard.response;
  return storefrontJson(await getPublishedProtocols(), STOREFRONT_TAGS.protocols, "protocols", guard.rateLimit);
}

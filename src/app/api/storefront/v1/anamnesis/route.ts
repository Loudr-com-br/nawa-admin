import { guardStorefront } from "@/lib/storefront/guard";
import { getPublishedAnamnesis } from "@/lib/storefront/read";
import { storefrontJson } from "@/lib/storefront/response";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

export async function GET(request: Request) {
  const guard = await guardStorefront(request);
  if (!guard.ok) return guard.response;
  return storefrontJson(await getPublishedAnamnesis(), STOREFRONT_TAGS.anamnesis, "anamnesis", guard.rateLimit);
}

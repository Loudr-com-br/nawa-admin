import { authenticateStorefront } from "@/lib/storefront/auth";
import { getPublishedProtocols } from "@/lib/storefront/read";
import { storefrontJson, storefrontUnauthorized } from "@/lib/storefront/response";

export async function GET(request: Request) {
  if (!(await authenticateStorefront(request))) return storefrontUnauthorized();
  return storefrontJson(await getPublishedProtocols());
}

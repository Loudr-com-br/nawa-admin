import { serveStorefront } from "@/lib/storefront/guard";
import { getPublishedCollections } from "@/lib/storefront/read";
import { STOREFRONT_TAGS } from "@/lib/storefront/purge";

export async function GET(request: Request) {
  return serveStorefront(request, { tag: STOREFRONT_TAGS.collections, contract: "collections" }, () =>
    getPublishedCollections(),
  );
}

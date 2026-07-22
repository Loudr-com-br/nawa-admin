import { listCollections, listParentOptions } from "@/lib/collections/queries";
import CollectionsClient from "./CollectionsClient";

export default async function CollectionsPage() {
  const [tree, parents] = await Promise.all([listCollections(), listParentOptions()]);
  return <CollectionsClient tree={tree} parents={parents} />;
}

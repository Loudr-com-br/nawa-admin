import { notFound } from "next/navigation";
import { getCollectionById, listMemberOptions, listParentOptions } from "@/lib/collections/queries";
import CollectionDetailClient from "./CollectionDetailClient";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [collection, memberOptions, parents] = await Promise.all([
    getCollectionById(id),
    listMemberOptions(),
    listParentOptions(),
  ]);
  if (!collection) notFound();
  return (
    <CollectionDetailClient
      collection={collection}
      memberOptions={memberOptions}
      parents={parents.filter((p) => p.id !== id)}
    />
  );
}

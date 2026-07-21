import { notFound } from "next/navigation";
import { getItemById } from "@/lib/catalog/queries";
import ItemDetailClient from "./ItemDetailClient";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();
  return <ItemDetailClient item={item} />;
}

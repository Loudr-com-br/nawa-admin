import { notFound } from "next/navigation";
import { getProtocolById } from "@/lib/protocols/queries";
import { listItems } from "@/lib/catalog/queries";
import ProtocolDetailClient from "./ProtocolDetailClient";

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [protocol, items] = await Promise.all([getProtocolById(id), listItems()]);
  if (!protocol) notFound();
  return <ProtocolDetailClient protocol={protocol} catalogItems={items} />;
}

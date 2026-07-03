import { notFound } from "next/navigation";
import { getFormById } from "@/lib/anamnesis/queries";
import AnamnesisBuilderClient from "./AnamnesisBuilderClient";

export default async function AnamnesisBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await getFormById(id);
  if (!form) notFound();
  return <AnamnesisBuilderClient form={form} />;
}

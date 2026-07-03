import { notFound } from "next/navigation";
import { getJourneyById, listPlanOptions } from "@/lib/journeys/queries";
import JourneyDetailClient from "./JourneyDetailClient";

export default async function JourneyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [journey, planOptions] = await Promise.all([
    getJourneyById(id),
    listPlanOptions(),
  ]);
  if (!journey) notFound();
  return <JourneyDetailClient journey={journey} planOptions={planOptions} />;
}

import { listJourneys } from "@/lib/journeys/queries";
import JourneysClient from "./JourneysClient";

export default async function JourneysPage() {
  const journeys = await listJourneys();
  return <JourneysClient journeys={journeys} />;
}

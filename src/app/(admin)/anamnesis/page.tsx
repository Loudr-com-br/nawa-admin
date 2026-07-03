import { listForms } from "@/lib/anamnesis/queries";
import AnamnesisClient from "./AnamnesisClient";

export default async function AnamnesisPage() {
  const forms = await listForms();
  return <AnamnesisClient forms={forms} />;
}

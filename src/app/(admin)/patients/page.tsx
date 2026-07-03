import { listPatients } from "@/lib/patients/queries";
import PatientsClient from "./PatientsClient";

export default async function PatientsPage() {
  const patients = await listPatients();
  return <PatientsClient patients={patients} />;
}

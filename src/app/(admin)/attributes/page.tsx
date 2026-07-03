import { listAttributes } from "@/lib/attributes/queries";
import AttributesClient from "./AttributesClient";

export default async function AttributesPage() {
  const attributes = await listAttributes();
  return <AttributesClient attributes={attributes} />;
}

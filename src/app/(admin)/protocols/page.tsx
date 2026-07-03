import { listProtocols } from "@/lib/protocols/queries";
import ProtocolsClient from "./ProtocolsClient";

export default async function ProtocolsPage() {
  const protocols = await listProtocols();
  return <ProtocolsClient protocols={protocols} />;
}

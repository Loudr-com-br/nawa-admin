import { listApiKeys } from "@/lib/api-keys/queries";
import ApiKeysClient from "./ApiKeysClient";

export default async function ApiKeysPage() {
  const apiKeys = await listApiKeys();
  return <ApiKeysClient apiKeys={apiKeys} />;
}

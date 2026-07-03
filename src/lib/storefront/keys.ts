import "server-only";
import { createHash, randomBytes } from "crypto";

const PREFIX = "nawa_sk_";

/** Gera uma chave nova: texto puro (mostrado uma vez), hash e prefixo. */
export function generateApiKey() {
  const raw = PREFIX + randomBytes(24).toString("base64url");
  return { raw, hash: hashApiKey(raw), prefix: raw.slice(0, 12) };
}

/** Hash determinístico para armazenar/comparar — nunca guardamos o texto puro. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

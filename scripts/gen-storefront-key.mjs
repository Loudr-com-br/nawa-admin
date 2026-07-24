// Gera uma chave da Storefront (escopo read) direto no banco, imprimindo o
// texto puro uma vez. Mesma lógica de src/lib/storefront/keys.ts.
// Uso: node --env-file=.env.local scripts/gen-storefront-key.mjs "nome"
import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";

const name = process.argv[2] || "frontoffice local (dev)";
const raw = "nawa_sk_" + randomBytes(24).toString("base64url");
const hash = createHash("sha256").update(raw).digest("hex");
const prefix = raw.slice(0, 12);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { error } = await supabase.from("api_keys").insert({
  name,
  key_hash: hash,
  key_prefix: prefix,
  scope: "read",
  status: "active",
});

if (error) {
  console.error("ERRO:", error.message);
  process.exit(1);
}
console.log(raw);

/**
 * Concede papel super_admin a um usuário interno já existente no Auth.
 *
 * Fluxo:
 *   1. Crie o usuário no painel do Supabase (Authentication → Users → Add user)
 *      com o e-mail e a senha que você escolher.
 *   2. Rode: node --env-file=.env.local scripts/seed-admin.mjs <email>
 *
 * Usa a SERVICE_ROLE_KEY (server-side) — nunca commitar o .env.local.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node --env-file=.env.local scripts/seed-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Procura o usuário no Auth pelo e-mail (paginando).
async function findAuthUser(targetEmail) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

const user = await findAuthUser(email);
if (!user) {
  console.error(
    `Usuário "${email}" não encontrado no Auth.\n` +
    `Crie-o primeiro no painel: Authentication → Users → Add user.`
  );
  process.exit(1);
}

const { error } = await supabase.from("users_internal").upsert(
  { id: user.id, email, role: "super_admin", status: "active" },
  { onConflict: "id" }
);
if (error) {
  console.error("Falha ao gravar users_internal:", error.message);
  process.exit(1);
}

console.log(`✓ ${email} agora é super_admin (users_internal.id = ${user.id}).`);

/**
 * Cria (ou reusa) um usuário no Supabase Auth e concede um papel em users_internal.
 *
 * Diferença para o `seed-admin.mjs`: aquele exige que o usuário JÁ exista no Auth
 * (criado à mão no painel) e concede sempre `super_admin`. Este cria a conta também,
 * e o papel é argumento — porque `app_role` tem quatro valores e o default da coluna
 * (`operator`) não é o que se quer na maioria das vezes.
 *
 * Usuário interno não nasce no signup por decisão de arquitetura (ver
 * 20260702120002_rbac.sql): `auth.users` é compartilhado com os pacientes do front, e
 * o que torna alguém interno é a linha em `users_internal`. Por isso os dois passos.
 *
 * Uso:
 *   node --env-file=<env> scripts/create-internal-user.mjs <email> <senha> <papel> [--yes]
 *
 * Sem `--yes` faz DRY-RUN: mostra em qual projeto Supabase iria escrever e sai sem
 * tocar em nada. Como isto costuma rodar contra produção, confirmar o alvo antes de
 * escrever é barato e o engano é caro.
 *
 * Nunca imprime segredos — só o host do projeto, que não é credencial.
 */
import { createClient } from "@supabase/supabase-js";

const ROLES = ["super_admin", "catalog_admin", "doctor", "operator"];

const [email, password, role] = process.argv.slice(2);
const confirmed = process.argv.includes("--yes");

const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!email || !password || !role) {
  die(
    "Uso: node --env-file=<env> scripts/create-internal-user.mjs <email> <senha> <papel> [--yes]\n" +
      `Papéis: ${ROLES.join(" | ")}`
  );
}
if (!ROLES.includes(role)) {
  die(`Papel inválido: "${role}". Use um de: ${ROLES.join(" | ")}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  die("Faltam NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no env-file.");
}

const host = new URL(url).host;
console.log(`Projeto Supabase alvo : ${host}`);
console.log(`Conta                 : ${email}`);
console.log(`Papel                 : ${role}`);

if (!confirmed) {
  console.log("\nDRY-RUN — nada foi escrito. Confirme o projeto acima e repita com --yes.");
  process.exit(0);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Procura no Auth pelo e-mail, paginando (não há lookup por e-mail na admin API). */
async function findAuthUser(target) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

// 1) Conta no Auth. Idempotente: se já existe, reusa em vez de falhar — rodar de novo
//    não pode virar erro nem sobrescrever a senha de alguém sem querer.
let user = await findAuthUser(email);
if (user) {
  console.log(`\n· Auth: usuário já existia (${user.id}) — senha NÃO foi alterada.`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    // Sem isto a conta nasce pendente de confirmação e não consegue logar. É um
    // usuário interno provisionado deliberadamente, não um cadastro público.
    email_confirm: true,
  });
  if (error) die(`Falha ao criar no Auth: ${error.message}`);
  user = data.user;
  console.log(`\n· Auth: usuário criado (${user.id}).`);
}

// 2) Papel interno. Upsert por id — é o que torna a conta "interna".
const { error: roleError } = await supabase
  .from("users_internal")
  .upsert({ id: user.id, email, role, status: "active" }, { onConflict: "id" });
if (roleError) die(`Falha ao gravar users_internal: ${roleError.message}`);

console.log(`· users_internal: ${email} → ${role} (status=active).`);

// 3) Lê de volta: confirma o que ficou gravado em vez de confiar no retorno do upsert.
const { data: check, error: checkError } = await supabase
  .from("users_internal")
  .select("id, email, role, status")
  .eq("id", user.id)
  .single();
if (checkError) die(`Gravou, mas a releitura falhou: ${checkError.message}`);

console.log("\n✓ Confirmado no banco:", check);

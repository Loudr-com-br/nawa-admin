/**
 * Aplica as migrations em um projeto Supabase ALVO — staging ou produção.
 *
 * Existe porque as migrations vinham sendo aplicadas à mão, sem registro de
 * qual ambiente recebeu o quê. Isso funciona enquanto há um ambiente só; deixa
 * de funcionar no minuto em que existe staging, que é justamente o objetivo.
 *
 * Segue a convenção do `create-internal-user.mjs`: sem `--yes` é DRY-RUN, e o
 * dry-run imprime o HOST do alvo — confirmar contra qual banco se está prestes
 * a escrever é barato, e o engano é caro. Nenhum segredo é impresso.
 *
 * Uso:
 *   node scripts/db-migrate.mjs --db-url="postgresql://..." [--yes]
 *   node scripts/db-migrate.mjs --env=.env.staging [--yes]
 *
 * A URL de conexão está no painel do Supabase em Project Settings → Database →
 * Connection string (URI). Não é a mesma coisa que a NEXT_PUBLIC_SUPABASE_URL.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { execFileSync } from "child_process";

const arg = (nome) => {
  const achado = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.slice(nome.length + 3) : undefined;
};
const confirmado = process.argv.includes("--yes");

const morrer = (msg) => {
  console.error(msg);
  process.exit(1);
};

/** Lê a URL de conexão de um arquivo .env sem carregá-lo no processo. */
function dbUrlDeArquivo(caminho) {
  if (!existsSync(caminho)) morrer(`Arquivo não encontrado: ${caminho}`);
  const linha = readFileSync(caminho, "utf8")
    .split("\n")
    .find((l) => l.startsWith("SUPABASE_DB_URL="));
  if (!linha) morrer(`SUPABASE_DB_URL não está em ${caminho}`);
  return linha.slice("SUPABASE_DB_URL=".length).trim().replace(/^["']|["']$/g, "");
}

const dbUrl = arg("db-url") ?? (arg("env") ? dbUrlDeArquivo(arg("env")) : process.env.SUPABASE_DB_URL);

if (!dbUrl) {
  morrer(
    "Informe o banco alvo:\n" +
      "  node scripts/db-migrate.mjs --db-url='postgresql://...' [--yes]\n" +
      "  node scripts/db-migrate.mjs --env=.env.staging [--yes]",
  );
}

// Só o host é seguro de imprimir — a URL de conexão carrega a senha.
let host;
try {
  host = new URL(dbUrl).host;
} catch {
  morrer("A URL informada não é uma connection string válida do Postgres.");
}

const migrations = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();

console.log(`\nAlvo:       ${host}`);
console.log(`Migrations: ${migrations.length} arquivo(s)`);
console.log(`  primeira: ${migrations[0]}`);
console.log(`  última:   ${migrations[migrations.length - 1]}\n`);

if (!confirmado) {
  console.log("DRY-RUN — nada foi aplicado. Confira o host acima e repita com --yes.\n");
  process.exit(0);
}

// A CLI do Supabase mantém o registro do que já foi aplicado (schema_migrations),
// então repetir o comando é seguro: só o que falta é executado.
console.log(`Aplicando em ${host}...\n`);
try {
  execFileSync("supabase", ["migration", "up", "--db-url", dbUrl], { stdio: "inherit" });
  console.log(`\nPronto. ${host} está na última migration.\n`);
} catch {
  morrer("\nA aplicação falhou. Nada além do que a CLI já tenha confirmado foi alterado.\n");
}

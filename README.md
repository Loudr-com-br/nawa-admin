# NAWA Backoffice

Painel administrativo da **NAWA Health** — plataforma premium de saúde metabólica contínua.

O backoffice é a **fonte da verdade** da plataforma: é onde a operação configura catálogo,
protocolos, anamnese, jornadas, promoções, papéis de acesso e integrações. O front (paciente
e área médica) é headless e consome o que o backoffice publica via **Storefront API**.

## Documentação

> **Assumindo o projeto agora?** Comece por [`HANDOVER.md`](HANDOVER.md).

| Doc | Conteúdo |
|---|---|
| [`HANDOVER.md`](HANDOVER.md) | Ponto de entrada: por onde começar, contas, o que fazer primeiro |
| [`.spec/spec.md`](.spec/spec.md) | Especificação de produto (fonte da verdade) |
| [`.spec/plan.md`](.spec/plan.md) | Plano de trabalho vivo (o que está feito / a fazer) |
| [`.spec/storefront-api.md`](.spec/storefront-api.md) | Guia da Storefront API para o front |
| [`.spec/escalabilidade.md`](.spec/escalabilidade.md) | Estratégia de escala (cache, purge, fila) |
| [`.spec/ambientes.md`](.spec/ambientes.md) | Ambientes, rigor de configuração e como criar o staging |
| [`.spec/arquitetura.html`](.spec/arquitetura.html) | Mapa visual da plataforma (abrir em servidor local, ver abaixo) |
| [`ds/design.md`](ds/design.md) | Identidade visual / Design System |

## Stack

- [Next.js 15](https://nextjs.org/) — App Router
- [React 19](https://react.dev/) · [TypeScript 5](https://www.typescriptlang.org/)
- [MUI v6](https://mui.com/) — temado pelo Design System da NAWA · [MUI X Charts](https://mui.com/x/react-charts/)
- [Supabase](https://supabase.com/) — Postgres + Auth + RLS
- [Netlify](https://www.netlify.com/) — deploy (Next runtime) e CDN da Storefront

## Módulos

Todos em dados reais (Supabase), atrás de auth + RBAC:

- **Operação:** Dashboard analítico, Pedidos, Assinaturas, Pacientes (ficha 360º)
- **Catálogo & clínica:** Catálogo (planos/produtos), Protocolos + fórmulas (ponte GLP-1),
  Anamnese (form builder), Jornadas, Nomenclatura/Atributos, Promoções
- **Integração:** Storefront API + Chaves de API
- **Sistema:** Configuração (usuários/papéis), Auditoria & LGPD (trilha imutável)

Todas as configurações seguem o **publish model** (rascunho/publicado); só o publicado vai ao front.

## Setup

Requer um projeto Supabase.

1. Copie `.env.local.example` → `.env.local` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...      # server-side, nunca no client
   ```
2. Aplique as migrations (Supabase CLI linkado): `supabase db push`
3. Gere os tipos do banco: `npm run db:types`
4. Crie o primeiro usuário no Auth do Supabase e promova a super admin:
   `npm run seed:admin -- seu-email@dominio.com`

### Dados de exemplo (opcional)

```bash
npm run seed:data           # jornada, planos, protocolos, fórmulas, pacientes, pedidos
npm run seed:subscriptions  # assinaturas
npm run seed:anamnesis      # formulário de anamnese completo
npm run seed:orders         # ~180 pedidos distribuídos em 60 dias (dashboard)
```

## Como rodar

```bash
npm install
# A porta 3200 é convenção do projeto: o .env.local do frontoffice aponta para
# o backoffice em localhost:3200. Sem o -p, o Next sobe na 3000 e o front não acha.
npm run dev -- -p 3200        # protege rotas; redireciona p/ /login
```

```bash
npm run build      # build de produção
npm run start      # servir o build
npm run lint       # eslint (next lint)
```

## Qualidade

Quatro portões rodam no CI (GitHub Actions) em cada pull request e em cada push
para `dev` e `main` — os mesmos comandos que dá para rodar aqui:

```bash
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # Vitest — 36 testes, sem banco, menos de 1s
npm audit --audit-level=high --omit=dev
npm run build      # exercita a validação de ambiente (src/lib/env.ts)
```

Depois de publicar, o **smoke** verifica o ambiente que subiu. Dez verificações,
nenhuma altera dado; a principal é o webhook de pagamento recusando assinatura
inválida. Roda sozinho após push em `main`, uma vez por dia e sob demanda:

```bash
npm run smoke
npm run smoke -- --backoffice=https://... --frontoffice=https://...
```

> **Os testes cobrem o que já quebrou**, não cobertura ampla: ordem dos status do
> pedido, webhook do stub, validação de ambiente, frete resolvido no servidor,
> hash das chaves de API e o sujeito do rate limit.

## Banco de dados

```bash
npm run db:types   # regenera src/lib/supabase/database.types.ts a partir do banco

# Migrations em um projeto alvo. Sem --yes é DRY-RUN e imprime só o host —
# confirmar contra qual banco se está escrevendo é barato, o engano é caro.
node scripts/db-migrate.mjs --db-url="postgresql://..."
node scripts/db-migrate.mjs --db-url="postgresql://..." --yes

# Cria usuário interno (conta no Auth + papel em users_internal) num passo.
node scripts/create-internal-user.mjs email@nawahealth.com.br <senha> <papel> --yes
```

> ⚠️ **Hoje há um projeto Supabase só**, compartilhado entre desenvolvimento e o
> ambiente publicado. Ver [`.spec/ambientes.md`](.spec/ambientes.md) para separar.

## Configuração

`src/lib/env.ts` valida as variáveis com zod, no build e no boot. Em deploy de
produção, **configuração crítica ausente derruba o build** com a lista do que
falta — provedor de pagamento, segredo de webhook e modo de captura não têm valor
padrão. O rigor vem de `CONTEXT` (definido pelo Netlify) e nunca de `NODE_ENV`,
que o `next build` define como produção em qualquer build. Para conferir fora do
Netlify, `ENV_STRICT=true` força.

## Mapa da arquitetura

`.spec/arquitetura.html` é um mapa navegável da plataforma. O Chrome bloqueia
`file://`, então sirva por HTTP:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
# abrir http://127.0.0.1:8080/.spec/arquitetura.html
```

## Storefront API

Contrato de leitura autenticado por chave, servindo só o publicado:

```
GET /api/storefront/catalog     # jornadas, planos, produtos
GET /api/storefront/protocols   # protocolos e fórmulas
GET /api/storefront/anamnesis   # formulários de anamnese
Authorization: Bearer <chave>   # gerada em /api-keys
```

Respostas cacheadas na borda (CDN) com **purge-on-publish**. Detalhes e exemplos em
[`.spec/storefront-api.md`](.spec/storefront-api.md).

## Deploy (Netlify)

Deploy da branch `main`. Configure as mesmas variáveis do `.env.local` em
**Site settings → Environment variables**. No Supabase (Authentication → URL Configuration),
defina a Site URL e as Redirect URLs para o domínio da Netlify.

## Design System

Tokens em [`src/theme/tokens.ts`](src/theme/tokens.ts) + CSS variables em
[`src/app/globals.css`](src/app/globals.css); tema MUI em [`src/theme/theme.ts`](src/theme/theme.ts).
Showcase visual na rota **`/ds`**.

- **Cor primária:** Azul NAWA `#204FF1` · **Escura:** `#0619AD`
- **Tipografia:** AT Aero (fallback: Poppins)
- **Princípio:** light-first, marca como acento, status discretos

## Estrutura

```
src/
  app/
    (admin)/            # shell do backoffice (sidebar + topbar) + módulos
    api/storefront/     # endpoints de leitura do front
    auth/confirm/       # troca de token de e-mail (magic link / reset)
    login/              # tela de login
    ds/                 # showcase do Design System
  components/           # shell, table (DataTable), status chips, primitivas
  lib/
    supabase/           # clients (browser/server/admin), auth, roles, tipos
    <domínio>/          # queries e tipos por módulo (orders, catalog, ...)
    storefront/         # auth por chave, leitura publicada, cache, purge
  theme/                # tokens, tema MUI, ThemeRegistry
supabase/migrations/    # schema, RBAC, RLS
scripts/                # seeds e utilitários
```

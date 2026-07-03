# NAWA Backoffice

Painel administrativo da **NAWA Health** — plataforma premium de saúde metabólica contínua.

O backoffice é a **fonte da verdade** da plataforma: é onde a operação configura catálogo,
protocolos, anamnese, jornadas, promoções, papéis de acesso e integrações. O front (paciente
e área médica) é headless e consome o que o backoffice publica via **Storefront API**.

## Documentação

| Doc | Conteúdo |
|---|---|
| [`.spec/spec.md`](.spec/spec.md) | Especificação de produto (fonte da verdade) |
| [`.spec/plan.md`](.spec/plan.md) | Plano de trabalho vivo (o que está feito / a fazer) |
| [`.spec/storefront-api.md`](.spec/storefront-api.md) | Guia da Storefront API para o front |
| [`.spec/escalabilidade.md`](.spec/escalabilidade.md) | Estratégia de escala (cache, purge, fila) |
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
npm run dev     # http://localhost:3000  (protege rotas; redireciona p/ /login)
```

```bash
npm run build   # build de produção
npm run start   # servir o build
npm run lint    # eslint (next lint)
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

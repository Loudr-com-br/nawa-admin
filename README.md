# NAWA Backoffice

Painel administrativo da **NAWA Health** — plataforma premium de saúde metabólica contínua.

O backoffice é a **fonte da verdade** da plataforma: é onde a operação configura catálogo,
protocolos, anamnese, jornadas, promoções, papéis de acesso e integrações. O front (paciente
e área médica) é headless e consome o que o backoffice publica via Storefront API.

> Especificação completa do produto em [`.spec/spec.md`](.spec/spec.md).

## Stack

- [Next.js 15](https://nextjs.org/) — App Router
- [React 19](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [MUI v6](https://mui.com/) — temado pelo Design System da NAWA
- [Supabase](https://supabase.com/) — Postgres + Auth _(a integrar)_
- [Netlify Functions](https://docs.netlify.com/functions/overview/) — lógica server-side _(a integrar)_

## Design System

Os tokens do DS vivem em [`src/theme/tokens.ts`](src/theme/tokens.ts) e como CSS variables em
[`src/app/globals.css`](src/app/globals.css); o tema MUI é derivado deles em
[`src/theme/theme.ts`](src/theme/theme.ts). A referência visual completa (cores, tipografia,
componentes) fica na rota **`/ds`**. A identidade da marca está documentada em
[`ds/design.md`](ds/design.md).

- **Cor primária:** Azul NAWA `#204FF1`
- **Cor escura:** Azul Escuro `#0619AD`
- **Tipografia:** AT Aero (fallback: Poppins) — Black 900 para display
- **Princípio:** light-first, sólidos, sem gradientes

## Estrutura

```
src/
  app/
    (admin)/          # grupo com o shell do backoffice (sidebar + topbar)
      dashboard/      # e os 14 módulos da seção 5 do spec
      ...
    ds/               # showcase do Design System
    layout.tsx        # root: fontes, MUI cache provider, tema
  components/
    shell/            # AdminShell, Sidebar, Topbar, config de navegação
  ds/                 # componentes do showcase do DS
  theme/              # tokens, tema MUI e ThemeRegistry
```

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000  (redireciona para /dashboard)
```

```bash
npm run build   # build de produção
npm run start   # servir o build
npm run lint    # eslint (next lint)
```

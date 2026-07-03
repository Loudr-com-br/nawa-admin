# NAWA Backoffice — Plano de Trabalho

> Documento vivo. Atualizar conforme avançamos.
> Ordem de construção baseada na seção 11 do [`spec.md`](spec.md).
> Complementos: [`escalabilidade.md`](escalabilidade.md) · [`storefront-api.md`](storefront-api.md)
>
> **Última atualização:** 2026-07-03 (Dashboard analítico — visão geral)

## Legenda

- `[x]` concluído
- `[~]` em andamento / parcial
- `[ ]` pendente

---

## Fase 0 — Fundação técnica

- [x] Migração Vite → **Next.js 15 (App Router) + React 19 + TypeScript**
- [x] **MUI v6** temado pelo Design System da NAWA (`src/theme/`)
- [x] Tokens do DS em TS + CSS variables (`tokens.ts`, `globals.css`)
- [x] Shell do backoffice: sidebar (clara, logo azul) + topbar responsivos
- [x] 14 módulos como cascas navegáveis (`ModulePlaceholder`)
- [x] URLs em inglês, rótulos da UI em português (ex: `/orders` = "Pedidos")
- [x] Showcase do DS preservado em `/ds`
- [x] Config de deploy Netlify (`netlify.toml` + plugin Next)
- [x] **Supabase**: projeto "Nawa DB" criado e linkado, `.env.local` configurado, clients (browser/server) tipados, middleware com proteção gated
- [x] **Supabase Auth**: login (`/login` split-screen), sign out, proteção de rotas, `/auth/confirm` (magic link/reset), 1º super admin criado. MFA fica para o endurecimento
- [x] **Schema inicial** (§6): migrations aplicadas (18 tabelas + `order_events`)
- [x] **RLS + RBAC base** (§7): papéis, funções e políticas aplicados
- [x] Tipos TS do banco gerados (`src/lib/supabase/database.types.ts`, `npm run db:types`)
- [x] Seed de dados de exemplo (`npm run seed:data`: jornada, planos, 16 pedidos, etc.)
- [x] Padrão de dados reais estabelecido (server fetch + client table; Server Actions para mutação)

## Fase 0.5 — Padrões de UI (transversais)

- [x] Direção visual: **leve, marca como acento, cor só quando carrega significado**
- [x] `DataTable` reutilizável: ordenação por header, paginação (10 padrão + seletor), contagem
- [x] Indicadores de status discretos (`StatusChip` ponto+rótulo, `Glp1Tag`)
- [x] Primitivas de detalhe (`SectionCard`, `DefRow`)
- [ ] Estados vazios / erro / loading padronizados
- [ ] Toasts e confirmações de ação
- [x] Formulário padrão criar/editar (diálogo + Server Action) — 1ª versão em Atributos

---

## Fase 1 — Núcleo do backoffice (ordem do §11)

### 1. Nomenclatura e atributos (`/attributes`) — §5.9
A taxonomia precede o catálogo.
- [x] CRUD de atributos (criar/editar/excluir) em dados reais — padrão de formulário estabelecido
- [ ] Categorias e tags; vínculo com entidades (`entity_attributes`)

### 2. Integração Botane — entrada (`/botane-sync`) — §5.11 / §9.1
- [ ] Mapear o que a Botane expõe (API, arquivo, fila) — **decisão em aberto**
- [ ] Importação de fórmulas/itens com `external_ref`
- [ ] `botane_sync_log`: o que entrou, mudou e falhou
- [ ] Resolução de conflitos (nada sobrescrito às cegas)

### 3. Catálogo (`/catalog`) — §5.5
- [x] Planos: CRUD (preço base, recorrência, inclusões, jornada) em dados reais
- [x] Produtos comerciais: CRUD (referência plano/fórmula, add-on)
- [x] **Publish model** (rascunho/publicado) via `PublishStatusChip` — só publicado vai ao front
- [ ] Ligar a publicação real à Storefront API (quando existir)

### 4. Protocolos e fórmulas (`/protocols`) — §5.6
Módulo mais estratégico.
- [x] CRUD de protocolos (lista + detalhe) com múltiplas fórmulas, publish model e origem Botane
- [x] Fórmulas: formas farmacêuticas, dosagem, elegibilidade, fornecedor + **ponte do GLP-1**
- [ ] Prescription blocks configuráveis (fase seguinte)

### 5. Anamnese (`/anamnesis`) — §5.7
- [x] Construtor (form builder): lista de formulários + builder `/anamnesis/[id]`
- [x] Perguntas com tipos (texto/número/booleano/escolha/escala), opções, obrigatoriedade, reordenação
- [x] Lógica condicional (exibir se…) e peso de risco (score máximo agregado)
- [ ] Geração de perfil metabólico / contraindicações (fase seguinte, no front)
- [ ] Contrato de leitura para o front renderizar (via Storefront API)

### 6. Jornadas (`/journeys`) — §5.8
- [x] Lista + detalhe: amarração de planos (vincular/desvincular) e conteúdo (tagline/descrição/destaques)
- [x] Publish model; estrutura pronta para jornadas futuras

### 7. Storefront API + chaves (`/api-keys`) — §5.12 / §9.2
- [x] Contrato de leitura (`/api/storefront/{catalog,protocols,anamnesis}`) — só `status = published`
- [x] Geração/revogação/rotação de chaves (guardadas como hash, escopo leitura, `last_used_at`)
- [x] Endpoints (Route Handlers) validando a chave via header Bearer; middleware libera a rota
- [x] Escala (quick wins): cache de borda (`s-maxage`+`stale-while-revalidate`+`Vary`), `last_used_at` com throttle (não grava por request) — ver [`escalabilidade.md`](escalabilidade.md)
- [x] Guia da API para o front: [`storefront-api.md`](storefront-api.md)
- [ ] Purge/revalidate no publish; rate limiting; versionamento `v1`
- [ ] Mover para Netlify Functions no deploy (hoje Route Handlers do Next servem o mesmo contrato)

### 8. Promoções (`/promotions`) — §5.10
- [x] CRUD de cupons: código, tipo (percentual/valor fixo), valor, período de vigência, publish
- [ ] Aplicação/validação no checkout (endpoint server-side dedicado — evitar listar códigos)

### 9. Botane — saída + Configuração de sistema — §5.13 / §9.1
- [ ] Envio do pedido para produção (direção `order`)
- [x] Configuração (`/settings`): usuários internos + papéis (convidar, trocar papel, ativar/desativar) — restrito ao super_admin; aba de integrações (informativa)
- [ ] Integrações editáveis + parâmetros de ambiente

### 10. Pacientes e Assinaturas — §5.3 / §5.4
- [x] Pacientes: lista + ficha 360º (cadastro, assinaturas, histórico de pedidos, status clínico)
- [x] Assinaturas: lista + operações (pausar/reativar/retentar, cancelar, mudar plano) em dados reais
- [ ] Anamnese respondida e prescrições na ficha (quando houver respostas do front)

### 11. Pedidos e Dashboard — §5.2 / §5.1
- [x] **Pedidos**: lista + detalhe em **dados reais** do Supabase (RLS + queries tipadas)
- [x] **Dashboard**: métricas reais (pedidos, assinaturas ativas, MRR, pacientes), pedidos recentes e alertas (inadimplentes, sync Botane)

---

## Fase 2 — Segurança, pagamento e conformidade — §8

- [x] Auditoria (`/audit`): trilha imutável (ator, ação, entidade, mudança, IP, horário) — instrumentadas ações de usuários, chaves e assinaturas; restrito ao super_admin
- [ ] Instrumentar mais ações (publicação, dado clínico) e leitura de dado sensível
- [ ] Endurecimento de RLS por papel
- [ ] **Pagamento (Pagar.me)**: tokenização, cobrança server-side, webhooks assinados, idempotência
- [ ] LGPD: consentimento, exclusão/portabilidade, retenção mínima
- [ ] Integridade de prescrição (não editável após emissão)

## Fase 3 — Fase seguinte (§5, módulos posteriores)

- [ ] Conteúdo (headless, servido pela Storefront API)
- [ ] Notificações (email/WhatsApp, integra Hubspot)
- [ ] Observabilidade (webhooks falhos, sync quebrado, erros)

---

## Decisões em aberto (§9.3 / §12)

- [ ] **Emissão fiscal / fulfillment**: quem é o responsável fiscal (NAWA, Botane ou nota dividida). Bloqueia o fluxo de pagamento ponta a ponta.
- [ ] **Integração Botane**: automática via API ou manual por operador no MVP.
- [ ] **GLP-1 original**: NAWA intermedia a compra ou só indica o parceiro.
- [ ] **Assinatura digital de prescrição**: provedor e lead time.
- [ ] Nomenclatura interna: confirmar termos do cliente para plano/protocolo/fórmula.

---

## Notas de progresso

- **2026-07-02** — Fundação técnica migrada para Next.js + MUI. Módulo Pedidos aprofundado (lista + detalhe) como referência de padrão. UI reformulada para visual leve (marca como acento, status discretos). URLs padronizadas em inglês. `DataTable` reutilizável com ordenação/paginação/contagem.
- **2026-07-02** — Supabase: código da fundação pronto (clients browser/server, middleware com proteção gated, `/login`, sign out, papel real no topbar). Migrations escritas: schema §6, RBAC e RLS §7. **Aguardando**: criar projeto no Supabase, preencher `.env.local` e aplicar as migrations.
- **2026-07-02** — Supabase ativado via CLI: projeto "Nawa DB" linkado, `.env.local` configurado (segredos fora do git), 3 migrations aplicadas (schema/RBAC/RLS), tipos TS gerados, clients tipados. Proteção de rotas confirmada (307 → /login). Script `scripts/seed-admin.mjs` pronto. **Falta**: criar o 1º usuário no Auth e rodar `npm run seed:admin`.
- **2026-07-02** — Vertical slice completo em dados reais: super admin criado, seed de dados (16 pedidos), **Pedidos** (lista+detalhe) e **Nomenclatura/Atributos** (CRUD) ligados ao Supabase. Login split-screen na identidade NAWA + `/auth/confirm`. Padrões estabelecidos: server-fetch→client-table e formulário CRUD via Server Actions. Validado logado no navegador.
- **2026-07-02** — Marco commitado e enviado à branch `dev`. `node_modules` destrackado; `.gitignore` reforçado (env, xlsx/pdf, supabase temp). Repo remoto mudou p/ `Loudr-com-br/nawa-front`.
- **2026-07-03** — **Catálogo** (`/catalog`): abas Planos/Produtos, CRUD via Server Actions e **publish model** (rascunho/publicado) com `PublishStatusChip`. Migration `commercial_products.ref_id` anulável (add-ons). Validado criando add-on em rascunho. Commitado na `dev`.
- **2026-07-03** — **Protocolos** (`/protocols`): lista + detalhe (`/protocols/[id]`) com CRUD de fórmulas, formas farmacêuticas, fornecedor, elegibilidade e **ponte GLP-1** (magistral Botane / original parceiro). Publish toggle no cabeçalho. Validado adicionando fórmula ao vivo. Commitado na `dev`.
- **2026-07-03** — **Anamnese** (`/anamnesis`): form builder completo — lista + `/anamnesis/[id]` com CRUD de perguntas (tipos, opções, obrigatoriedade, reordenação), lógica condicional e score de risco. Migration `anamnesis_questions` (options/required). Seed de formulário com 10 perguntas (`npm run seed:anamnesis`). Commitado na `dev`.
- **2026-07-03** — **Jornadas** (`/journeys`): lista + detalhe com vínculo/desvínculo de planos e edição de conteúdo (tagline/descrição/destaques em jsonb), publish toggle. Fix: campos multiline com `rows` fixo (evita loop do TextareaAutosize do MUI + React 19). Commitado na `dev`.
- **2026-07-03** — **Storefront API + Chaves** (`/api-keys`): endpoints `/api/storefront/{catalog,protocols,anamnesis}` autenticados por chave (hash sha256, header Bearer), servindo só `published`; client admin server-only; `last_used_at`. Módulo de chaves: criar (revela uma vez), rotacionar, revogar, prefixo mascarado. Migration `api_keys.key_prefix`. Validado: 401 sem chave, dados só publicados com chave; produto rascunho corretamente omitido. Commitado na `dev`.
- **2026-07-03** — **Promoções** (`/promotions`): CRUD de cupons (código, percentual/valor fixo, valor, período de vigência com estado ativa/agendada/expirada, publish). Validado criando RESET10 (10%, publicado). Commitado na `dev`.
- **2026-07-03** — **Assinaturas** (`/subscriptions`): lista + operações (pausar/reativar/retentar/cancelar/mudar plano) via Server Actions, filtro por status. Seed de 16 assinaturas (`npm run seed:subscriptions`). **Pacientes** (`/patients`): lista + ficha 360º (`/patients/[id]`) agregando cadastro, assinaturas, histórico de pedidos e status clínico. Validado pausando assinatura e abrindo ficha. Commitado na `dev`.
- **2026-07-03** — **Dashboard** (`/dashboard`): métricas reais agregadas do Supabase (16 pedidos, 9 assinaturas ativas, MRR R$ 4.510, 16 pacientes), lista de pedidos recentes clicável e card de alertas (inadimplentes + sync Botane). Fecha os 12 módulos de núcleo do spec em dados reais. Commitado na `dev`.
- **2026-07-03** — **Configuração** (`/settings`): gestão de usuários internos e papéis (convidar cria auth user + users_internal, trocar papel, ativar/desativar), restrito ao super_admin (guard na página + nas actions). Aba de integrações informativa. Validado convidando medico.teste@nawahealth.com como Médico.
- **2026-07-03** — **Auditoria** (`/audit`): helper `logAudit` (ator, e-mail, ação, entidade, changes, IP, horário; best-effort). Instrumentadas ações sensíveis (usuários, chaves de API, assinaturas). Trilha imutável restrita ao super_admin. Migration `audit_log.actor_email`. Validado pausando assinatura → registro apareceu na trilha.

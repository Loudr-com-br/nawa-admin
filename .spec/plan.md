# NAWA Backoffice — Plano de Trabalho

> Documento vivo. Atualizar conforme avançamos.
> Ordem de construção baseada na seção 11 do [`spec.md`](spec.md).
> Complementos: [`escalabilidade.md`](escalabilidade.md) · [`storefront-api.md`](storefront-api.md)
>
> **Última atualização:** 2026-09-02 (endurecimento pós-auditoria: validação de ambiente, rate limit de escrita, headers, CI, testes e smoke — tudo em produção)

## Legenda

- `[x]` concluído
- `[~]` em andamento / parcial
- `[ ]` pendente

---

## Refatoração Catálogo & Protocolos v2 (2026-07) — EM PRODUÇÃO

> Reengenharia do catálogo aprovada pelo cliente em **2026-07-17**. Specs:
> [`catalogo-protocolos-v2.md`](catalogo-protocolos-v2.md) (técnica) ·
> [`catalogo-v2-plano-e-arquitetura.md`](catalogo-v2-plano-e-arquitetura.md) (plano) ·
> [`catalogo-v2-documentacao-tecnica.md`](catalogo-v2-documentacao-tecnica.md) (doc do cliente).
>
> **A virada:** a NAWA faz curadoria de SKUs prontos → o sistema vira **e-commerce padrão
> com 3 peculiaridades de saúde**. Colapsa catálogo clínico + comercial em **um só catálogo**.
> **Substitui** os módulos v1 Catálogo/Protocolos/Nomenclatura/Jornadas (§1, §3, §4, §6 da Fase 1).

- [x] **Fase 0 — Migração de schema** — `formulas`→`items`; novas `suppliers`, `protocol_items` (N↔N), `protocol_versions`, `collections`/`collection_members`, `order_lines`/`subscription_lines`; drop de `commercial_products`/`journeys`/`attributes`; **`plans`/`plan_id` preservados**. Migration corretiva `items.status`. Seeds reescritos; tipos regenerados. Aplicada no "Nawa DB".
- [x] **Fase 1 — Catálogo (Itens)** — `/catalog` vira catálogo único de SKUs: lista + detalhe `/catalog/[id]`, dado do fornecedor em leitura (editável só p/ interno), curadoria NAWA (preço/visibilidade), margem. Medicamento força `medical_only`; publicar exige preço.
- [x] **Fase 2 — Protocolos (Kits)** — `/protocols` vira kit: seleção de itens (`protocol_items`) c/ quantidade, preço origem `soma`/`manual` + aviso de deriva e recálculo, claims com estado (draft→aprovado; editar público rebaixa), página editorial. Piso de visibilidade pelo item mais restrito.
- [x] **Fase 3 — Coleções** — módulo novo `/collections`: árvore/lista via `parent_id`, membros item|protocolo, rollup dos filhos, proíbe ciclo. **Aposenta `/journeys` e `/attributes`**.
- [x] **Fase 4 — Storefront** — rotas v2 `/api/storefront/{items,protocols,collections}` (só publicado + público); **fail-closed** (`medical_only` nunca vaza, nem no rollup); claim público só se aprovado. Remove `/api/storefront/catalog`.
- [x] **Deploy v2 em produção** (2026-07-22) — `dev`→`main`; build de produção passando.
- [x] **Imagens do catálogo (item)** — migrations `image_url` + `image_urls` (galeria) e bucket público `catalog`; upload no detalhe do item (service role, capa = 1ª); lista com miniatura de capa; detalhe com card "Imagens". Storefront expõe `imageUrl` (capa) + `imageUrls` (galeria). `next/image` nas miniaturas. **Aplicado no Nawa DB; ainda em `dev` (não promovido a produção).**
- [ ] **Fase 5 — Auditoria e acabamento** — `logAudit` em item/protocolo/preço/publish; ajustar **dashboard** e **ficha do paciente** ao modelo `order_lines`; snapshot de `protocol_versions` no publish.
- [ ] **Imagens em protocolo e coleção** — coluna já existe e o storefront expõe a capa; falta o campo de upload nas telas de detalhe (galeria só no item hoje).

**Pedidos:** removido join/campo `journey` (jornada→coleção). Ainda usam `order_items` (migração p/ `order_lines` fica na Fase 5).

**Aguardando cliente** (trava publicar, não codar): quem aprova o claim · o que a Botane entrega (composição+custo?) · OK sobre camadas do Golden Protocol.

**Fronteira de escopo:** Carrinho e Assinatura pertencem ao **checkout** (fase futura, outra spec), não ao catálogo. Visão macro FrontOffice/Backoffice na doc do cliente.

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
- [x] Estados vazios / erro / loading padronizados — **error boundary** (`(admin)/error.tsx`) com fallback gracioso (sem tela branca; distingue "backend não configurado" de erro genérico com retry); estados vazios via `emptyMessage` nas tabelas; **loading skeletons** via `loading.tsx` por rota (lista/detalhe/dashboard, `components/skeletons/PageSkeleton.tsx`) — feedback imediato na navegação (Suspense), o clique deixa de ficar "pendurado" até o fetch do servidor
- [x] Toasts e confirmações de ação — `ToastProvider` (`useToast().success/error`) integrado a todos os fluxos CRUD (catálogo, protocolos, jornadas, anamnese, promoções, atributos, assinaturas, api-keys, configuração); confirmação inline de exclusão (dois cliques)
- [x] Formulário padrão criar/editar (diálogo + Server Action) — 1ª versão em Atributos

---

## Fase 1 — Núcleo do backoffice (ordem do §11)

> ⚠️ **Catálogo, Protocolos, Nomenclatura e Jornadas (§1, §3, §4, §6) foram refeitos ou
> substituídos pela Refatoração v2** (seção acima). Os checkboxes abaixo refletem a
> construção v1 e ficam como registro histórico.

### 1. Nomenclatura e atributos (`/attributes`) — §5.9  → **substituído por Coleções (v2)**
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
- [x] Escala: cache de borda (`s-maxage`+`stale-while-revalidate`+`Vary`), `last_used_at` com throttle, **purge-on-publish** (cache tags + `purgeCache`) — ver [`escalabilidade.md`](escalabilidade.md)
- [x] Guia da API para o front: [`storefront-api.md`](storefront-api.md)
- [ ] Rate limiting por chave; versionamento `v1`
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

## Antes do lançamento (bloqueia go-live, não o desenvolvimento)

- [ ] **Semana dedicada à fronteira de API (backoffice ↔ frontoffice).** A
  Storefront API é a peça de maior risco e maior alavanca do produto: superfície
  de segurança (fail-closed do `medical_only`), gargalo de escala (o front tem
  muito mais tráfego) e contrato de evolução (os dois repos evoluem em ritmos
  diferentes — a migração v2 já quebrou telas v1 em produção). Precisa de uma
  semana só para **documentar e endurecer**: cache coordenado (purge
  backoffice↔front), latência/SLO, **indexação e busca de produtos** (hoje a
  API devolve listas completas, sem paginação/filtro/índice), versionamento
  (`/v1`) e observabilidade. Detalhe em `frontoffice/.spec/api-boundary.md`.
  Reservar antes de abrir ao público. (`storefront-api.md` já reconciliado com
  as rotas v2 reais em 2026-07-28.)

## Fase 2 — Segurança, pagamento e conformidade — §8

- [x] Auditoria (`/audit`): trilha imutável (ator, ação, entidade, mudança, IP, horário) — instrumentadas ações de usuários, chaves e assinaturas; restrito ao super_admin
- [ ] Instrumentar mais ações (publicação, dado clínico) e leitura de dado sensível
- [ ] Endurecimento de RLS por papel
- [~] **Pagamento**: abstração provider-agnóstica + **stub** ao vivo (cobrança server-side, `payments`, webhook idempotente, transição `awaiting_payment→paid`). Falta plugar o **Pagar.me** real (tokenização no cliente, chaves, `pagarme.ts` na mesma porta)
- [ ] LGPD: consentimento, exclusão/portabilidade, retenção mínima
- [ ] Integridade de prescrição (não editável após emissão)

## Fase 3 — Fase seguinte (§5, módulos posteriores)

- [ ] Conteúdo (headless, servido pela Storefront API)
- [ ] Notificações (email/WhatsApp, integra Hubspot)
- [ ] Observabilidade (webhooks falhos, sync quebrado, erros)

---

## Decisões em aberto (§9.3 / §12)

- [x] **Emissão fiscal / fulfillment** — **DECIDIDO em 2026-08-25: triangulação.** Nota de
      **medicamento pela Botane** (por regra de custo) e nota de **serviço/acompanhamento médico
      pela NAWA** (inclui valor fixo de serviço médico), separadas por middleware. O cliente vê
      **compra unificada** na interface e baixa as notas separadas quando pedir. Isso encerra o
      aviso amarelo "Decisão fiscal em aberto (§9.3)" que ainda aparece na tela do pedido —
      **remover esse aviso é trabalho pendente no código.**
- [~] **Integração Botane**: automática via API ou manual por operador no MVP. **Restrição
      conhecida (avaliação de 2026-08-10):** o `botane.json` é uma API **read-only** (analytics/DW)
      — só a direção `import`. **Não existe endpoint para despachar pedido**, então o lado "saída"
      (`orders.botane_order_ref`) é manual/operador enquanto o cliente não conseguir as **2 APIs**
      pedidas à Botane (produtos e envio de pedidos). Leitura real bloqueada pela `BOTANE_API_KEY`,
      que não temos (401 confirmado; só `heartbeat` é aberto).
- [ ] **GLP-1 original**: NAWA intermedia a compra ou só indica o parceiro.
- [x] **Assinatura digital de prescrição** — **DECIDIDO em 2026-08-25: solução customizada, NÃO
      DocuSign.** O médico desenha a assinatura (mouse/dedo) ou escolhe um modelo; ela fica salva
      no cadastro, associada a **CRM/CPF**, possivelmente com **QR de validação**. Investigar depois
      as plataformas oficiais dos conselhos. Módulo ainda não construído.
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
- **2026-07-03** — **Dashboard analítico** (`/dashboard`): reformulado no estilo "visão geral" (receita, ticket médio, pedidos, cancelados com delta; seletor de período; gráficos MUI X Charts; produtos com maior receita; funil de pedidos). Seed de ~180 pedidos em 60 dias (`npm run seed:orders`). Âncora "agora" no relógio real. Deploy em produção (Netlify) funcionando após configurar as envs do Supabase. `main` = `dev` (promovido via force-push).
- **2026-07-03** — **Escala da Storefront**: cache de borda (`s-maxage`+`stale-while-revalidate`+`Vary`), `last_used_at` com throttle, **purge-on-publish** (cache tags + `purgeCache` da Netlify nas ações de publicação). Docs `escalabilidade.md` e `storefront-api.md`. README atualizado.
- **2026-07-03** — **Fonte da marca AT Aero** auto-hospedada via `next/font/local` (8 pesos woff2), removido Poppins/Google Fonts; fallback de fonte garantido em sans-serif (nunca serifa) quando falha o carregamento. Repo remoto renomeado de `Loudr-com-br/nawa-front` p/ **`Loudr-com-br/nawa-admin`** (o app é o painel de backoffice, não o backend); remote local e vínculo do Netlify (site `nawahealth`) realinhados ao novo nome.
- **2026-07-17** — **Arquitetura Catálogo & Protocolos v2 aprovada pelo cliente.** A NAWA faz curadoria de SKUs prontos → sistema vira e-commerce padrão com 3 peculiaridades de saúde; colapsa catálogo clínico + comercial em um só. Specs escritas (técnica + plano/arquitetura). Migração de schema rascunhada.
- **2026-07-21** — **v2 Fases 0–2.** Migração aplicada no "Nawa DB" via `supabase db push` (`formulas`→`items`, `suppliers`, `protocol_items`, `collections`, `order_lines`; drop `commercial_products`/`journeys`/`attributes`; `plans` preservado; fix `items.status`). Seeds reescritos, tipos regenerados. **Catálogo** (`/catalog`, itens) e **Protocolos** (`/protocols`, kits) reescritos. Commits na `dev`.
- **2026-07-22** — **v2 Fases 3–4 + deploy.** Módulo **Coleções** novo (`/collections`); **Storefront** v2 (`/items`,`/protocols`,`/collections`) com fail-closed verificado no banco; **Pedidos** ajustados (sem `journey`); `/journeys` e `/attributes` removidos. Build de produção passando. **Deploy v2 em produção** (`dev`→`main`). ⚠️ Descoberto que o Supabase é **compartilhado com o site publicado** — a migração quebrou telas v1 em produção; resolvido subindo o código v2 coerente (sem rollback).
- **2026-07-24** — **Documentação técnica** para o time do cliente (`catalogo-v2-documentacao-tecnica.md`): visão macro FrontOffice/Backoffice + modelo de entidades, regras de negócio, storefront, estado da entrega. Consolidado **Carrinho/Assinatura como checkout** (fora do escopo do catálogo).
- **2026-08-07** — **Abstração de pagamento + stub (spec §6.2).** Camada provider-agnóstica em `src/lib/payments/`: porta `PaymentProvider` (`createIntent`/`confirm`/`parseWebhook`), `StubProvider` síncrono e determinístico (desfecho pelo valor: total `,13` recusa, resto aprova), `getPaymentProvider()` por env (`PAYMENT_PROVIDER`, default stub; `pagarme` lança "não configurado"). Serviço `payOrder`/`applyOutcome`/`handleWebhook` liga ao banco: cria a intent, registra em **`payments`** (migration nova + enums `payment_provider`/`payment_txn_status`, RLS, unique `(provider,provider_ref)` p/ idempotência de webhook), transiciona `awaiting_payment→paid`, grava evento. `POST /api/checkout/pay` (auth paciente, escopo no servidor) e `POST /api/payments/webhook` (assinatura). **Testado ao vivo:** paga→`paid`+evento; repetir→idempotente (1 evento); total `,13`→`payment_status=failed`, pedido segue `awaiting_payment`; webhook assíncrono confirma pedido não-pago; assinatura inválida→401; sem JWT→401, inexistente→404, pedido de outro paciente→403. **Só falta plugar o Pagar.me real** (criar `pagarme.ts` na mesma porta). ⚠️ Não deployado ainda.
- **2026-07-31** — **Checkout sem cobrança + guest→conta (spec §6.2/§11).** `POST /api/checkout/orders`: valida JWT do paciente, **cria o `patients` se não existir** (guest→conta, `resolveOrCreatePatient`), revalida o carrinho contra o catálogo publicado, **recalcula server-side**, cria o pedido `awaiting_payment` (novo status via migration) + `order_items`, e **converte o carrinho** (idempotência). Middleware libera `/api/checkout`. **Testado ao vivo** (conta nova → pedido → aparece em `/api/patient/orders`; repetir → `cart_already_converted`). Falta só a cobrança (Pagar.me). ⚠️ Não deployado ainda.
- **2026-07-30** — **DEPLOY em produção.** `dev`→`main` por fast-forward (`623837f`), push → Netlify (site `nawahealth`) buildou e publicou. **Verificado em prod:** `/api/storefront/v1/*` + alias, busca acento-insensível e fail-closed funcionando ao vivo. Subiu tudo de hoje (funil anamnese→carrinho, API do painel, busca, `/v1`) + imagens do catálogo (que estava pendente). Migrations já aplicadas na Nawa DB.
- **2026-07-30** — **Fronteira de API: versionamento `/v1`.** Handlers da Storefront movidos p/ `/api/storefront/v1/{items,protocols,collections,anamnesis,search}`; as rotas sem versão viraram **alias retrocompatível** (`export { GET } from "../v1/…"`) — produção não quebra. Front aponta p/ `/v1`. Testado ao vivo: v1 e alias servem idêntico, 401 sem chave, home+busca do front OK. Falta: versionar checkout/patient, contrato tipado validado (zod), rate limiting.
- **2026-07-29** — **Fronteira de API: indexação & busca** (o maior gap do `api-boundary.md`). Migrations `search_index` + `search_unaccent`: `pg_trgm`+`unaccent`, índices funcionais e **função `storefront_search`** (itens+protocolos, acento-insensível, **fail-closed** preservado). Endpoint `GET /api/storefront/search?q=&limit=` (cacheável); paginação aditiva em `/items?q=&page=&limit=` (retrocompatível). Front: `/busca` + caixa no header. **Testado ao vivo:** "magnesio"→"Magnésio", "omega"→"Ômega-3", "met"→item+protocolo. Falta (semana da fronteira): versionamento `/v1`, cache coordenado, filtros, SEO/sitemap, rate limiting.
- **2026-07-29** — **API Painel do paciente (spec §6.3).** `GET /api/patient/{orders,subscriptions,profile}` — auth por **JWT do paciente** (Supabase Auth), escopo por `auth_user_id` no servidor (nunca por parâmetro). `src/lib/patient/{auth,queries}.ts`; middleware libera `/api/patient`. Devolve estado cru (o front traduz, §8). Seed `seed-patient-auth.mjs` linka um paciente a um auth user. **Testado ao vivo:** login → 15 pedidos + assinatura + perfil escopados; 401 sem token. Front `/account` consome (painel logado funcionando).
- **2026-07-29** — **Fatia anamnese → recomendação → carrinho (início).** Decisões travadas (§11): carrinho no **servidor**, sessão **guest→conta**. Migration `20260729120001_cart.sql` (`carts`/`cart_lines` com **hash** âncora p/ métrica de abandono + `email`/`patient_id`/`status`). Motor de avaliação `evaluate.ts` (score a partir do `risk_weight`, nunca exposto) + **placeholder** de recomendação `recommend.ts` (score→protocolo por faixa; a regra clínica real fica pendente). Endpoints `POST /api/anamnesis/evaluate` e `GET|PATCH /api/cart/[hash]` (auth reusa a chave da Storefront; separação read/write é da semana de fronteira). Storefront de anamnese passou a expor `id` da pergunta; middleware libera `/api/anamnesis` e `/api/cart` (autenticam por chave). **Migration aplicada na Nawa DB, tipos regenerados, tsc+lint limpos.** **Loop testado ao vivo:** `metabolic-reset` (10 perguntas) → score 88 (high) → carrinho "Reset Metabólico Base" + 3 upsells; GET/PATCH (qtd, remoção) e 401 sem chave OK; carrinho persistido no servidor com hash/score/respostas. Próximo: front (renderizar anamnese → submit → tela de carrinho).
- **2026-07-24** — **Storefront v2 documentada + imagens do catálogo.** `storefront-api.md` reescrito p/ v2 (rotas/shapes reais, fail-closed, purge em cascata). Nota "Antes do lançamento" no plano: **semana dedicada à fronteira de API** (ver `frontoffice/.spec/api-boundary.md`). **Imagens de produto**: migrations `image_url`→`image_urls` (galeria) + bucket público `catalog` (aplicadas no Nawa DB, local↔remote em sync); upload no admin (detalhe do item), lista com capa, detalhe com card "Imagens"; storefront expõe `imageUrl`/`imageUrls`. **Performance**: `next/image` no admin e no front (imagem ~909KB→~31KB). Trabalho na `dev`; **produção não promovida** (deploy `dev`→`main` pendente de OK). Utilitário `scripts/gen-storefront-key.mjs` p/ gerar chave de dev.
- **2026-08-10** — **Deploy de base + purge coordenado ativo em produção.** `dev`→`main` nos dois
  repos (backoffice `5e6411b`), primeiro deploy desde 30/07; smoke de prod verde. Os 3 envs de
  purge setados via Netlify CLI: backoffice `FRONT_REVALIDATE_URL` (é a **BASE** — o código anexa
  `/api/revalidate`) + `FRONT_REVALIDATE_SECRET`; front recebe o **mesmo** segredo. Secret plano
  de propósito, p/ não disparar o secrets-scanning do Netlify. **Avaliação Botane** concluída
  (ver "Decisões em aberto"): read-only, sem endpoint de despacho.
- **2026-08-14** — **Pagar.me real (API v5) na porta de pagamento** (`a400d35`, `5d8a67a`) —
  adaptador `src/lib/payments/pagarme.ts` implementando a mesma porta do stub; **nada no checkout
  mudou**, que era o ponto da abstração. Cartão tokenizado no navegador (sem SDK). Validado em
  sandbox real. **Armadilhas da v5 que só apareceram contra a API de verdade, cada uma custou uma
  recusa:** telefone do cliente é **obrigatório**; `billing_address` mora em
  `payments[].credit_card.card.billing_address` (um nível mais fundo do que parece, e é exigido
  mesmo pagando por token); **CPF inválido não dá erro de validação, dá RECUSA** (o front passou a
  validar os dígitos antes de cobrar); o webhook v5 **não assina o corpo com HMAC** — autentica por
  HTTP Basic cadastrado no painel deles. Cartão de teste que aprova: `4000000000000010`; valores em
  **centavos**. **Bug próprio, o mais sério:** `payOrder` gravava a linha de `payments` com o status
  do provedor — com captura direta o Pagar.me devolve a cobrança **já paga**, a linha nascia `paid`,
  o guarda de idempotência do `applyOutcome` saía cedo e o resultado era **dinheiro capturado com o
  pedido preso em `awaiting_payment`**. Agora a linha nasce `created` e quem aplica o desfecho é
  sempre o `applyOutcome`. O stub nunca expôs isso porque abre a cobrança em `processing`.
  ⚠️ **PIX segue sem nunca ter rodado** — desabilitado nesta conta de sandbox; código pronto.
  Webhook nunca exercitado (precisa de URL pública).
- **2026-08-14** — **Frete no pedido** (`96b170c`). Migration `orders.shipping_total` (aditiva,
  default 0). A tarifa vive em `src/lib/checkout/shipping.ts` — **fonte da verdade no servidor**;
  o front manda só o **ID da modalidade, nunca o preço**. `GET /api/checkout/v1/shipping` expõe as
  opções. **Frete grátis = tarifa 0**, é config e não código; ligar os Correios muda só `quoteShipping`.
- **2026-08-14** — **CPF do paciente** (`da769c0`) e **agenda de endereços** (`b429d90`). Migrations
  `patients.cpf` e `patient_addresses` + `orders.shipping_address`. O endereço do pedido é
  **snapshot, não FK** — de propósito: editar ou apagar um endereço não pode reescrever para onde um
  pedido já foi.
- **2026-08-14** — **Gate de validação clínica entre pagamento e produção** (`0098e8c`). Migration
  `20260814150001_clinical_review.sql`: estados `in_clinical_review` e `clinically_rejected` +
  tabela `clinical_reviews` (autor, data, justificativa; unique por pedido), **separada de
  `order_events` de propósito** — é registro profissional. Antes disto o pedido pago ia direto p/
  `in_production`: podia entrar em produção sem nenhum profissional olhar, **enquanto a tela dizia
  ao paciente que passava por validação clínica**. Autorização no servidor: só `doctor` e
  `super_admin` decidem; o operador vê a fila mas não assina — é o que sustenta "a NAWA agrega, a
  responsabilidade clínica tem dono".
- **2026-08-15** — **Pré-autorização: o dinheiro segue a decisão do médico** (`ee9be31`). Migration
  `20260814160001_payment_authorized.sql` (`authorized` nos enums de pagamento). O ciclo virou:
  checkout **reserva** → `in_clinical_review` → aprovar **captura** / reprovar **libera a reserva**.
  **Isso eliminou a necessidade de estorno** — não existe dinheiro a devolver porque nunca foi
  capturado. Liga por env `PAGARME_OPERATION=auth_only`. `enterClinicalReview` mora no lado do
  **pagamento** para o grafo de imports ficar numa direção só (revisão → pagamento, nunca o
  contrário). **Se o movimento financeiro falhar, a decisão NÃO é registrada:** aprovado sem captura
  viraria produção sem receber; reprovado sem liberação prenderia o limite do paciente.
  **Armadilhas que custaram um ciclo cada:** `authorized` ≠ `processing` (autorização = limite
  comprometido, entra na revisão; PIX pendente = nada comprometido, não entra); o Pagar.me deixa a
  **cobrança** em `pending` e o `authorized_pending_capture` na **transação**, então `statusOfCharge`
  precisa ler `last_transaction.status` antes do envelope; `payment_status` ficava preso em
  `authorized` após a captura porque só era atualizado junto da transição a partir de
  `awaiting_payment`, que na pré-autorização já tinha ocorrido — o fato "foi pago" agora vale
  independente do ponto do fluxo.
- **2026-08-18** — **DEPLOY em produção** (`254ad15`, `dev`→`main`). Sobe o funil completo com
  pré-autorização, gate clínico, agenda de endereços e frete. Último commit foi só a tipagem do
  payload do Pagar.me (remoção dos `any`). **Migrations já aplicadas no Nawa DB de produção**
  (todas aditivas). Verificado ao vivo em 2026-08-29: front `/`=200, backoffice `/`=307→login,
  `/api/storefront/items` sem key=401, `/api/checkout/v1/shipping`=200.
- **2026-08-25** — **Reunião de alinhamento — a visão clínica passa a ser do PACIENTE, não do
  pedido.** É a decisão que mais mexe no que já existe: hoje o gate está preso ao pedido
  (`clinical_reviews` tem unique por `order_id`, decisão em `/orders/[id]`). O acordado é prontuário
  + revisão atrelados à **pessoa**, reunindo histórico de tratamentos, evolução (ex.: -20 kg em
  2 anos) e os últimos ~6 pedidos. Também decidido: **prontuário médico digital** (anamnese,
  alergias, medicamentos, condições, notas clínicas, fila de revisão); **ambientes separados
  admin × médico** — mesma base, aplicações distintas, porque o acesso médico **não pode ver visão
  comercial de receita**, e hoje isso é só um `role` no backoffice único; **teleconsulta com o que
  já existe** (Google Calendar/Meet + WhatsApp), nada complexo no lançamento; **LGPD** — exclusão
  precisa existir na interface, com o dado retido em **banco separado e não rastreável** por período
  curto. Ata: `docs.google.com/document/d/1zG-gM6ZT0VJcC3yXH54HtyDTugEbriBgTRZjvMrU5Ww`.
- **2026-08-25** — **Tela do médico: o "bug do skeleton" não existia; o defeito real era outro.**
  Testado logado como `medico.teste@nawahealth.com`: `/orders` e `/orders/[id]` abrem completos, com
  o painel de decisão (`canDecide` = true). O relato anterior era **erro de teste** — cliques por
  coordenada erravam o alvo porque o screenshot do automation (1389px) tem escala diferente do
  viewport real (1571px). **Lição: neste projeto, clicar por `ref` (`read_page`) ou por `.click()`
  via JS, nunca por coordenada** (vale também para os radios da anamnese). **O defeito real:**
  `orderStatusOrder` e `paymentStatusOrder` (`lib/orders/format.ts`) eram listas escritas à mão e
  **incompletas** — faltavam `awaiting_payment`, `in_clinical_review`, `clinically_rejected` e
  `authorized`. Efeito: **"Revisão clínica" não existia no filtro de status**, ou seja, o médico não
  conseguia isolar a própria fila, e o `indexOf` devolvia -1, embaralhando a ordenação. Agora as duas
  listas são **derivadas dos configs** (`Object.keys(orderStatusConfig)`), que são
  `Record<OrderStatus, …>` e portanto exaustivos por tsc — não dá mais para um status novo sumir do
  filtro em silêncio. `StatusChip` ganhou **fallback** para status desconhecido (a causa do "`cfg`
  undefined derruba a tela", que já bateu duas vezes: `awaiting_payment` e `authorized`).
  ⚠️ **Em disco, ainda NÃO commitado.**
- **2026-08-25** — **Bug do endereço no checkout: 401 em todo cadastro novo.** A linha em `patients`
  só nascia em `resolveOrCreatePatient`, chamada de um único lugar — o `finalizeOrder` do bloco 3.
  Mas a conta é criada no **bloco 1**. Entre os dois, o cliente tinha **JWT válido e nenhuma linha em
  `patients`**, e `authenticatePatient` recusa exatamente esse estado → **401 ao salvar endereço no
  bloco 2, para todo cadastro novo**. Nunca apareceu antes porque os testes usavam um paciente do
  seed, que já tinha a linha. **Correção (em disco, NÃO commitada):** rota nova
  `POST /api/checkout/v1/patient` que só chama `resolveOrCreatePatient` (idempotente — reusa a linha
  e completa campos em branco), chamada pelo front no signUp/signIn do bloco 1.
- **2026-08-29** — **`scripts/create-internal-user.mjs`** (novo, não commitado). Cria a conta no Auth
  **e** concede papel em `users_internal` num passo só. O `seed-admin.mjs` não servia sozinho: exige
  que a conta **já exista** no Auth (criada à mão no painel) e concede `super_admin` fixo — este
  recebe o papel como argumento, porque `app_role` tem quatro valores e o default da coluna
  (`operator`) raramente é o desejado. **Sem `--yes` é dry-run**, imprimindo só o host do projeto
  alvo, porque isto costuma rodar contra produção e confirmar o alvo é barato. Idempotente: se o
  e-mail já existe no Auth, **reusa e não sobrescreve a senha**. Nunca imprime segredos. Guardas
  verificados (papel inválido, credencial ausente, argumentos faltando → saída limpa, exit 1).

---

## Endurecimento pós-auditoria (2026-09-01/02) — EM PRODUÇÃO

> Auditoria completa de arquitetura, segurança e desempenho conduzida em 01/09 sobre o
> código e a configuração real. Documento de transferência técnica em
> [`ambientes.md`](ambientes.md) para a parte de ambientes.
>
> **Contexto:** este ambiente é de DESENVOLVIMENTO — sem cliente real, pagamento em
> sandbox. Os achados críticos valiam como dívida a pagar antes de haver tráfego.

### O que a auditoria encontrou de crítico

- [x] **Produção rodava o provedor de pagamento `stub`.** `PAYMENT_PROVIDER ?? "stub"` sem
      a variável definida no Netlify — o checkout completava sem cobrar nada.
- [x] **O webhook aceitava um segredo público.** `STUB_PAYMENT_WEBHOOK_SECRET ?? "stub-secret"`
      deixava valendo uma constante escrita neste repositório: qualquer pessoa marcava um
      pedido como pago. Confirmado por sondagem (400 = assinatura aceita) e fechado (401).
- [x] **`PAGARME_OPERATION` assumia `auth_and_capture`** em silêncio, o que desfaz a
      pré-autorização e cobra antes da avaliação médica.

Os três tinham a **mesma causa**: comportamento crítico decidido por um `??` silencioso.

### O que foi construído

- [x] **`src/lib/env.ts`** — validação zod de todas as variáveis, no build e no boot
      (`src/instrumentation.ts`). Em deploy de produção, configuração crítica ausente
      **derruba o build** com a lista do que falta. Sem padrão para provedor, segredo de
      webhook e modo de captura. Trava `PAGARME_ALLOW_LIVE` para chave `sk_live_`.
      **O rigor vem de `CONTEXT` (Netlify), nunca de `NODE_ENV`** — `next build` define
      NODE_ENV=production em qualquer build, inclusive no CI. `ENV_STRICT=true` força.
- [x] **Rate limit das rotas de escrita** — migration `20260901120001`, tabela `rate_limits`
      e função `rate_hit`, mesmo desenho atômico do limitador da Storefront mas com sujeito
      textual (`patient:<id>` ou `ip:<addr>`). Aplicado em `/checkout/v1/{pay,orders,patient}`
      e no webhook; `pay` usa limite menor por ser alvo de varredura de cartão.
      Fail-open **com log alto** — controle de segurança não pode falhar em silêncio.
- [x] **Headers de segurança** em `next.config.ts` — X-Frame-Options, Referrer-Policy,
      Permissions-Policy, COOP e CSP em Report-Only. **Não no `netlify.toml`:** aquele bloco
      só alcança arquivos estáticos, e as páginas do Next são servidas por função. A primeira
      tentativa entregou os headers no favicon e não no `/login`.
- [x] **Suíte de testes (Vitest)** — 36 no backoffice, cobrindo o que já quebrou: ordem dos
      status (o filtro que escondeu a fila do médico), webhook do stub, validação de ambiente
      em todas as combinações, frete resolvido no servidor, hash das chaves, sujeito do limite.
- [x] **CI (GitHub Actions)** — tipos, lint, testes, `npm audit --audit-level=high` e build,
      em PR e push para `dev`/`main`.
- [x] **Smoke pós-deploy** (`scripts/smoke.mjs`) — 10 verificações contra o ambiente publicado,
      nenhuma altera dado. A principal: o webhook recusando o segredo público. Roda após push
      em `main`, diariamente e sob demanda.
- [x] **`scripts/db-migrate.mjs`** — aplica migrations em qualquer projeto alvo, dry-run por
      padrão imprimindo só o host. Prepara a separação de ambientes.
- [x] **Dependências** — zero vulnerabilidades. `overrides` fixando postcss corrigido, em vez
      de `audit fix --force`, que trocaria o Next por uma major.

### O pipeline provou o próprio valor na estreia

- O **CI reprovou** um defeito no `lib/env` recém-escrito (rigor derivado de `NODE_ENV`).
- O **smoke reprovou** o deploy dos headers por estarem no arquivo errado.
- Os dois passaram por `tsc` e build limpos. Reforça o aprendizado de 14/08: **typecheck não
  substitui exercitar o ambiente**.

### Desempenho medido (02/09)

| Medição | Resultado |
|---|---|
| Aplicação, build de produção local, 1 instância | satura em **~2.000 req/s**, zero erro até 200 simultâneos |
| Runtime sem banco | p50 **5 ms** |
| Consulta real ao Postgres (sa-east-1) | p50 **201 ms** — 40× o runtime |
| Home estática (CDN) vs página de produto (SSR) | **62 ms** vs **700 ms** |

> A diferença de 40× entre runtime e banco, e de 10× entre estático e renderizado, é o
> argumento numérico para tornar as páginas de produto estáticas com revalidação —
> promovido de melhoria a prioridade.

### Pendente

- [ ] **Cadastrar o webhook no painel do Pagar.me** (`nawa` + senha em
      `netlify env:get PAGARME_WEBHOOK_PASSWORD`). Sem isso a cobrança autoriza mas a
      confirmação volta 401 e o pedido não avança.
- [ ] **Criar o Supabase de staging** — caminho pronto, ver [`ambientes.md`](ambientes.md).
- [ ] **Verificar plano e política de backup** do Supabase (dado clínico com backup só
      diário é risco desproporcional ao custo de corrigir).
- [ ] **Sentry** — único P1 da auditoria sem endereçamento; depende da conta.
- [ ] **SMTP próprio no Supabase Auth** — o servidor compartilhado limita envios por hora e
      trava cadastro real de cliente. Bloqueador silencioso de lançamento.
- [ ] Testes de integração do fluxo de dinheiro (dependem do staging).
- [ ] Escopo de chave read/write na Storefront.

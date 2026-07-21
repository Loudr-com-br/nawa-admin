-- ═══════════════════════════════════════════════════════════════════════════
-- Catálogo & Protocolos v2 — Fase 0 (migração de schema)
-- Spec: .spec/catalogo-protocolos-v2.md  ·  Plano: .spec/catalogo-v2-plano-e-arquitetura.md
--
-- Contexto: os dados atuais são todos SEED (fake). Esta migração transforma o
-- SCHEMA; os dados são recriados pelos seeds reescritos (npm run seed:*).
-- Por isso, tabelas depreciadas são DERROPADAS (o "manter uma release para
-- rollback" da spec valia para dado real de produção, que aqui não existe).
--
-- ⚠️ RASCUNHO — pendente de validação em ambiente de teste (Supabase local ou
--    branch de preview). Não aplicar direto no projeto principal.
--
-- Rename central: formulas → items (SKU pronto). Colapsa catálogo clínico +
-- comercial em um só. plans/plan_id PERMANECEM (reorg p/ checkout numa fase futura).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. Enums novos
-- ─────────────────────────────────────────────────────────────
create type supplier_type         as enum ('pharmacy', 'partner', 'internal');
create type item_type             as enum ('manipulado', 'medicamento', 'suplemento', 'servico');
create type visibility            as enum ('public', 'medical_only');
create type price_source          as enum ('sum', 'manual');
create type claim_status          as enum ('draft', 'pending_review', 'approved', 'rejected');
create type collection_visibility as enum ('public', 'internal');
create type catalog_ref_type      as enum ('item', 'protocol');

-- pharmaceutical_form: alinhar valores ao spec (PT) e adicionar 'na' (itens
-- sem forma farmacêutica, ex.: serviço). rename value preserva o dado existente.
alter type pharmaceutical_form rename value 'capsule'    to 'capsula';
alter type pharmaceutical_form rename value 'sachet'     to 'sache';
alter type pharmaceutical_form rename value 'topical'    to 'topico';
alter type pharmaceutical_form rename value 'other'      to 'outro';
-- 'sublingual' mantém. Adiciona 'na'.
alter type pharmaceutical_form add value if not exists 'na';

-- ─────────────────────────────────────────────────────────────
-- 2. suppliers (nova origem do item)
-- ─────────────────────────────────────────────────────────────
create table suppliers (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  type       supplier_type not null,
  status     text not null default 'active',   -- active | inactive
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Origens conhecidas (idempotente por slug).
insert into suppliers (slug, name, type) values
  ('botane',      'Botane',            'pharmacy'),
  ('partner-glp1','Parceiro GLP-1',    'partner'),
  ('nawa',        'NAWA (interno)',    'internal')
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 3. formulas → items  (rename + colunas comerciais)
-- ─────────────────────────────────────────────────────────────
alter table formulas rename to items;

-- 3a. slug (items ganham slug próprio; backfill a partir do id, reseed corrige).
alter table items add column slug text;
update items set slug = 'item-' || left(id::text, 8) where slug is null;
alter table items alter column slug set not null;
alter table items add constraint items_slug_key unique (slug);

-- 3b. supplier (enum) → supplier_id (fk). Backfill mapeando o enum antigo.
alter table items add column supplier_id uuid references suppliers(id);
update items i set supplier_id = s.id
  from suppliers s
  where s.slug = case when i.supplier = 'botane' then 'botane' else 'partner-glp1' end;
alter table items alter column supplier_id set not null;
alter table items drop column supplier;

-- 3c. colunas comerciais + tipagem.
--     item_type deriva de is_glp1 (GLP-1 = medicamento); demais = manipulado.
alter table items add column item_type       item_type   not null default 'manipulado';
update items set item_type = 'medicamento' where is_glp1 = true;
alter table items add column description      text;
alter table items add column composition     jsonb not null default '{}';   -- descritivo, read-only (origem fornecedor)
alter table items add column cautions        jsonb not null default '[]';   -- [{ type, description }]
alter table items add column cost            numeric(12,2);                 -- nullable: nem todo fornecedor expõe
alter table items add column price           numeric(12,2) not null default 0; -- NAWA precifica (obrigatório em item publicado — validado na app)
alter table items add column sells_standalone boolean not null default true;
alter table items add column visibility      visibility  not null default 'medical_only'; -- falha fechada
-- Medicamento é sempre medical_only (regra dura §7).
update items set visibility = 'medical_only' where item_type = 'medicamento';

-- 3d. dosage → composition.{raw}. Não parsear. Marcar p/ revisão no 1º sync.
update items set composition = jsonb_build_object('raw', dosage)
  where dosage is not null and dosage <> '';
alter table items drop column dosage;

-- 3e. campos que saem: protocol_id (vira N↔N), eligibility_rules (vai p/ anamnese).
alter table items drop column protocol_id;
alter table items drop column eligibility_rules;

-- is_glp1 PERMANECE como flag auxiliar de tratamento comercial (§4).
-- external_ref, synced_at permanecem.
-- unique (supplier_id, external_ref) — só quando external_ref não é nulo.
create unique index items_supplier_external_ref_key
  on items (supplier_id, external_ref) where external_ref is not null;

-- ─────────────────────────────────────────────────────────────
-- 4. protocols → kit comercial (colunas de preço, claim, página, versão)
-- ─────────────────────────────────────────────────────────────
alter table protocols drop column external_ref;                -- protocolo é sempre autoral NAWA
alter table protocols add column page_content   jsonb not null default '{}'; -- conteúdo editorial do kit
alter table protocols add column claim_internal text;
alter table protocols add column claim_public   text;
alter table protocols add column claim_status   claim_status not null default 'draft';
alter table protocols add column claim_reviewed_by uuid references users_internal(id);
alter table protocols add column claim_reviewed_at timestamptz;
alter table protocols add column price          numeric(12,2) not null default 0;
alter table protocols add column price_source   price_source not null default 'manual';
alter table protocols add column visibility     visibility   not null default 'medical_only';
alter table protocols add column version        int not null default 1;

-- 4a. protocol_items (N↔N item↔protocolo). Backfill a partir do antigo formulas.protocol_id
--     não é possível (a coluna já saiu em 3e); reseed popula. Estrutura:
create table protocol_items (
  id          uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references protocols(id) on delete cascade,
  item_id     uuid not null references items(id)     on delete restrict,
  quantity    int not null default 1,
  "order"     int not null default 0,
  created_at  timestamptz not null default now(),
  unique (protocol_id, item_id)
);
create index on protocol_items (protocol_id);
create index on protocol_items (item_id);

-- 4b. protocol_versions (snapshot no publish — gatilho definido na app).
create table protocol_versions (
  id           uuid primary key default gen_random_uuid(),
  protocol_id  uuid not null references protocols(id) on delete cascade,
  version      int not null,
  snapshot     jsonb not null default '{}',
  published_at timestamptz not null default now(),
  published_by uuid references users_internal(id),
  unique (protocol_id, version)
);
create index on protocol_versions (protocol_id);

-- ─────────────────────────────────────────────────────────────
-- 5. collections + collection_members (absorve journeys, attributes, nomenclatura)
-- ─────────────────────────────────────────────────────────────
create table collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  parent_id   uuid references collections(id) on delete restrict,  -- null = plana; preenchido = árvore
  visibility  collection_visibility not null default 'internal',
  status      content_status not null default 'draft',
  "order"     int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on collections (parent_id);
create index on collections (status);

create table collection_members (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  ref_type      catalog_ref_type not null,   -- item | protocol
  ref_id        uuid not null,
  "order"       int not null default 0,
  created_at    timestamptz not null default now(),
  unique (collection_id, ref_type, ref_id)
);
create index on collection_members (collection_id);

-- ─────────────────────────────────────────────────────────────
-- 6. Linhas de pedido e assinatura (item | protocol na mesma compra)
--    plan_id PERMANECE em orders/subscriptions (reorg p/ checkout, não removido).
-- ─────────────────────────────────────────────────────────────
create table order_lines (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  ref_type      catalog_ref_type not null,
  ref_id        uuid not null,
  name_snapshot text not null,
  quantity      int not null default 1,
  unit_price    numeric(12,2) not null default 0,
  supplier_id   uuid references suppliers(id),
  created_at    timestamptz not null default now()
);
create index on order_lines (order_id);

create table subscription_lines (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  ref_type        catalog_ref_type not null,
  ref_id          uuid not null,
  quantity        int not null default 1,
  unit_price      numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index on subscription_lines (subscription_id);

-- orders.journey_id sai (jornada virou coleção). plan_id fica.
alter table orders drop column journey_id;

-- ─────────────────────────────────────────────────────────────
-- 7. Tabelas depreciadas (dado fake → drop direto)
-- ─────────────────────────────────────────────────────────────
-- plans PERMANECE (reorg p/ checkout), mas o vínculo com jornada sai:
-- remover plans.journey_id antes de dropar journeys (senão a fk bloqueia).
alter table plans drop column journey_id;

drop table if exists commercial_products;
drop table if exists entity_attributes;
drop table if exists attributes;
drop table if exists journeys;

-- ─────────────────────────────────────────────────────────────
-- 8. updated_at nas tabelas novas
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['suppliers','collections'] loop
    execute format(
      'create trigger set_updated_at before update on %I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 9. RLS nas tabelas novas (mesmo padrão do rbac/rls existentes)
--    Catálogo (suppliers/items/protocols/collections/protocol_*) = catalog_admin + super_admin.
--    Linhas (order_lines/subscription_lines) = leitura operator/doctor, super_admin gere.
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'suppliers','protocol_items','protocol_versions','collections','collection_members',
    'order_lines','subscription_lines'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy sa_all on %I for all to authenticated
         using (public.is_super_admin()) with check (public.is_super_admin())', t);
  end loop;

  -- catálogo comercial gerido por catalog_admin
  foreach t in array array[
    'suppliers','protocol_items','protocol_versions','collections','collection_members'
  ] loop
    execute format(
      'create policy catalog_manage on %I for all to authenticated
         using (public.has_role(''catalog_admin''))
         with check (public.has_role(''catalog_admin''))', t);
  end loop;
end $$;

-- items e protocols já têm RLS habilitada (herdada de formulas/protocols v1).
-- v1 colocava formulas/protocols sob 'doctor' (catálogo clínico). Em v2 o
-- catálogo é comercial (curadoria NAWA) → migrar a gestão p/ catalog_admin.
-- (A aprovação de claim é ponto aberto de RBAC — §17 da spec.)
drop policy if exists doctor_manage on items;
drop policy if exists doctor_manage on protocols;
create policy catalog_manage on items for all to authenticated
  using (public.has_role('catalog_admin')) with check (public.has_role('catalog_admin'));
create policy catalog_manage on protocols for all to authenticated
  using (public.has_role('catalog_admin')) with check (public.has_role('catalog_admin'));

-- linhas: leitura por operator/doctor (espelha orders/order_items/subscriptions v1)
create policy operator_read on order_lines for select to authenticated
  using (public.has_role('operator', 'doctor'));
create policy operator_read on subscription_lines for select to authenticated
  using (public.has_role('operator'));

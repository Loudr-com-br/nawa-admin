-- NAWA Backoffice — schema inicial (spec §6).
-- Esboço para orientar a implementação; ajustar durante a construção.

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type content_status      as enum ('draft', 'published');
create type pharmaceutical_form as enum ('capsule', 'sachet', 'sublingual', 'topical', 'other');
create type supplier            as enum ('botane', 'partner');
create type commercial_ref_type as enum ('plan', 'formula');
create type order_item_ref_type as enum ('plan', 'formula', 'product');
create type attribute_scope     as enum ('catalog', 'protocol', 'journey');
create type order_status         as enum ('paid', 'in_production', 'shipped', 'delivered', 'failed');
create type payment_status       as enum ('paid', 'pending', 'failed', 'refunded');
create type subscription_status  as enum ('active', 'paused', 'canceled', 'past_due');
create type api_key_status       as enum ('active', 'revoked');
create type sync_direction       as enum ('import', 'order');
create type sync_status          as enum ('success', 'partial', 'failed');

-- Papéis de acesso (spec §7).
create type app_role as enum ('super_admin', 'catalog_admin', 'doctor', 'operator');

-- ─────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Catálogo comercial (autorado na NAWA)
-- ─────────────────────────────────────────────────────────────
create table journeys (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  status      content_status not null default 'draft',
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table plans (
  id               uuid primary key default gen_random_uuid(),
  journey_id       uuid references journeys(id) on delete restrict,
  slug             text unique not null,
  name             text not null,
  base_price       numeric(12,2) not null default 0,
  billing_interval text not null default 'monthly',
  inclusions       jsonb not null default '[]',
  status           content_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Catálogo clínico (origem Botane, importado)
-- ─────────────────────────────────────────────────────────────
create table protocols (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique not null,
  name                 text not null,
  clinical_description text,
  external_ref         text,            -- id na Botane
  status               content_status not null default 'draft',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table formulas (
  id                  uuid primary key default gen_random_uuid(),
  protocol_id         uuid references protocols(id) on delete cascade,
  name                text not null,
  pharmaceutical_form pharmaceutical_form not null default 'other',
  dosage              text,
  supplier            supplier not null default 'botane',
  is_glp1             boolean not null default false,
  external_ref        text,            -- id na Botane
  eligibility_rules   jsonb not null default '{}',
  synced_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Ponte comercial: referencia uma fórmula ou um plano e carrega preço.
create table commercial_products (
  id         uuid primary key default gen_random_uuid(),
  ref_type   commercial_ref_type not null,
  ref_id     uuid not null,
  name       text not null,
  price      numeric(12,2) not null default 0,
  is_addon   boolean not null default false,
  status     content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Taxonomia (atributos — metafields)
-- ─────────────────────────────────────────────────────────────
create table attributes (
  id         uuid primary key default gen_random_uuid(),
  scope      attribute_scope not null,
  key        text not null,
  label      text not null,
  type       text not null default 'text',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, key)
);

create table entity_attributes (
  id           uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references attributes(id) on delete cascade,
  entity_type  text not null,
  entity_id    uuid not null,
  value        jsonb
);

-- ─────────────────────────────────────────────────────────────
-- Anamnese
-- ─────────────────────────────────────────────────────────────
create table anamnesis_forms (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  status     content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table anamnesis_questions (
  id                uuid primary key default gen_random_uuid(),
  form_id           uuid not null references anamnesis_forms(id) on delete cascade,
  "order"           int not null default 0,
  type              text not null default 'text',
  label             text not null,
  conditional_logic jsonb not null default '{}',
  risk_weight       numeric(6,2) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Promoções
-- ─────────────────────────────────────────────────────────────
create table promotions (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  type       text not null,             -- percent | fixed
  value      numeric(12,2) not null default 0,
  valid_from timestamptz,
  valid_to   timestamptz,
  status     content_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Pacientes, pedidos, assinaturas
-- ─────────────────────────────────────────────────────────────
create table patients (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique,         -- usuário do front
  name             text not null,
  email            text not null,
  phone            text,
  clinical_profile jsonb not null default '{}',
  consent_status   text not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table orders (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid references patients(id) on delete restrict,
  journey_id       uuid references journeys(id),
  plan_id          uuid references plans(id),
  status           order_status not null default 'paid',
  total            numeric(12,2) not null default 0,
  payment_status   payment_status not null default 'pending',
  prescription_id  text,
  botane_order_ref text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  ref_type   order_item_ref_type not null,
  ref_id     uuid,
  name       text not null,
  supplier   supplier,
  is_glp1    boolean not null default false,
  quantity   int not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references patients(id) on delete restrict,
  plan_id              uuid not null references plans(id),
  status               subscription_status not null default 'active',
  current_period_start timestamptz,
  current_period_end   timestamptz,
  payment_provider_ref text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Usuários internos, auditoria, chaves, sync
-- ─────────────────────────────────────────────────────────────
create table users_internal (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        app_role not null default 'operator',
  mfa_enabled boolean not null default false,
  status      text not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  changes     jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);

create table api_keys (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  key_hash     text not null,
  scope        text not null default 'read',
  status       api_key_status not null default 'active',
  last_used_at timestamptz,
  created_by   uuid references users_internal(id),
  created_at   timestamptz not null default now()
);

create table botane_sync_log (
  id              uuid primary key default gen_random_uuid(),
  run_at          timestamptz not null default now(),
  direction       sync_direction not null,
  status          sync_status not null,
  items_processed int not null default 0,
  items_failed    int not null default 0,
  details         jsonb not null default '{}'
);

-- ─────────────────────────────────────────────────────────────
-- Triggers de updated_at
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'journeys','plans','protocols','formulas','commercial_products','attributes',
    'anamnesis_forms','anamnesis_questions','patients','orders','subscriptions',
    'users_internal'
  ] loop
    execute format(
      'create trigger set_updated_at before update on %I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Índices úteis para o publish model e joins frequentes.
create index on plans (journey_id);
create index on formulas (protocol_id);
create index on order_items (order_id);
create index on orders (patient_id);
create index on subscriptions (patient_id);
create index on journeys (status);
create index on plans (status);
create index on commercial_products (status);

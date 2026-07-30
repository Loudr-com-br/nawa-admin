-- Carrinho server-side (fatia anamnese → recomendação → carrinho).
-- Decisões (spec §11): carrinho vive no SERVIDOR; sessão guest na anamnese,
-- conta no checkout. O carrinho nasce da recomendação da anamnese.
--
-- Requisito de produto: `hash` estável como âncora para MÉTRICA DE CARRINHO
-- ABANDONADO e associação posterior (email capturado / paciente logado / ponto
-- da consulta). O tratamento profundo (job de abandono, CRM) fica para depois.

create type cart_status as enum ('active', 'converted', 'abandoned');

create table carts (
  id                uuid primary key default gen_random_uuid(),
  hash              text unique not null,                    -- âncora externa (URLs, e-mails, métricas)
  session_token     text,                                    -- sessão guest (cookie do front)
  status            cart_status not null default 'active',
  -- associação (preenchida quando houver): email capturado / paciente logado
  email             text,
  patient_id        uuid references patients(id) on delete set null,
  -- origem: a anamnese que montou o carrinho
  anamnesis_form_id uuid references anamnesis_forms(id) on delete set null,
  anamnesis_answers jsonb   not null default '[]',           -- respostas que originaram
  score             numeric(6,2),                            -- score computado
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table cart_lines (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references carts(id) on delete cascade,
  ref_type   catalog_ref_type not null,                      -- 'item' | 'protocol'
  ref_id     uuid not null,
  quantity   int  not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,               -- snapshot p/ EXIBIÇÃO (valor real é recalculado no checkout)
  is_upsell  boolean not null default false,                 -- veio como upsell sugerido
  created_at timestamptz not null default now()
);

-- Índices para as consultas de abandono/associação.
create index carts_status_idx        on carts(status);
create index carts_session_idx       on carts(session_token);
create index carts_email_idx         on carts(email);
create index carts_updated_idx       on carts(updated_at);
create index cart_lines_cart_idx     on cart_lines(cart_id);

-- updated_at automático (reutiliza a função do schema base).
create trigger set_updated_at before update on carts
  for each row execute function public.set_updated_at();

-- RLS: nada acessível sem política. Os endpoints usam a service key (bypassa RLS);
-- o super_admin lê no backoffice (futuras métricas de abandono). Least privilege.
alter table carts      enable row level security;
alter table cart_lines enable row level security;

create policy sa_all on carts for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy sa_all on cart_lines for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

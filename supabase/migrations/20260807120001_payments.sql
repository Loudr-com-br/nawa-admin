-- Abstração de pagamento (spec §6.2). O pedido nasce `awaiting_payment`; a
-- cobrança pelo provedor o leva a `paid`. A camada é provider-agnóstica: hoje
-- um stub síncrono, amanhã Pagar.me — sem mudar o checkout.
--
-- `payments` é o seam durável: registra cada tentativa e dá idempotência ao
-- webhook (unique por provider + provider_ref). O estado do PEDIDO continua em
-- orders.status/payment_status; aqui fica o detalhe da transação.

create type payment_provider   as enum ('stub', 'pagarme');
create type payment_txn_status as enum ('created', 'processing', 'paid', 'failed', 'refunded');

create table payments (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  provider     payment_provider not null default 'stub',
  provider_ref text,                       -- id da intent/cobrança no provedor
  amount       numeric(12,2) not null,
  status       payment_txn_status not null default 'created',
  raw          jsonb not null default '{}',-- payload cru do provedor (auditoria)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- Idempotência do webhook: uma cobrança do provedor entra uma vez só.
create unique index payments_provider_ref_key on payments (provider, provider_ref);
create index payments_order_id_idx on payments (order_id);

-- RLS: dado financeiro. Service role (server-only) bypassa; papéis internos leem.
alter table payments enable row level security;
create policy sa_all on payments for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy operator_read on payments for select to authenticated
  using (public.has_role('operator', 'doctor'));

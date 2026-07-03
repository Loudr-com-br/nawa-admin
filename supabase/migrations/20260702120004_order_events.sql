-- Histórico/timeline do pedido (usado no detalhe — §5.2).

create table order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  at          timestamptz not null default now(),
  label       text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index on order_events (order_id);

alter table order_events enable row level security;

-- super_admin: acesso total (mesmo padrão das demais tabelas).
create policy sa_all on order_events for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Operador e médico leem (acompanham a produção).
create policy operator_read on order_events for select to authenticated
  using (public.has_role('operator', 'doctor'));

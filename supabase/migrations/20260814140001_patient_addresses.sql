-- Agenda de endereços do paciente (spec §6.3).
--
-- O endereço é do PACIENTE, não do pedido: ele salva, edita e apaga os seus, e
-- reusa no checkout seguinte. Até aqui o endereço era coletado no checkout, usado
-- como cobrança naquela requisição e descartado — o paciente redigitava toda vez
-- e não havia para onde despachar quando o fulfillment existisse.
--
-- Duas peças, de propósito:
--   1. `patient_addresses` — a agenda editável.
--   2. `orders.shipping_address` — SNAPSHOT do endereço no momento do pedido.
-- O snapshot existe porque endereço muda e pedido é registro histórico: se o
-- paciente editar ou apagar o endereço depois, o pedido tem que continuar dizendo
-- para onde foi. Por isso o pedido guarda uma cópia, e não só a chave estrangeira.

create table patient_addresses (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references patients(id) on delete cascade,
  label       text,                     -- "Casa", "Trabalho" — opcional
  cep         text not null,            -- só dígitos
  logradouro  text not null,
  numero      text not null,
  complemento text,
  bairro      text,
  cidade      text not null,
  uf          text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index patient_addresses_patient_id_idx on patient_addresses (patient_id);

-- No máximo UM endereço padrão por paciente. Índice parcial em vez de trigger:
-- o banco garante, sem código para manter.
create unique index patient_addresses_one_default
  on patient_addresses (patient_id) where is_default;

-- RLS: dado pessoal. O acesso do paciente passa pela API do backoffice (service
-- role, escopo resolvido no servidor pelo JWT — spec §6.3), nunca direto do
-- browser. Aqui liberamos só os papéis internos que precisam ver para operar.
alter table patient_addresses enable row level security;
create policy sa_all on patient_addresses for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy operator_read on patient_addresses for select to authenticated
  using (public.has_role('operator', 'doctor'));

-- Snapshot do endereço usado no pedido. jsonb porque é registro imutável: não se
-- consulta por partes nem se junta com nada, só se lê de volta como foi gravado.
alter table orders
  add column if not exists shipping_address jsonb;

comment on column public.orders.shipping_address is
  'Cópia do endereço no momento do pedido. Não é FK de propósito: editar ou apagar o endereço na agenda não pode reescrever para onde um pedido antigo foi enviado.';

comment on table public.patient_addresses is
  'Agenda de endereços do paciente. Dado pessoal — não trafega pela Storefront API.';

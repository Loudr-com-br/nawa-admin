-- Gate de validação clínica (spec §6.2, §7).
--
-- Até aqui o pedido ia de `paid` direto para `in_production`: um pedido pago podia
-- entrar em produção sem nenhum profissional ter olhado. A tela de confirmação já
-- diz ao paciente que "o protocolo passa por validação clínica", e a decisão de
-- 11/08 fez disso a promessa regulatória central — a plataforma agrega, e a
-- responsabilidade clínica é de quem revisa. Faltava o sistema cumprir.
--
-- Dois estados novos:
--   in_clinical_review  — pago, aguardando o profissional. É onde o pedido FICA.
--   clinically_rejected — reprovado; não segue para produção.
-- `paid` continua no enum: é o estado dos pedidos antigos e o rótulo do momento em
-- que o pagamento entrou. Daqui em diante o pagamento leva direto à revisão, e o
-- fato "pagou" fica registrado em order_events e em payment_status.

alter type order_status add value if not exists 'in_clinical_review' before 'in_production';
alter type order_status add value if not exists 'clinically_rejected' after 'failed';

-- Registro da decisão clínica. Existe separado de order_events porque é registro
-- profissional: precisa dizer QUEM decidiu, QUANDO e POR QUÊ, e ser auditável de
-- forma estruturada — não como uma linha de texto na linha do tempo.
create table clinical_reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  reviewer_id uuid references users_internal(id), -- quem decidiu (null = sistema)
  decision    text not null check (decision in ('approved', 'rejected')),
  notes       text,                                -- justificativa clínica
  reviewed_at timestamptz not null default now()
);

create index clinical_reviews_order_id_idx on clinical_reviews (order_id);

-- Um pedido tem UMA decisão vigente. Se precisar reabrir, apaga-se a anterior de
-- forma explícita — decisão clínica não deve acumular silenciosamente.
create unique index clinical_reviews_one_per_order on clinical_reviews (order_id);

-- RLS: dado clínico. Service role (server-only) bypassa; médico e operador leem;
-- só super admin mexe direto. A ESCRITA acontece pela API, que checa o papel.
alter table clinical_reviews enable row level security;
create policy sa_all on clinical_reviews for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy clinical_read on clinical_reviews for select to authenticated
  using (public.has_role('doctor', 'operator'));

comment on table public.clinical_reviews is
  'Decisão da revisão clínica do protocolo. Gate obrigatório entre pagamento e produção.';

-- Frete no pedido (spec §6.2).
--
-- Até aqui `orders.total` era só a soma dos itens, enquanto o checkout exibia
-- subtotal + entrega — o paciente via um total e era cobrado outro. O frete passa
-- a viver no pedido, então o que aparece na tela é o que vai para o provedor de
-- pagamento e o que fica registrado no painel.
--
-- Aditiva e retrocompatível: coluna nova com default 0, nada existente muda.
-- Pedidos anteriores seguem com frete zero, que é o que de fato foi cobrado.

alter table public.orders
  add column if not exists shipping_total numeric not null default 0;

comment on column public.orders.shipping_total is
  'Frete cobrado no pedido, em reais. Somado a total. Resolvido SEMPRE no servidor a partir da tabela de tarifas — o front escolhe a modalidade, nunca o preço.';

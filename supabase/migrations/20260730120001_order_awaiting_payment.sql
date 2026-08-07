-- Checkout sem cobrança: o pedido é criado ANTES do pagamento.
-- Novo estado inicial "aguardando pagamento" (antes de "paid").
-- A cobrança (Pagar.me) depois vira paid → in_production → ...
alter type order_status add value if not exists 'awaiting_payment' before 'paid';

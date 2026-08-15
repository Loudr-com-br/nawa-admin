-- Pré-autorização (spec §6.2, §7).
--
-- Modelo adotado em 14/08: o checkout RESERVA o valor no cartão em vez de cobrar.
-- A captura acontece só depois que a revisão clínica aprova o protocolo; se
-- reprovar, a autorização é cancelada e o limite volta ao paciente.
--
-- Isso resolve o estorno pela raiz: não existe dinheiro a devolver, porque nunca
-- foi capturado. E alinha o dinheiro com a promessa que fazemos na confirmação.
--
-- Faltava vocabulário para "reservado": tanto `payment_txn_status` (a transação)
-- quanto `payment_status` (o pedido) só sabiam dizer pago, pendente, falho ou
-- estornado. Sem um estado próprio, uma autorização pendente seria confundida com
-- PIX aguardando pagamento — e os dois exigem tratamento oposto: a autorização já
-- comprometeu o limite do paciente, o PIX não comprometeu nada.

alter type payment_txn_status add value if not exists 'authorized' after 'processing';
alter type payment_status     add value if not exists 'authorized' after 'pending';

comment on type public.payment_txn_status is
  'Estado da transação no provedor. `authorized` = limite reservado, ainda NÃO capturado.';

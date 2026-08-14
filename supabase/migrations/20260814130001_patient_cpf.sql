-- CPF do paciente (spec §6.2).
--
-- O provedor de pagamento exige o documento do pagador (obrigatório no PIX, e um
-- CPF inválido faz o cartão ser RECUSADO). Até aqui o CPF era coletado no bloco
-- "Dados pessoais" do checkout e usado só naquela requisição — quem voltasse para
-- pagar um pedido pendente pelo painel não tinha CPF nenhum a enviar.
--
-- Aditiva e opcional: pacientes existentes ficam com NULL e preenchem no próximo
-- checkout. Guardamos só dígitos, sem máscara, para não haver duas grafias do
-- mesmo documento.
--
-- LGPD: é dado pessoal identificável. Fica sob as mesmas políticas de RLS da
-- tabela `patients` — nunca trafega pela Storefront API (contrato público).

alter table public.patients
  add column if not exists cpf text;

comment on column public.patients.cpf is
  'CPF do paciente, só dígitos (11 caracteres). Usado como documento do pagador no provedor de pagamento. Dado pessoal — não expor na Storefront API.';

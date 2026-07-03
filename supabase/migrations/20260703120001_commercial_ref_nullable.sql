-- Produto comercial pode não referenciar plano/fórmula (ex: add-ons próprios).
alter table commercial_products alter column ref_id drop not null;

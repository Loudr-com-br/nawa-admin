-- Prefixo visível da chave (ex: "nawa_sk_ab12") para identificação na lista.
-- Não permite reconstruir a chave — apenas ajuda a distinguir.
alter table api_keys add column key_prefix text;

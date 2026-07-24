-- Catálogo v2 — imagem de produto (item), protocolo e coleção.
--
-- Aditivo e nullable: não afeta linhas existentes. O storefront passa a expor
-- `imageUrl` (string vazia quando null), campo aditivo do contrato — o front já
-- consome com fallback gracioso (painel da marca quando ausente).

alter table items       add column if not exists image_url text;
alter table protocols   add column if not exists image_url text;
alter table collections add column if not exists image_url text;

-- Bucket público para as imagens do catálogo. Leitura pública (as imagens não
-- são dado sensível); a escrita é feita pelo backoffice server-side com service
-- role (bypassa RLS de storage), então não é preciso policy de insert.
insert into storage.buckets (id, name, public)
values ('catalog', 'catalog', true)
on conflict (id) do nothing;

-- Catálogo v2 — galeria de imagens por item (produto).
--
-- Passa de imagem única (image_url) para uma galeria ordenada (image_urls). A
-- capa continua sendo image_url (espelha image_urls[0]) para compat de consumidores
-- que leem só uma imagem. Aditivo; backfill preserva a imagem já enviada.

alter table items add column if not exists image_urls text[] not null default '{}';

-- Leva a imagem única existente para a galeria (quando ainda vazia).
update items
   set image_urls = array[image_url]
 where image_url is not null
   and image_url <> ''
   and coalesce(array_length(image_urls, 1), 0) = 0;

-- Indexação & busca do catálogo (endurecimento da fronteira — api-boundary §3.3).
-- Hoje a Storefront devolve listas completas; isto habilita busca por nome com
-- índice (trigram) e prepara paginação/filtros. Aditivo — não muda o contrato.

create extension if not exists pg_trgm;

-- Índices trigram para busca por substring (ILIKE) rápida em nome.
create index if not exists items_name_trgm     on items     using gin (name gin_trgm_ops);
create index if not exists protocols_name_trgm on protocols using gin (name gin_trgm_ops);

-- Índices para os filtros/ordenacão comuns da vitrine (published + public).
create index if not exists items_pub_idx     on items     (status, visibility) where sells_standalone = true;
create index if not exists protocols_pub_idx on protocols (status, visibility);

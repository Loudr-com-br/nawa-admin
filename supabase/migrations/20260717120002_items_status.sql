-- ═══════════════════════════════════════════════════════════════════════════
-- Correção da catalog_v2: items ganha `status` (draft | published).
--
-- A tabela v1 `formulas` não tinha coluna de status (catálogo clínico era sempre
-- "ativo"). Ao renomear para `items`, a catalog_v2 adicionou as colunas comerciais
-- mas esqueceu `status`, exigido pelo spec §5 (item publica/despublica como o resto
-- do catálogo). Esta migração completa o schema.
-- ═══════════════════════════════════════════════════════════════════════════

alter table items add column status content_status not null default 'draft';

create index on items (status);

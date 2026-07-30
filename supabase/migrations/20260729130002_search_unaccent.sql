-- Busca acento-insensível (pt-BR): "magnesio" deve achar "Magnésio".
-- unaccent não é immutable por padrão → wrapper immutable para poder indexar.

create extension if not exists unaccent;

create or replace function public.immutable_unaccent(text)
  returns text language sql immutable parallel safe as
$$ select public.unaccent('public.unaccent', $1) $$;

-- Índices trigram sobre o nome SEM acento (usados pela busca).
create index if not exists items_name_unaccent_trgm
  on items using gin (public.immutable_unaccent(name) gin_trgm_ops);
create index if not exists protocols_name_unaccent_trgm
  on protocols using gin (public.immutable_unaccent(name) gin_trgm_ops);

-- Busca unificada (itens + protocolos), published + public, acento-insensível,
-- com FAIL-CLOSED (protocolo com item medical_only não sai — §6.1).
create or replace function public.storefront_search(q text, lim int default 20)
returns table (ref_type text, slug text, name text, price numeric, image_url text)
language sql stable as $$
  with term as (select '%' || public.immutable_unaccent(coalesce(q, '')) || '%' as p)
  (
    select 'item'::text, i.slug, i.name, i.price, coalesce(i.image_url, '')
    from items i, term
    where i.status = 'published' and i.visibility = 'public' and i.sells_standalone = true
      and public.immutable_unaccent(i.name) ilike term.p
    order by i.name
    limit lim
  )
  union all
  (
    select 'protocol'::text, p.slug, p.name, p.price, coalesce(p.image_url, '')
    from protocols p, term
    where p.status = 'published' and p.visibility = 'public'
      and public.immutable_unaccent(p.name) ilike term.p
      and not exists (
        select 1 from protocol_items pi join items it on it.id = pi.item_id
        where pi.protocol_id = p.id and it.visibility = 'medical_only'
      )
    order by p.name
    limit lim
  );
$$;

grant execute on function public.storefront_search(text, int) to authenticated, anon, service_role;

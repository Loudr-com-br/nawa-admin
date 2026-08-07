-- Rate limiting por chave na Storefront (api-boundary §3.4). Contador de janela
-- fixa no Postgres — atômico e compartilhado entre instâncias (Netlify é
-- stateless/distribuído, então contador em memória por instância não serve).
--
-- Nota: só conta requisições que CHEGAM à função (cache miss). Os hits servidos
-- do CDN não invocam a função e não contam — o que é o objetivo: proteger o
-- backend/Postgres de abuso, não o catálogo cacheado.

create table storefront_rate_limits (
  key_id       uuid not null references api_keys(id) on delete cascade,
  window_start timestamptz not null,
  count        int not null default 0,
  primary key (key_id, window_start)
);
-- Para limpeza futura de janelas antigas (cron/rotina).
create index storefront_rate_limits_window_idx on storefront_rate_limits (window_start);

alter table storefront_rate_limits enable row level security;
-- Só service role (bypassa RLS) e super_admin tocam nisto.
create policy sa_all on storefront_rate_limits for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Incremento atômico + veredito, numa chamada. Janela fixa alinhada a p_window.
create or replace function storefront_rate_hit(
  p_key_id uuid, p_limit int, p_window_seconds int
)
returns table(allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  w_start   timestamptz;
  new_count int;
begin
  w_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into storefront_rate_limits (key_id, window_start, count)
  values (p_key_id, w_start, 1)
  on conflict (key_id, window_start)
    do update set count = storefront_rate_limits.count + 1
  returning count into new_count;

  allowed   := new_count <= p_limit;
  remaining := greatest(0, p_limit - new_count);
  reset_at  := w_start + make_interval(secs => p_window_seconds);
  return next;
end;
$$;

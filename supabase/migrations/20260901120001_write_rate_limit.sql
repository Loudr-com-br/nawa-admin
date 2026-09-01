-- Rate limiting das rotas de ESCRITA (checkout, pagamento, cadastro).
--
-- O limitador que já existia (storefront_rate_limits) tem chave estrangeira
-- para api_keys, então só serve para tráfego server-to-server autenticado por
-- chave. As rotas de escrita são chamadas em nome de um PACIENTE — ou de um
-- visitante ainda sem conta —, e o alvo a proteger é outro: um endpoint de
-- cobrança sem limite é o alvo clássico de teste de cartões roubados, e a conta
-- (taxa e reputação junto ao adquirente) cai na NAWA.
--
-- Mesmo desenho do outro: janela fixa, contagem atômica no Postgres. Contador
-- em memória não serve porque o Netlify é distribuído e sem estado — cada
-- instância teria o próprio contador e o limite real seria N vezes maior.
--
-- A diferença é a chave: aqui o sujeito é texto livre (`patient:<uuid>` ou
-- `ip:<addr>`), com o escopo separado para que o limite do pagamento não
-- consuma a cota do cadastro.

create table rate_limits (
  scope        text        not null,
  subject      text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (scope, subject, window_start)
);

-- Para a limpeza de janelas vencidas.
create index rate_limits_window_idx on rate_limits (window_start);

alter table rate_limits enable row level security;
-- Só a service role (que bypassa RLS) e o super_admin tocam nisto.
create policy sa_all on rate_limits for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Incremento atômico + veredito numa chamada só.
create or replace function rate_hit(
  p_scope text, p_subject text, p_limit int, p_window_seconds int
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

  insert into rate_limits (scope, subject, window_start, count)
  values (p_scope, p_subject, w_start, 1)
  on conflict (scope, subject, window_start)
    do update set count = rate_limits.count + 1
  returning count into new_count;

  allowed   := new_count <= p_limit;
  remaining := greatest(0, p_limit - new_count);
  reset_at  := w_start + make_interval(secs => p_window_seconds);
  return next;
end;
$$;

-- Higiene: apaga janelas com mais de um dia. Chamável por rotina/cron; nenhuma
-- decisão depende de histórico aqui, o contador só vale dentro da janela.
create or replace function rate_limits_purge()
returns void
language sql
security definer
set search_path = public
as $$
  delete from rate_limits where window_start < now() - interval '1 day';
$$;

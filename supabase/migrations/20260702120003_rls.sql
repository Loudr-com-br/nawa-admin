-- RLS — Row Level Security por papel (spec §7 e §8.2).
-- Regra geral: nada acessível sem política explícita.
-- super_admin: acesso total. Demais papéis: least privilege.
-- Ponto de partida — refinar conforme os módulos amadurecem.

-- Habilita RLS em todas as tabelas.
do $$
declare t text;
begin
  foreach t in array array[
    'journeys','plans','protocols','formulas','commercial_products','attributes',
    'entity_attributes','anamnesis_forms','anamnesis_questions','promotions',
    'patients','orders','order_items','subscriptions','users_internal',
    'audit_log','api_keys','botane_sync_log'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- super_admin sempre tem acesso total
    execute format(
      'create policy sa_all on %I for all to authenticated
         using (public.is_super_admin()) with check (public.is_super_admin())', t);
  end loop;
end $$;

-- ── Catálogo comercial + taxonomia + anamnese + promoções ──
-- Geridos por catalog_admin (sem dado clínico).
do $$
declare t text;
begin
  foreach t in array array[
    'journeys','plans','commercial_products','attributes','entity_attributes',
    'anamnesis_forms','anamnesis_questions','promotions'
  ] loop
    execute format(
      'create policy catalog_manage on %I for all to authenticated
         using (public.has_role(''catalog_admin''))
         with check (public.has_role(''catalog_admin''))', t);
  end loop;
end $$;

-- ── Catálogo clínico ──
-- Geridos pelo médico. catalog_admin não enxerga.
create policy doctor_manage on protocols for all to authenticated
  using (public.has_role('doctor')) with check (public.has_role('doctor'));
create policy doctor_manage on formulas for all to authenticated
  using (public.has_role('doctor')) with check (public.has_role('doctor'));

-- ── Pacientes (dado clínico sensível) ──
-- Médico gere; operador e catalog_admin não acessam.
create policy doctor_manage on patients for all to authenticated
  using (public.has_role('doctor')) with check (public.has_role('doctor'));

-- ── Pedidos e itens ──
-- Operador e médico leem; super_admin gere (política sa_all).
create policy operator_read on orders for select to authenticated
  using (public.has_role('operator', 'doctor'));
create policy operator_read on order_items for select to authenticated
  using (public.has_role('operator', 'doctor'));

-- ── Assinaturas ──
create policy operator_read on subscriptions for select to authenticated
  using (public.has_role('operator'));

-- ── Usuários internos ──
-- Cada usuário lê a própria linha (para saber o próprio papel).
create policy read_self on users_internal for select to authenticated
  using (id = auth.uid());

-- ── Auditoria (append-only) ──
-- Só super_admin lê (via sa_all). Inserção permitida a qualquer interno;
-- sem update/delete — registro imutável (§8.3).
create policy audit_insert on audit_log for insert to authenticated
  with check (public.current_app_role() is not null);

-- ── Log de sync Botane ──
create policy operator_read on botane_sync_log for select to authenticated
  using (public.has_role('operator'));

-- api_keys: somente super_admin (coberto por sa_all). Nenhuma política extra.

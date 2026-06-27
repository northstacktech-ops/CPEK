-- ============================================================================
-- CPEK — Row Level Security (RLS)
-- Aplicar APÓS `prisma migrate deploy` (as tabelas precisam existir).
-- Rodar com papel privilegiado (postgres) via DIRECT_URL.
--
-- Estratégia: o tenant atual vem de uma variável de sessão `app.current_tenant`,
-- injetada por transação pela aplicação (server/utils/withTenant.ts).
-- Isso funciona com Prisma (que não propaga o JWT do Supabase para o Postgres).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Papel de runtime do Prisma — SUBMETIDO ao RLS (sem BYPASSRLS).
--    Migrations continuam usando `postgres` (DIRECT_URL). O runtime usa este.
-- ─────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select from pg_roles where rolname = 'cpek_app') then
    create role cpek_app login password :'cpek_app_password' noinherit nobypassrls;
  end if;
end$$;

grant connect on database postgres to cpek_app;
grant usage on schema public to cpek_app;
grant select, insert, update, delete on all tables in schema public to cpek_app;
grant usage, select on all sequences in schema public to cpek_app;
alter default privileges in schema public
  grant select, insert, update, delete on tables to cpek_app;
alter default privileges in schema public
  grant usage, select on sequences to cpek_app;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Helper: tenant atual a partir da variável de sessão.
--    `true` no current_setting evita erro quando a var não foi definida.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function app_current_tenant()
returns uuid
language sql
stable
set search_path = ''  -- hardening: search_path fixo (advisor function_search_path_mutable)
as $$
  select nullif(current_setting('app.current_tenant', true), '')::uuid
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Habilitar + FORÇAR RLS e criar a policy de isolamento em cada tabela.
--    FORCE garante que mesmo o owner da tabela seja submetido (defesa extra).
--    A policy exige que app.current_tenant esteja setado (senão nega tudo).
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
  tenant_tables text[] := array[
    'account', 'app_user', 'form_permission', 'company',
    'catalog_value', 'cost_center', 'fee_profile', 'bank_account',
    'contact', 'custom_field', 'period',
    'entry', 'exit', 'closing', 'audit_log'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists tenant_isolation on public.%I;', t);
    -- account isola pela própria coluna id; demais tabelas pela coluna tenant_id
    if t = 'account' then
      execute format($f$
        create policy tenant_isolation on public.%I
        using (id = app_current_tenant())
        with check (id = app_current_tenant());
      $f$, t);
    else
      execute format($f$
        create policy tenant_isolation on public.%I
        using (tenant_id = app_current_tenant())
        with check (tenant_id = app_current_tenant());
      $f$, t);
    end if;
  end loop;
end$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Teste de fumaça (rodar manualmente para provar o isolamento):
--
--   set role cpek_app;
--   select set_config('app.current_tenant', '<TENANT_A_UUID>', false);
--   select count(*) from entry;            -- só linhas do tenant A
--   select set_config('app.current_tenant', '<TENANT_B_UUID>', false);
--   select count(*) from entry;            -- só linhas do tenant B
--   reset role;
--
-- Sem set_config, app_current_tenant() = null → a policy nega tudo (count = 0).
-- Esse é o comportamento desejado: "fail closed".
-- ─────────────────────────────────────────────────────────────────────────

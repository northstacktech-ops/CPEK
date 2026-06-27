# Testes — CPEK

Três camadas (ARCHITECTURE §15):

| Camada | Ferramenta | Arquivos |
|---|---|---|
| Unit | Vitest | `tests/unit/*.spec.ts` (DRE, snapshot custom, fórmulas dashboard) |
| Integração | Vitest + DB de teste | `tests/rls-isolation.spec.ts` (**isolamento RLS em matriz**, fail-closed) |
| E2E | Playwright | `tests/e2e/*.spec.ts` (fluxos + **vazamento por endpoint**) |

## Pré-requisito do teste de RLS: um Postgres de teste com policies aplicadas

O teste em matriz roda **contra um banco real** conectando pelo papel `cpek_app`
(submetido ao RLS). Passo a passo:

```bash
# 1. Suba um Postgres de teste (ex.: Docker) e crie um banco descartável.
#    Use a porta 5432 (conexão direta). Não precisa de pooler para o teste local.

# 2. Aponte as URLs de migration/runtime para o banco de teste:
export DIRECT_URL="postgresql://postgres:postgres@localhost:5432/cpek_test"
export DATABASE_URL="postgresql://cpek_app:cpek_app@localhost:5432/cpek_test"
export CPEK_APP_DB_PASSWORD="cpek_app"

# 3. Aplique o schema (cria as tabelas) — papel postgres.
pnpm prisma migrate deploy

# 4. Crie o papel cpek_app + habilite/force RLS + policies.
psql "$DIRECT_URL" -v cpek_app_password="'$CPEK_APP_DB_PASSWORD'" -f prisma/rls/policies.sql

# 5. Rode a matriz de isolamento.
pnpm test tests/rls-isolation.spec.ts
```

> O teste conecta via `DATABASE_URL` (papel `cpek_app`). Se você apontar para o
> papel `postgres`, o RLS ainda se aplica (as policies usam `FORCE ROW LEVEL
> SECURITY`), mas o cenário fiel de runtime é `cpek_app`.

O que ele prova:
- com `app.current_tenant = A`, **nenhuma** linha de B aparece em **nenhuma** das
  entidades de tenant;
- **sem** tenant setado, toda entidade retorna vazio (*fail-closed*);
- a escrita respeita o `WITH CHECK` (A não grava em B).

## E2E de vazamento por endpoint

`tests/e2e/leak.spec.ts` autentica como tenant A e tenta acessar recursos de B em
cada endpoint, esperando `404/403`. Defina, ao subir o ambiente de teste:

```bash
export E2E_TOKEN_A="<access_token do usuário A>"
export E2E_B_COMPANY_ID="..."
export E2E_B_ENTRY_ID="..."
export E2E_B_EXIT_ID="..."
export E2E_B_CLOSING_ID="..."
export E2E_B_CONTACT_ID="..."
pnpm test:e2e
```

Sem essas variáveis os casos são marcados como `skip` (não falham), mas o gate de
CI de produção deve provê-las. Ver `.github/workflows/ci.yml`.

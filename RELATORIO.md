# RELATÓRIO — Estruturação do projeto CPEK

> Estruturação completa do monorepo CPEK conforme `docs/ARCHITECTURE.md` (v2),
> `prisma/schema.prisma`, `prisma/rls/policies.sql` e `README.md`.
> Fonte de verdade: **ARCHITECTURE.md** (em conflito, ela vence).

Data: 2026-06-19 · Fase 0 (segurança) implementada de ponta a ponta; Fases 1–4
estruturadas como esqueleto tipado.

---

## 1. Resumo da arquitetura (entendimento)

- **Stack fixa:** Vue 3 + Nuxt 3 (Nitro) · PostgreSQL/Supabase · Prisma · TypeScript ·
  Pinia · zod · Nuxt UI · Tailwind · Vitest + Playwright · Vercel.
- **Invariante de segurança (fail-closed):** todo acesso a dado de negócio passa por
  `withTenant(tenantId, tx => …)`; `tenantId` vem **sempre** do JWT validado, nunca do
  corpo da request. RLS no banco (`app.current_tenant` + papel `cpek_app` com FORCE RLS)
  + tenant guard na aplicação. A instância base do Prisma é **proibida** em `server/api/**`.
- **Regras de dados:** dinheiro `Decimal(14,2)`, taxa `Decimal(14,4)`, nunca `Float`;
  cadastros desativam (não excluem); período fechado trava edição (409); campos custom
  são snapshot JSON imutável resolvido na leitura.

---

## 2. O que foi IMPLEMENTADO (Fase 0 — fundação de segurança)

| Item | Arquivo(s) | Notas |
|---|---|---|
| Schema oficial (verbatim) | `prisma/schema.prisma` | movido para o local da §10 |
| RLS oficial (verbatim) | `prisma/rls/policies.sql` | movido para o local da §10 |
| Migration inicial | `prisma/migrations/20250101000000_init/migration.sql` | 15 tabelas + 9 enums, FKs, índices e uniques do schema |
| Prisma base + extension de tenant guard | `server/utils/prisma.ts` | `prismaBase` (bootstrap) + `prisma` estendido; injeta `tenant_id` em create/update e `where` em reads (defesa em profundidade, §4.3) |
| `withTenant` (§4.2) | `server/utils/withTenant.ts` | transação + `set_config('app.current_tenant', …, true)`; popula `AsyncLocalStorage` para a extension |
| Middleware de auth | `server/middleware/auth.ts` | valida JWT Supabase (HS256), extrai `account_id`/`role` para `event.context.auth` |
| Verificação de JWT | `server/utils/jwt.ts` | HS256 via `node:crypto`, sem dependências; **testado**: rejeita segredo errado e adulteração de claims |
| Claims Supabase (service_role) | `server/utils/supabaseAdmin.ts` | `setUserClaims` grava `app_metadata={account_id, role}` no signup/convite |
| Helpers de handler | `server/utils/http.ts` | `requireAuth/requireAdmin`, `validateBody/validateQuery` (zod), `apiError`, `periodClosedError` (409) |
| **Teste RLS em matriz** (§15.1) | `tests/rls-isolation.spec.ts` + `tests/helpers/db.ts` | itera sobre 12 entidades de tenant; prova isolamento + fail-closed + WITH CHECK |
| **E2E de vazamento por endpoint** | `tests/e2e/leak.spec.ts` | A tenta acessar recurso de B em cada endpoint → 403/404 |
| Pipeline de CI | `.github/workflows/ci.yml` | lint → typecheck → migrate deploy → policies → test (RLS matriz) → migrate diff |
| **Regra de arquitetura (ESLint)** | `eslint-rules/no-base-prisma-in-api.js` + `eslint.config.mjs` | proíbe `prisma`/`prismaBase` em `server/api/**`; **testada**: flagra base, permite `withTenant` |
| Seed por template (§13) | `prisma/seed/templates/supervisao.json` + `prisma/seed/seed.ts` + `server/utils/seedTemplate.ts` | idempotente; Serviços (Cautelar/Certicar/Constatação), Categorias+`dreGroup`, Status, Formas de pagamento, Centros de custo, campos custom |
| `.env.example` | `.env.example` | todas as variáveis do README, sem segredos |
| Configs | `nuxt.config.ts`, `tailwind.config.ts` (tokens §11), `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.prettierrc.json` | |

### Rotas de API implementadas (não-stub)
- `GET /api/health` (público), `GET /api/me`, `GET /api/companies`,
  `POST /api/companies` (admin → aplica template idempotente, §13).

---

## 3. O que ficou como STUB tipado (Fases 1–4)

Todas as rotas da §8 existem como handlers Nitro **tipados, com validação zod e um
`TODO` apontando a seção da ARCHITECTURE**. Retornam `501 NOT_IMPLEMENTED` até serem
implementadas. Total: **51 arquivos** em `server/api/**`.

- **Dashboard (§12):** `GET /api/dashboard`, `GET /api/bank-accounts`.
- **Lançamentos (§6/§8):** `entries`, `exits`, `closings` — list/create/get/patch/delete/export
  (patch/delete já preveem 409 de período fechado + audit nos TODOs).
- **Cadastros (§5):** `catalogs`, `cost-centers`, `fee-profiles`, `bank-accounts`, `custom-fields`
  (CRUD + confirmação/propagação ao histórico §6).
- **DRE (§7):** `GET /api/dre`, `GET /api/dre/export`.
- **Contatos (§5):** `contacts` (get/post/patch — desativar).
- **Períodos (§8/§14):** `periods` + `:id/close` + `:id/reopen` (admin + audit).
- **Membros (§8/§9):** `settings/members` (get/post/patch — admin).

Utilitários de domínio em esqueleto (com TODO): `server/utils/dre.ts` (§7),
`server/utils/customFields.ts` (§6), `server/utils/csv.ts`, `server/utils/pdf.ts`,
`server/utils/audit.ts`.

Frontend em esqueleto: stores Pinia (`session`, `company`, `period`), composables
(`useApi`, `useAuth`, `useCompany`, `usePeriod`, `useDashboard`, `useDre`), layouts
(`default` com sidebar/company switcher/period selector; `auth`), páginas (dashboard,
login, lançamentos, cadastros, DRE, contatos, configurações), `middleware/auth.global.ts`,
tipos (`types/dre.ts`, `types/dashboard.ts`, `types/api.ts`).

---

## 4. Decisões pendentes — defaults adotados (§19)

| Decisão | Default aplicado | Marcado no código |
|---|---|---|
| 5º card do dashboard | **Vencidos** | `types/dashboard.ts`, `pages/index.vue` — `TODO(decisão)` |
| Granularidade de permissão | **2 papéis** (admin/member); `FormPermission` como gancho | schema + `requireAdmin` |
| Usuário ↔ conta | **1:1 no MVP** (N:N só na V2) | schema (`User.tenantId`) |
| 2ª empresa | parametrizada pelo template de seed | `prisma/seed/templates/` (duplicar JSON p/ Securise/Semijoias) |
| UI kit | **Nuxt UI** | `nuxt.config.ts` |
| Reabrir período | admin + audit | `periods/[id]/reopen.post.ts` |
| Recorrência de lançamentos | fora do MVP | — |

Ambiguidades resolvidas pela opção mais segura:
- **Seed sob RLS FORCE:** o seed roda dentro de `withTenant` (igual ao runtime), porque
  `FORCE ROW LEVEL SECURITY` submete até o owner — inserir exige `app.current_tenant`.
- **FK opcional de conta bancária** nos lançamentos → `ON DELETE SET NULL` (não apaga o
  lançamento ao remover a conta).
- **JWT HS256 sem dependência externa** (`node:crypto`), evitando superfície extra.

---

## 5. Verificação executada

A sandbox **não tem acesso ao registro npm** (HTTP 403), então `pnpm install` / `build`
não puderam rodar aqui — devem ser executados na máquina do dev (ver §6). Verificações
estáticas que **passaram** nesta sessão:

- JSON válido: `package.json`, `supervisao.json`, `.prettierrc.json`.
  (`tsconfig.json` usa JSONC com comentários — válido para o TypeScript.)
- Módulo da regra ESLint carrega como ESM; `eslint.config.mjs` carrega.
- **Regra `no-base-prisma-in-api` testada** contra AST sintética: flagra `prisma` e
  `prismaBase`, permite `withTenant`.
- **Primitiva de JWT testada** (port da lógica de `jwt.ts`): token válido aceito;
  segredo errado e payload adulterado (troca de tenant) rejeitados.
- Estrutura da §10 criada; 51 rotas em `server/api/**`; nenhuma importa o Prisma base.
- Migration: 15 tabelas + 9 enums — bate com o schema (15 models, 9 enums) e com as
  15 tabelas listadas em `policies.sql`.

> ⚠️ **Pendente de execução na máquina do dev** (definição de pronto): `pnpm install`,
> `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm dev` e o teste de isolamento RLS
> contra um Postgres de teste. O CI (`.github/workflows/ci.yml`) executa exatamente
> essa sequência. `pnpm typecheck` depende do `prisma generate` (roda no `postinstall`)
> para gerar os tipos de `@prisma/client`.

---

## 6. Como rodar (resumo — detalhes no README e em `tests/README.md`)

```bash
pnpm install                      # postinstall: nuxt prepare + prisma generate
cp .env.example .env.local        # preencher segredos
pnpm prisma migrate deploy        # cria as tabelas (DIRECT_URL)
pnpm db:rls                       # papel cpek_app + RLS + policies (psql)
pnpm db:seed                      # template Supervisão (idempotente)

pnpm typecheck && pnpm lint       # qualidade (lint inclui a regra §4.3)
pnpm test                         # unit + RLS em matriz (precisa de DB de teste)
pnpm dev                          # http://localhost:3000
```

Teste de isolamento RLS: ver **`tests/README.md`** (precisa de um Postgres de teste
com schema migrado + policies aplicadas, conectando pelo papel `cpek_app`).

---

## 7. Próximos passos por fase do roadmap (§18)

**Fase 0 (fechar):** rodar `pnpm install`/`typecheck`/`lint`/`build` na máquina do dev;
provisionar Supabase (dev/staging/prod) + Vercel + domínio; executar a matriz RLS contra
o DB de teste e confirmar o gate verde no CI; gerar o `pnpm-lock.yaml` (commitar).

**Fase 1 — Shell + contexto:** implementar `useAuth` (login real + redirect por papel),
`GET /api/dashboard` (§12, com Vencidos), company switcher com reset de contexto e
estados de tela (vazio/skeleton/erro).

**Fase 2 — Lançamentos + cadastros:** CRUD de catálogos/cost-centers/fee-profiles/
bank-accounts/contatos; `custom-fields` (CRUD + confirmação + snapshot + propagação §6);
entradas/saídas (validação por etapa, snapshot, export CSV); aplicar template na criação
de empresa (já pronto em `applyTemplate`).

**Fase 3 — Fechamento + DRE:** fechamento (boletos) + fechar/reabrir período (trava +
audit); `server/utils/dre.ts` (agregação por `dreGroup`/`serviceId`/mês, realizado×
agendado, filtro por contas, linhas expansíveis); export PDF (vue-pdf) + CSV.

**Fase 4 — Configurações + polimento:** conta/empresas/membros (convite + papel +
`setUserClaims`), auditoria; estados de erro/loading/vazio e acessibilidade em todas as
telas; completar o E2E de vazamento com tokens/recursos de teste.

**Fase 5 — SaaS (V2):** painel admin, onboarding por template, billing, Membership N:N
(§17) e, se medido, as alavancas de escala da §16.

---

## 8. Observações / dívidas conhecidas

- `prisma/_schema.prisma.original.txt` é o `schema.prisma.txt` original (cópia idêntica
  ao schema). Mantido por precaução — **pode ser removido** quando confirmado.
- Tokens do Tailwind (§11) usam o Azul Royal `#1E3A8A` como aproximação;
  `TODO(§11.1)`: extrair hex/spacing exatos do Figma.
- `pnpm-lock.yaml` ainda não existe (sem registro npm na sandbox). Gerar no primeiro
  `pnpm install` e commitar (o CI usa `--frozen-lockfile`).
- A extension de tenant guard é rede de segurança; a **garantia final é o RLS**. Não
  remover nenhum dos dois.

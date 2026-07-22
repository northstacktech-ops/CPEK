# CPEK — Setup & Desenvolvimento

Gestão financeira multiunidade · multi-tenant · Vue 3 + Nuxt 3 · Supabase/PostgreSQL · Prisma · Vercel.

> Arquitetura completa em [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) (v2).
> Schema em [`prisma/schema.prisma`](./prisma/schema.prisma) · RLS em [`prisma/rls/policies.sql`](./prisma/rls/policies.sql).

---

## Pré-requisitos

- Node 20+ e pnpm (ou npm)
- Conta Supabase (projeto dev) e Vercel
- Prisma CLI (via devDependency)

---

## 1. Variáveis de ambiente (`.env`)

> O Nuxt/Nitro só carrega `.env` automaticamente em dev — `.env.local` (citado em
> versões antigas deste doc) **não é lido** e o servidor sobe sem as variáveis,
> falhando com "supabaseUrl is required." no login.

```env
# Runtime — Shared Pooler/Supavisor (papel cpek_app, submetido ao RLS). Usuário
# leva ".<project_ref>", e "aws-N-" varia por projeto — pegue a string exata em
# Dashboard → Connect → aba "Transaction pooler" (NUNCA "Direct connection":
# essa é IPv6-only e não funciona a partir de serverless, ex.: Vercel).
DATABASE_URL="postgresql://cpek_app.<project_ref>:${CPEK_APP_DB_PASSWORD}@aws-N-<região>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
# Migrations — conexão direta (papel postgres)
DIRECT_URL="postgresql://postgres:<senha>@db.<proj>.supabase.co:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://<proj>.supabase.co"
SUPABASE_ANON_KEY="<anon>"
SUPABASE_SERVICE_ROLE_KEY="<service_role>"   # SÓ no servidor

CPEK_APP_DB_PASSWORD="<senha forte do papel cpek_app>"
```

> `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o client. `DIRECT_URL` nunca é usada em runtime.

---

## 2. Instalação

```bash
pnpm install
```

---

## 3. Banco — ordem importa

```bash
# 3.1 Aplica o schema (cria as tabelas) — usa DIRECT_URL
pnpm prisma migrate deploy        # ou `prisma migrate dev` em desenvolvimento

# 3.2 Cria o papel de runtime + habilita/força RLS + policies (rodar como postgres)
psql "$DIRECT_URL" -v cpek_app_password="'$CPEK_APP_DB_PASSWORD'" -f prisma/rls/policies.sql

# 3.3 (opcional) Seed do template Supervisão
pnpm prisma db seed
```

**Por que nessa ordem:** as policies referenciam as tabelas (precisam existir antes). O papel `cpek_app` recebe `grant` nas tabelas existentes; `alter default privileges` cobre as futuras.

---

## 4. Provar o isolamento (faça isso cedo — é gate de CI)

```bash
pnpm test tests/rls-isolation.spec.ts
```

O teste roda **em matriz sobre todas as entidades de tenant**: cria dois tenants, popula cada um e verifica que, com `app.current_tenant = A`, nenhuma linha de B aparece em **nenhuma** entidade — e que **sem** tenant setado o retorno é vazio (*fail-closed*). Um complemento E2E (Playwright) tenta acessar, autenticado como A, um recurso de B em cada endpoint e espera 404/vazio.

---

## 5. Rodar

```bash
pnpm dev      # http://localhost:3000
pnpm build
pnpm preview
```

---

## 6. Scripts úteis

| Script | Faz |
|---|---|
| `pnpm prisma studio` | UI do banco (cuidado: roda como owner, ignora RLS) |
| `pnpm prisma migrate dev --name <x>` | nova migration em dev |
| `pnpm lint` / `pnpm typecheck` | qualidade (lint inclui a regra do §8) |
| `pnpm test` | unit + integração (inclui RLS em matriz) |
| `pnpm test:e2e` | Playwright (inclui vazamento por endpoint) |

---

## 7. Deploy (Vercel)

1. Conectar o repo; configurar env vars (sem `DIRECT_URL` no runtime).
2. CI: `lint → typecheck → test (RLS matriz) → migrate diff`.
3. Migrations de produção: job dedicado `prisma migrate deploy` (via `DIRECT_URL`) + reaplicar `policies.sql` se houver tabela nova.
4. Domínio cpek.com.br: DNS na Hostinger → Vercel; SSL automático (Let's Encrypt).

---

## 8. Convenções

- TypeScript em tudo; componentes `<script setup>`.
- **Todo acesso a dado de negócio passa por `withTenant(tenantId, …)`.** A instância base do Prisma **não** é usada em `server/api/**` (só bootstrap de auth/migrations) — há lint/teste de arquitetura que bloqueia isso. Ver ARCHITECTURE §4.3.
- Toda rota de servidor: autenticada → `withTenant` → validação zod.
- Dinheiro: `Decimal(14,2)`. Nunca `Float`.
- Cadastros: desativar, não excluir. Período fechado trava edição (409).
- Mudança em campo custom e fechamento de período: confirmação na UI + `AuditLog`.

---

## 9. Pendências antes de codar (ver ARCHITECTURE §19)

- **D1** — 5º card: "Vencidos" (default) vs "A Receber".
- **D6** — permissão: 2 papéis (default) vs ACL por formulário.
- **Usuário em múltiplos tenants:** 1:1 no MVP; N:N só na V2 (§17).
- 2ª empresa: confirmar **Securise** vs **Semijoias** (afeta só o template de seed).
```

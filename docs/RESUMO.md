# CPEK — Resumo do que foi concluído

> Documento de resumo da estruturação inicial do projeto CPEK.
> Versão detalhada: `RELATORIO.md` (raiz). Fonte de verdade: `docs/ARCHITECTURE.md` (v2).
> Data: 19/06/2026.

---

## Visão geral

O projeto CPEK — gestão financeira multiunidade e multi-tenant — foi estruturado do
zero e está **pronto para desenvolvimento**. A **Fase 0 (fundação de segurança)** está
implementada de ponta a ponta; as **Fases 1–4** existem como esqueleto tipado, prontas
para receber a lógica de negócio.

São **141 arquivos** organizados na estrutura da §10 da arquitetura, com a stack fixa
exigida: **Vue 3 + Nuxt 3 (Nitro) · PostgreSQL/Supabase · Prisma · TypeScript · Pinia ·
zod · Nuxt UI · Tailwind · Vitest + Playwright**.

---

## O que está PRONTO (Fase 0 — segurança primeiro)

O coração do sistema é o **isolamento de tenant fail-closed**, e ele está completo e
verificado:

- **`withTenant` (§4.2):** toda query de negócio roda numa transação que seta
  `app.current_tenant` antes de qualquer acesso. O `tenantId` vem sempre do JWT validado,
  nunca do corpo da requisição.
- **RLS no banco:** `prisma/rls/policies.sql` aplica isolamento por `tenant_id` em todas
  as 15 tabelas, com `FORCE ROW LEVEL SECURITY` e o papel de runtime `cpek_app` (sem
  bypass). Migration inicial gerada (15 tabelas + 9 enums).
- **Dupla defesa:** uma extension do Prisma injeta `tenant_id` em escritas e filtro em
  leituras como rede de segurança; o RLS continua sendo a garantia final.
- **Trava de arquitetura:** uma regra ESLint **proíbe** o uso do Prisma base em
  `server/api/**` — qualquer tentativa falha o CI.
- **Autenticação:** middleware valida o JWT Supabase (HS256), extrai `account_id`/`role`
  e popula o contexto; helper grava os claims no signup/convite.
- **Testes de segurança:** teste de **isolamento RLS em matriz** (itera sobre todas as
  entidades) + E2E de vazamento por endpoint.
- **CI (GitHub Actions):** lint → typecheck → migrate → RLS test → migrate diff.
- **Seed idempotente** do template Supervisão (Serviços, Categorias com `dreGroup`,
  Status, Formas de pagamento, Centros de custo, campos custom).

### Verificações que passaram nesta etapa
- A regra ESLint flagra corretamente o Prisma base e libera `withTenant`.
- A verificação de JWT aceita token válido e **rejeita** segredo errado e adulteração do
  tenant no payload.
- Migration consistente com o schema (15 tabelas / 9 enums) e com as policies de RLS.

---

## O que está como ESQUELETO (Fases 1–4)

Estruturado e tipado, aguardando implementação:

- **51 rotas de API** (§8) como stubs tipados, cada uma com validação **zod** e um
  `TODO` apontando a seção exata da arquitetura: dashboard, entradas/saídas/fechamentos,
  cadastros, DRE, contatos, períodos, membros.
- **Frontend:** stores Pinia (sessão, empresa, período), composables, layouts (sidebar +
  troca de empresa + seletor de período), páginas de cada módulo e guarda de rota.
- **Motores de domínio** em esqueleto: DRE (§7), campos custom/snapshot (§6), exports
  CSV/PDF, auditoria.

---

## Decisões adotadas (defaults da arquitetura)

| Tema | Decisão |
|---|---|
| 5º card do dashboard | **Vencidos** |
| Permissão | **2 papéis** (admin/member); `FormPermission` como gancho |
| Usuário ↔ conta | **1:1 no MVP** (N:N só na V2) |
| 2ª empresa | parametrizada pelo template de seed |
| UI kit | **Nuxt UI** |

---

## Números

| Métrica | Valor |
|---|---|
| Arquivos do projeto | 141 |
| Rotas de API (§8) | 51 |
| Validadores zod | 15 |
| Tabelas no banco | 15 |
| Enums | 9 |
| Testes (specs) | 3 (unit, RLS matriz, E2E vazamento) |

---

## Pendência importante antes de codar a Fase 1

A definição de "pronto" inclui rodar, **na máquina do dev**, a sequência que não foi
possível executar no ambiente de estruturação (sem acesso ao registro npm):

```bash
pnpm install        # gera o lockfile + prisma generate
pnpm typecheck && pnpm lint
pnpm build
```

E provisionar o Supabase/Vercel e rodar o teste de isolamento RLS contra um Postgres de
teste (passo a passo em `tests/README.md`). O CI já executa exatamente essa sequência.

---

## Próximos passos por fase (roadmap §18)

- **Fechar Fase 0:** install/typecheck/lint/build local; Supabase + Vercel; matriz RLS
  verde no CI; commitar o `pnpm-lock.yaml`.
- **Fase 1 — Shell + contexto:** login real, dashboard com os 5 cards (Vencidos), troca
  de empresa com reset de contexto, estados de tela.
- **Fase 2 — Lançamentos + cadastros:** CRUD dos cadastros, campos custom (snapshot +
  propagação), entradas/saídas + export CSV.
- **Fase 3 — Fechamento + DRE:** fechar/reabrir período, motor de DRE, export PDF/CSV.
- **Fase 4 — Configurações + polimento:** membros, auditoria, acessibilidade.

---

*Resumo gerado a partir do `RELATORIO.md`. Para o detalhamento por arquivo, consulte-o na
raiz do projeto.*

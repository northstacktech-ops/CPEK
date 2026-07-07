# CPEK — Arquitetura de Engenharia (build-ready) · v2

> Fonte única de verdade para desenvolvimento. Consolida os 5 documentos de discovery + o veredito do Figma (`Projeto 011 | CPEK`).
> **v2:** isolamento de tenant reforçado (regra do cliente Prisma base + teste em matriz) e saída de escala documentada para a V2 — alinhado ao consenso de arquitetura multi-tenant para SaaS de muitos inquilinos pequenos e semelhantes.
> Stack: **Vue 3 + Nuxt 3 (Nitro) · PostgreSQL/Supabase · Prisma · Vercel · TypeScript**.
> Companion files: `prisma/schema.prisma` · `prisma/rls/policies.sql` · `README.md`.

---

## 0. Estado das decisões (pós-Figma)

O Figma resolveu quase todas as ambiguidades. Esta arquitetura assume os vereditos abaixo. As pendências reais têm **default recomendado** para não travar o desenvolvimento.

| Decisão | Veredito | Origem |
|---|---|---|
| Contas bancárias | **No MVP** (cadastro + filtro no DRE + saldo consolidado) | Figma: nó "Contas", "Filtrar por contas" |
| Formato do DRE | **Contábil gerencial** (Receita → Custo Op → Margem → Resultado Op → Investimento/Financiamento), por tipo de serviço, linhas expansíveis | Figma: "Expandir as linhas de Receita, Despesas, Custo Operacional" |
| Realizado x Agendado | **No MVP** (toggle no DRE) | Figma: "Realizado x Realizado e Agendado" |
| Taxas e Juros | **Cadastro no MVP** | Figma: nó "Taxas e Juros" |
| Export | **CSV e PDF**, usuário escolhe | Figma: nota de export |
| Tipos de serviço | **Cautelar, Certicar, Constatação** (seed de categorias) | Figma BMC |
| Fechamento | **Recebimento consolidado de boletos/faturas** | Figma BMC |
| Billing/gateway, venda a terceiros, HQ | **V2** (fora do MVP) | Figma BMC: [V2] |
| Campos custom — edição | Add/remove afeta só dados futuros; **editar definição propaga ao histórico**; confirmação em ambos | Figma: nota de campos personalizados |
| Multi-tenant | **tenant_id + RLS** (decisão firmada) | Figma BMC: "isolamento via RLS" |
| **🔴 5º card do dashboard** | **PENDENTE** — default: **"Vencidos"** | tela mostra "Vencidos"; PRD diz "A Receber" |
| **🔴 Granularidade de permissão** | **PENDENTE** — default: **2 papéis**; `FormPermission` como gancho | PRD = 2 papéis; `.docx` sugere ACL por form |
| **🔴 Usuário em múltiplos tenants** | **PENDENTE (V2)** — MVP é **1 usuário : 1 conta**; N:N só na V2 | ver §17 |
| Segunda empresa | **PENDENTE confirmar** — "Securise" (Figma) vs "Semijoias" (doc v3); afeta só o template de seed | divergência entre fontes |

---

## 1. Contexto do produto

Sistema web de gestão financeira **multiunidade e multi-tenant** para franqueados da rede Supervisão (vistoria cautelar) e operações irmãs. Substitui o FCS (R$ 69/mês). Cliente inicial: Cleber Carvalho Pinto.

Faz quatro coisas:
1. **Lançar** entradas, saídas e fechamentos (boletos) com campos configuráveis por empresa.
2. **Consolidar** num dashboard com cards, contas bancárias e fluxo de caixa.
3. **Fechar** períodos mensais (trava edição) e gerar **DRE contábil** por tipo de serviço.
4. **Exportar** em CSV e PDF.

Nasce multi-tenant para, em **V2**, virar SaaS licenciável às ~200 unidades da rede (onboarding por template + billing).

**Perfil de inquilinos** (define a estratégia de tenancy): muitos inquilinos **pequenos e semelhantes** (franqueados do mesmo modelo de negócio), com baixo volume por tabela. Esse perfil é o caso clássico de **banco único + coluna de tenant**, e não banco-por-tenant — ver §4.

---

## 2. Princípios de arquitetura

1. **Isolamento por tenant é invariante de segurança, com comportamento *fail-closed*.** RLS no banco + tenant guard na aplicação. Sem tenant na sessão, o banco **não retorna nada** (não retorna "tudo"). Nenhuma query de negócio sai sem tenant.
2. **Histórico é imutável.** Snapshot JSON nos lançamentos; desativação em vez de exclusão; período fechado trava edição.
3. **Servidor é a autoridade.** Toda validação e todo cálculo financeiro no Nitro. Frontend nunca é fonte de verdade nem de segurança.
4. **Dinheiro é `Decimal(14,2)`.** Nunca `Float`. Arredondamento explícito no DRE.
5. **MVP enxuto; V2 já comportada pelo modelo.** Billing e onboarding SaaS ficam fora do código agora, mas o schema (Account como raiz) e a resolução centralizada de tenant não mudam para suportá-los.
6. **Não otimizar cedo.** Banco único atende com folga o volume do MVP. As alavancas de escala (particionamento, réplica de leitura, célula por tenant) ficam documentadas para a V2 e só entram quando medidas — ver §16.

---

## 3. Stack e dependências

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | Vue 3 + Nuxt 3 (`<script setup>`) | desktop only (>1200px) |
| API | Nuxt Server Routes (Nitro) | mesmo runtime do front |
| Banco | PostgreSQL (Supabase, AWS) | RLS ativo |
| ORM | Prisma | runtime via pooler; migrations via conexão direta |
| Auth | Supabase Auth (JWT + refresh) | claims `account_id`/`role` em `app_metadata` |
| Validação | **zod** | schemas compartilhados front/back |
| Estado (client) | **Pinia** | empresa ativa, período, sessão |
| UI kit | **Nuxt UI** (default) ou shadcn-vue | sobre Tailwind |
| Estilo | Tailwind CSS · IBM Plex Sans · Material Icons | tokens na §11 |
| Export PDF | **vue-pdf** | DRE e relatórios |
| Export CSV | server-side (streaming) | inclui snapshot + Unidade |
| Testes | **Vitest** + **Playwright** | + teste de isolamento RLS em matriz |
| Deploy | Vercel (+ Preview por PR) | |
| CI/CD | GitHub Actions + Vercel | lint, typecheck, test, migrate |

**Proibições (dos docs):** React, Next.js, Express standalone, Firebase, ORM ≠ Prisma, SQL raw fora do `withTenant` (ver §4.3).

---

## 4. Multi-tenancy + isolamento (núcleo de segurança)

### 4.1 Estratégia e hierarquia

**Banco único + `tenant_id` (= `account.id`) em toda tabela + Row Level Security.** É o padrão indicado para muitos inquilinos pequenos e semelhantes, e o único viável em escala SaaS no Supabase. Banco-por-tenant é descartado para o CPEK (justificativa em §16.4).

```
Account (tenant)               ← raiz de isolamento; tenant_id = account.id
 └── Company (empresa/unidade)  ← Supervisão, Securise...
      └── Period (mês/ano · aberto|fechado)
           └── Entry / Exit / Closing
```

Detalhes do schema: `prisma/schema.prisma`.

### 4.2 Por que Prisma + RLS exige cuidado

Prisma conecta com **um papel** do Postgres e **não envia o JWT do Supabase** ao banco — `auth.jwt()` é nulo numa query Prisma. Por isso as **policies leem o tenant de uma variável de sessão** (`app.current_tenant`), injetada por transação. Dois níveis de defesa:

**Nível 1 — RLS no banco** (`prisma/rls/policies.sql`): cada tabela tem `tenant_isolation` via `app_current_tenant()`. `FORCE ROW LEVEL SECURITY` impede que o owner escape. Runtime no papel **`cpek_app`** (sem `BYPASSRLS`); migrations no papel `postgres`.

**Nível 2 — tenant guard na aplicação:** toda query roda dentro de `withTenant()`, que abre transação e seta o tenant antes de qualquer acesso:

```ts
// server/utils/withTenant.ts
import { prisma } from './prisma'

export function withTenant<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    // is_local = true → escopo da transação; seguro com pooler em transaction mode
    await tx.$executeRaw`select set_config('app.current_tenant', ${tenantId}, true)`
    return fn(tx)
  })
}
```

`tenantId` vem **sempre do JWT validado no servidor** (`app_metadata.account_id`), **nunca** do corpo da requisição.

### 4.3 Regra dura: o cliente Prisma base nunca toca dado de tenant

O furo de vazamento mais comum em multi-tenant de banco único **não** é o RLS — é um trecho de código que **escapa** do filtro: SQL cru, um ORM secundário, ou o cliente base do ORM usado fora do guard. No nosso caso, o único caminho que poderia furar o isolamento é usar a **instância base do Prisma** fora do `withTenant`.

Regras, em ordem de importância:

1. **A instância base `prisma` só serve para:** bootstrap de autenticação (resolver `account_id` a partir do token), criação de conta/usuário no signup e tarefas administrativas explícitas. **Nunca** para ler/escrever dados de negócio (lançamentos, contatos, cadastros, DRE).
2. **Todo acesso a dado de negócio passa por `withTenant(tenantId, tx => …)`.** Dentro dele, até `tx.$queryRaw` está protegido — o RLS aplica porque a variável de sessão está setada. **O perigo é só o que roda fora do `withTenant`.**
3. **Defesa em profundidade na aplicação:** uma Prisma Client Extension injeta `tenant_id` em `create`/`update` e adiciona `where tenant_id` em leituras, como rede de segurança e para erros melhores. RLS continua sendo a garantia final.
4. **Travar por convenção + ferramenta:** lint/regra de arquitetura que proíbe importar a instância base em `server/api/**`; lá só se acessa o banco via `withTenant`. Um teste de arquitetura (ou ESLint custom rule) sinaliza qualquer uso direto.

> Em resumo: o RLS protege mesmo que alguém erre, mas a disciplina do `withTenant` evita que o erro aconteça — e os dois juntos são o que torna o isolamento confiável.

### 4.4 Conexão serverless

```env
# runtime (pooler Supavisor, transaction mode)
DATABASE_URL="postgresql://cpek_app:***@<proj>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# migrations (conexão direta)
DIRECT_URL="postgresql://postgres:***@db.<proj>.supabase.co:5432/postgres"
```

`pgbouncer=true` desliga prepared statements (necessário no pooler). Migrations **nunca** pelo pooler.

### 4.5 Resolução de tenant centralizada (habilita a escala da V2)

A resolução do tenant é **um único ponto**: o middleware valida o JWT, extrai `account_id`, e os handlers chamam `withTenant`. Manter isso centralizado é o que permite, na V2, mover um inquilino "barulhento" para um banco/célula próprio apenas **resolvendo a connection string por tenant**, sem reescrever queries (ver §16).

---

## 5. Modelo de dados

Schema completo e comentado: **`prisma/schema.prisma`**. Entidades:

| Entidade | Papel |
|---|---|
| `Account` | Tenant raiz (a conta do franqueado) |
| `User` | Usuário (`id` = `auth.users.id`), papel admin/member · **1:1 com Account no MVP** (N:N na V2, §17) |
| `FormPermission` | Gancho de ACL por formulário (D6, não usado no MVP) |
| `Company` | Empresa/unidade dentro da conta |
| `BankAccount` | Conta bancária ("Contas") + saldo de abertura |
| `CatalogValue` | Lookup: `PAYMENT_METHOD`, `SERVICE`, `STATUS`, `CATEGORY` (+`dreGroup`) |
| `CostCenter` | Centro de custo (Fixo/Variável) |
| `FeeProfile` | Taxas e Juros (perfil reutilizável) |
| `Contact` | Cliente/Fornecedor (telefone, e-mail, contato, CNPJ/CPF) |
| `CustomField` | Definição de campo custom por empresa+tipo |
| `Period` | Período mensal por empresa (aberto/fechado) |
| `Entry` / `Exit` / `Closing` | Lançamentos; campos fixos + `customSnapshot` |
| `AuditLog` | Log de ações sensíveis |

### 5.1 Decisões de modelagem

- **Núcleo financeiro genérico vs. campos da operação.** Colunas fixas = núcleo financeiro (valor, datas, conta, categoria, contato, centro de custo). Campos da vistoria (Placa, Modelo, Serviço, Deslocamento) entram como **CustomField** da empresa Supervisão — reconcilia o spec FCS com o modal genérico do Figma.
- **`serviceId` × `categoryId`.** `serviceId` (Cautelar/Certicar/Constatação) é a quebra de receita por serviço no DRE; `categoryId` carrega o **`dreGroup`** (linha contábil). Coexistem.
- **`Decimal(14,2)`** em valor; `Decimal(14,4)` em taxa/percentual.
- **UUIDs** em tudo (`@db.Uuid`) — obrigatório em banco único; compatível com `auth.users.id`.
- **`onDelete: Cascade`** desce de `Account`/`Company`; lançamentos e contatos usam **desativação**, não exclusão.

---

## 6. Campos custom — snapshot + regra de edição

Regra do Figma: **add/remove** afeta só lançamentos a partir da modificação; **editar a definição** reflete em toda a série histórica; **confirmação** em ambos.

**Mecânica:**

1. `CustomField` define os campos ativos por empresa + tipo (`kind`). `fieldKey` é estável; `label`/`dataType` são editáveis.
2. No lançamento, o servidor lê os campos ativos, valida obrigatórios e grava `customSnapshot`:

```json
[
  { "fieldKey": "placa", "value": "ABC1D23", "_label": "Placa",     "_type": "TEXT" },
  { "fieldKey": "km",    "value": 42,        "_label": "KM rodado", "_type": "NUMBER" }
]
```

3. **Leitura/relatórios resolvem o rótulo da definição VIVA** (por `fieldKey`); campo **removido** cai no cache `_label`/`_type`. Resultado:
   - Editar label → todo o histórico exibe o novo rótulo. ✓
   - Remover campo → histórico íntegro via cache. ✓
   - Adicionar campo → só lançamentos novos. ✓
   - Atende a regra do Figma **sem reescrita em massa**.
4. Toda alteração de `CustomField` → confirmação na UI + `AuditLog`.

**Por que não colunas dinâmicas/EAV:** `ALTER TABLE` por tenant é inviável em schema compartilhado; EAV explode em joins. JSON dá imutabilidade trivial.

---

## 7. Motor de DRE (contábil, por serviço, realizado×agendado)

### 7.1 Estrutura (Figma)

```
Receita Operacional            Σ dreGroup=OPERATING_REVENUE  (quebra por serviceId)
(−) Custo Operacional          Σ dreGroup=OPERATING_COST
= Margem de Contribuição (R$)  Receita Op − Custo Op
  Margem de Contribuição (%)   Margem ÷ Receita Op
(−) Despesas Operacionais      Σ dreGroup=OPERATING_EXPENSE
(+) Outras Receitas            Σ dreGroup=OTHER_REVENUE
= Resultado Operacional        Margem − Despesas Op + Outras Receitas
(±) Atividades de Investimento Σ dreGroup=INVESTING
(±) Atividades de Financiamento Σ dreGroup=FINANCING
= Variação de Caixa            Resultado Op + Investimento + Financiamento
```

- Eixo temporal: JAN…DEZ + total do ano. Quebra por serviço dentro de Receita Operacional.
- Fechamentos entram pela `categoryId`→`dreGroup`. Filtro por `bankAccountId`. Linhas expansíveis (resumo ↔ detalhe).

### 7.2 Realizado × Agendado

- **Realizado:** liquidação no período — `dataPagamento` (Entry/Exit) ou `dataRecebimento` (Closing) não nula.
- **Agendado:** previsto, por vencimento/competência.
- **Modo "Realizado x Agendado":** as duas séries lado a lado.

### 7.3 Implementação

`server/utils/dre.ts` agrega por `dreGroup`, `serviceId`, mês e modo, preferindo agregação no banco (Prisma `groupBy`/SQL agregado **dentro do `withTenant`**) em vez de carregar linhas. Resultado tipado (`DreReport`) consumido pela tela e pelo export PDF.

---

## 8. Contrato de API (Nitro)

Convenções: todas autenticadas; `companyId` validado contra o tenant; toda mutação em `withTenant`; erros `{ error: { code, message } }`; período fechado → `409 PERIOD_CLOSED`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/me` | Sessão, papel, empresas acessíveis |
| `GET` | `/api/companies` | Empresas do tenant |
| `POST` | `/api/companies` | Criar empresa (admin) → aplica template de seed |
| `GET` | `/api/dashboard?companyId&from&to` | 5 cards + contas + fluxo acumulado |
| `GET` | `/api/bank-accounts?companyId` | Contas + saldo consolidado |
| `GET` | `/api/entries?companyId&periodId&page` | Listar entradas |
| `POST` | `/api/entries` | Criar entrada (valida fixos+custom, grava snapshot) |
| `PATCH` | `/api/entries/:id` | Editar (409 se período fechado) |
| `DELETE` | `/api/entries/:id` | Excluir (409 se fechado; audit) |
| `GET` | `/api/entries/export?…&format=csv` | Export CSV |
| `…` | `/api/exits/*`, `/api/closings/*` | Idêntico, por tipo |
| `GET` | `/api/dre?companyId&year&mode=realizado\|agendado&accounts=` | DRE contábil |
| `GET` | `/api/dre/export?…&format=pdf\|csv` | Export DRE |
| `GET/POST/PATCH` | `/api/contacts/*` | Clientes/fornecedores (desativação) |
| `GET/POST/PATCH/DELETE` | `/api/catalogs/*` | Forma de pagamento, serviço, status, categoria |
| `…` | `/api/cost-centers/*`, `/api/fee-profiles/*` | Centro de custo, taxas/juros |
| `GET/POST/PATCH/DELETE` | `/api/custom-fields/*` | Campos custom (confirmação + audit) |
| `POST` | `/api/periods/:id/close` · `/reopen` | Fechar/reabrir período (admin) → audit |
| `GET/POST/PATCH` | `/api/settings/members/*` | Convites e papéis (admin) |

Validação de payload com **zod** em `server/utils/validators/*`.

---

## 9. Autenticação e sessão

- **Supabase Auth** (e-mail/senha), recuperação por e-mail, sessão expira em **30 dias** de inatividade, redirecionamento por papel.
- No signup/convite (server, `service_role`): gravar `app_metadata = { account_id, role }`. Claims viajam no JWT.
- Middleware (`server/middleware/auth.ts`): valida JWT, extrai `account_id`/`role`, popula o contexto. Handlers usam `withTenant(account_id, …)`.
- **Nunca** confiar em `tenant_id`/`role` do cliente; sempre do token.

---

## 10. Estrutura de pastas

```
cpek/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  ├─ rls/policies.sql
│  └─ seed/                     # templates de franquia (Supervisão, ...)
├─ server/
│  ├─ api/                      # rotas Nitro (§8) — SÓ acessa banco via withTenant
│  ├─ middleware/auth.ts        # valida sessão Supabase, extrai tenant
│  └─ utils/
│     ├─ prisma.ts              # client base (bootstrap/migrations) + extension de tenant guard
│     ├─ withTenant.ts          # transação + set_config (§4.2)
│     ├─ dre.ts                 # motor de DRE (§7)
│     ├─ customFields.ts        # validação + snapshot (§6)
│     ├─ csv.ts / pdf.ts        # exports
│     └─ validators/            # zod schemas por módulo
├─ composables/                 # useAuth, useCompany, usePeriod, useDashboard, useDre...
├─ stores/                      # Pinia: company ativa, período, sessão
├─ components/ · layouts/ · pages/   # ver doc anterior
├─ types/                       # DreReport, DashboardCards...
├─ tests/                       # unit (vitest) + e2e (playwright) + rls-isolation (matriz)
├─ nuxt.config.ts · tailwind.config.ts · .env.local
```

---

## 11. Frontend e design tokens

### 11.1 Tokens (Design Doc + Figma)

```ts
// tailwind.config.ts (trecho)
theme: { extend: {
  colors: {
    brand: { DEFAULT: '#1E3A8A', 50:'#EEF2FF', 600:'#1E3A8A', 700:'#1B3479' }, // Azul Royal — ajustar ao hex exato do Figma
    danger: '#DC2626'
  },
  fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] }
}}
```

> **Ação:** extrair hex/spacing exatos do Figma (a auditoria de design system pode exportar os tokens).

### 11.2 UX e estados de tela

Orientação à tarefa, hierarquia visual (totais sem scroll), consistência (entradas/saídas/fechamentos = mesmo padrão de modal), feedback imediato (toast), tolerância a erro (validação em linha, confirmação em ações destrutivas). Estados obrigatórios: vazio, carregando (skeleton), erro (mensagem + ação), sucesso (toast). Cards vazios mostram `R$ 0,00` — nunca erro/tela branca.

### 11.3 Estado e dados

- **Pinia:** empresa ativa, período, sessão. Trocar empresa **reseta o contexto** (com confirmação).
- **Servidor:** `useFetch`/`$fetch`; revalidar ao mudar empresa/período.

---

## 12. Dashboard — fórmulas

| Card | Cálculo |
|---|---|
| Faturamento Bruto | Σ(`valorServico` + `deslocamento`) das entradas do período |
| Despesas | Σ `valorDespesa` das saídas (vermelho quando negativo) |
| Lucro Real | Faturamento Bruto − Despesas |
| Ticket Médio | Faturamento Bruto ÷ nº de lançamentos de entrada do período |
| **5º card** 🔴 | **Vencidos** (default): Σ lançamentos com vencimento < hoje e não liquidados |
| (painel) Contas | saldo de abertura + entradas − saídas (± fechamentos) liquidados; + **Saldo Consolidado** |
| (gráfico) Fluxo Acumulado | série realizada vs prevista |

Filtros: período (mês/ano), tipo de lançamento, empresa ativa.

---

## 13. Seed / onboarding por template

- `prisma/seed/templates/supervisao.json`: **Serviços** (Cautelar, Certicar, Constatação), **Categorias** com `dreGroup`, **Status**, **Formas de pagamento**, **Centros de custo**.
- Ao criar `Company`, o servidor aplica o template (idempotente). Em V2, o mesmo mecanismo serve ao onboarding de novos franqueados.

---

## 14. Segurança (checklist)

- [ ] RLS habilitado **e forçado** em todas as tabelas; runtime no papel `cpek_app` (sem BYPASSRLS).
- [ ] `withTenant` em 100% dos handlers; tenant sempre do JWT.
- [ ] **Cliente Prisma base proibido em `server/api/**`** (lint/teste de arquitetura) — §4.3.
- [ ] Validação de payload no servidor (zod) em toda rota.
- [ ] HTTPS; segredos só em env da Vercel / `.env.local`; `service_role` só no servidor.
- [ ] `AuditLog` em: fechar/reabrir período, excluir lançamento, alterar campo custom.
- [ ] Período fechado → 409 no servidor.
- [ ] **Teste de isolamento RLS em matriz** verde no CI (gate de merge) — §15.

---

## 15. Testes

| Camada | Ferramenta | Foco |
|---|---|---|
| Unit | Vitest | motor de DRE, snapshot de campos custom, fórmulas do dashboard |
| Integração | Vitest + DB de teste | **isolamento RLS em matriz**, *fail-closed*, bloqueio de período fechado |
| E2E | Playwright | fluxos completos **+ verificação de vazamento por endpoint** |

### 15.1 Isolamento em matriz (não-negociável)

O vazamento mais perigoso costuma estar numa **entidade ou endpoint específico** que um teste pontual não cobre. Por isso o teste **itera sobre todas as entidades de tenant**, não sobre uma só:

```ts
// tests/rls-isolation.spec.ts
const TENANT_MODELS = [
  'company','bankAccount','catalogValue','costCenter','feeProfile',
  'contact','customField','period','entry','exit','closing','auditLog',
] as const

describe('Isolamento RLS (matriz)', () => {
  // seed: tenant A e tenant B, cada um com ≥1 registro em cada model

  it.each(TENANT_MODELS)('tenant A não enxerga %s do tenant B', async (model) => {
    await withTenant(TENANT_A, async (tx) => {
      const rows = await (tx as any)[model].findMany()
      expect(rows.every((r: any) => r.tenantId === TENANT_A || r.id === TENANT_A)).toBe(true)
      // nenhum registro semeado para B aparece
    })
  })

  it.each(TENANT_MODELS)('sem tenant setado, %s retorna vazio (fail-closed)', async (model) => {
    const rows = await (prismaBase as any)[model].findMany() // base client, sem set_config
    expect(rows).toHaveLength(0)
  })
})
```

Complemento E2E: para cada endpoint que retorna dado de tenant, um teste autentica como tenant A e tenta acessar um `id` pertencente a B → espera `404`/vazio. Isso cobre o caso de "rota especial que escapou do filtro".

O gate de CI exige os dois verdes antes de qualquer merge.

---

## 16. Escala e isolamento na V2 (saída de emergência)

Nada aqui é trabalho de MVP — banco único atende com folga. É o **plano** para quando as métricas pedirem, na ordem do mais barato ao mais caro:

### 16.1 Vizinho barulhento
1. **Índices e plano de consulta** primeiro: revisar índices por `tenant_id`/`companyId`/`periodId` (já no schema) e consultas do DRE.
2. **Réplica de leitura** para relatórios pesados (DRE, exports): direcionar leituras analíticas a uma réplica, separando do caminho transacional.
3. **Particionamento por `tenant_id`** nas tabelas mais movimentadas (entry/exit/closing), reduzindo o impacto de um tenant grande sobre os demais.

### 16.2 Célula por tenant (sem reescrever queries)
Quando um inquilino justifica isolamento físico (volume ou compliance), **mover só aquele tenant** para um banco/célula própria. Como a resolução de tenant é centralizada (§4.5), basta **resolver a connection string por tenant** no middleware/`withTenant`; o resto do código não muda. Inquilinos pequenos continuam compartilhando o banco; grandes ganham o seu.

### 16.3 Sinais para acionar
Latência de consultas por tenant, tamanho desproporcional de um tenant (ex.: um inquilino com grande fração das linhas), exigência contratual de residência/cópia de dados. Medir antes de agir.

### 16.4 Por que **não** banco-por-tenant agora
Os defensores dessa abordagem a justificam por **compliance/residência de dados** ou **clientes enterprise gigantes** — requisitos que o CPEK não tem. O custo é alto e conhecido: migrações de esquema multiplicadas por N bancos (lentas, propensas a ficar fora de sincronia), bancos exponencialmente mais caros, sobrecarga operacional. Para muitos inquilinos pequenos e semelhantes, banco único + RLS é a escolha correta — e a célula por tenant (§16.2) cobre o caso raro de quem precisar sair.

---

## 17. Usuário em múltiplos tenants (decisão consciente para a V2)

**MVP:** `User` pertence a **uma** `Account` (`User.tenantId`). Simples e suficiente para o Cleber.

**V2:** se um mesmo login (ex.: um contador atendendo vários franqueados) precisar acessar **vários** tenants, será necessário:
- tabela de associação `Membership` (`User` ↔ `Account`, N:N) com papel por conta;
- **seleção de tenant no login** (ou troca de tenant na sessão);
- o `account_id` ativo passa a vir da seleção (gravado no contexto da sessão), não de um campo fixo do usuário.

Sair de 1:1 para N:N depois **mexe em auth e em todas as queries**, então a decisão de manter 1:1 no MVP é deliberada — registrada aqui para ser revista **antes** de abrir a V2.

---

## 18. Roadmap de desenvolvimento (fases + tickets)

### Fase 0 — Fundação (segurança primeiro)
- [ ] Repo, Nuxt 3, Tailwind+tokens, Pinia, ESLint/Prettier (+ regra que proíbe Prisma base em `server/api`), Vitest/Playwright.
- [ ] Supabase (prod/staging/dev), Vercel, domínio.
- [ ] Prisma: schema base + primeira migration.
- [ ] Papel `cpek_app` + `policies.sql` + `withTenant` + extension de tenant guard.
- [ ] **Teste de isolamento RLS em matriz + E2E de vazamento por endpoint** (gate de CI).
- [ ] Supabase Auth + claims `account_id/role` + middleware.
- **DoD:** dois tenants no banco; matriz prova que um não lê o outro em nenhuma entidade nem endpoint; login funciona.

### Fase 1 — Shell + contexto
- [ ] Layout (sidebar, company switcher, period selector), papéis, troca de empresa com reset de contexto.
- [ ] Dashboard com cards (mock → real) e estados de tela.
- **DoD:** navegar autenticado; trocar empresa muda todo o contexto.

### Fase 2 — Lançamentos + cadastros
- [ ] Cadastros: categorias (+`dreGroup`), serviços, status, formas de pagamento, centros de custo, taxas/juros, contas, contatos.
- [ ] Campos custom (CRUD + confirmação + snapshot + regra de edição).
- [ ] Entradas e Saídas (CRUD, validação por etapa, volta a formulário em branco), export CSV.
- [ ] Template de seed Supervisão na criação de empresa.
- **DoD:** lançar reflete no dashboard; remover campo custom não quebra histórico; editar label propaga.

### Fase 3 — Fechamento + DRE
- [ ] Fechamento (boletos) + fechar/reabrir período (trava + audit).
- [ ] Motor de DRE contábil (por serviço, realizado×agendado, filtro por contas, linhas expansíveis).
- [ ] Export PDF (vue-pdf) e CSV do DRE.
- **DoD:** DRE bate com lançamentos; período fechado bloqueia edição; export nos dois formatos.

### Fase 4 — Configurações + polimento
- [ ] Conta, empresas, auditoria. (Membros removido do escopo — acesso único por conta, decisão 2026-07-06.)
- [ ] Estados de erro/loading/vazio em todas as telas; acessibilidade.
- **DoD:** MVP completo, navegável, auditado.

### Fase 5 — SaaS (V2, fora do MVP)
- Painel de administração, onboarding por template, billing (Stripe/Asaas), **Membership N:N (§17)**, e — se necessário — alavancas de escala da §16.

---

## 19. Decisões pendentes (com default para não travar)

| # | Pergunta | Default adotado | Quando confirmar |
|---|---|---|---|
| D1 | 5º card: "Vencidos" e/ou "A Receber"? | **Vencidos** no card | antes da Fase 1 |
| D6 | Permissão: 2 papéis ou ACL por formulário? | **2 papéis**; `FormPermission` de gancho | antes da Fase 4 |
| — | Usuário em múltiplos tenants? | **1:1 no MVP**; N:N só na V2 (§17) | antes de abrir a V2 |
| — | 2ª empresa: Securise ou Semijoias? | não bloqueia schema; afeta só o seed | antes da Fase 2 |
| — | UI kit: Nuxt UI ou shadcn-vue? | **Nuxt UI** | Fase 0 |
| — | Reabrir período: quem e quando? | admin, com audit | Fase 3 |
| — | Recorrência de lançamentos no MVP? | **fora do MVP** (gancho futuro) | Fase 2 |

---

## 20. Glossário

| Termo | Significado |
|---|---|
| Tenant / Account | Conta do franqueado — raiz do isolamento |
| Company | Empresa/unidade dentro da conta |
| Period | Mês de uma empresa (aberto/fechado) |
| Fechamento | Recebimento consolidado de boletos/faturas (≠ "fechar período") |
| DRE | Demonstrativo contábil gerencial por período |
| dreGroup | Linha contábil à qual uma categoria pertence |
| Snapshot JSON | Cópia imutável dos campos custom no lançamento |
| Realizado / Agendado / Vencidos | Liquidado no período / previsto / previsto vencido e não liquidado |
| RLS | Row Level Security — isolamento no Postgres |
| `cpek_app` | Papel de runtime do Prisma, submetido ao RLS |
| Célula | Banco/instância que hospeda um subconjunto de tenants (estratégia de escala V2) |
| Membership | Associação N:N usuário↔conta (V2) |

---

*Documento-mestre de arquitetura · v2. Companion: `prisma/schema.prisma`, `prisma/rls/policies.sql`, `README.md`. Atualizar ao fechar D1 e D6.*

# CPEK — Discovery de Produto (padrão Fraktal)

> Arquitetura de telas e requisitos por módulo, no padrão Fraktal (ambiente →
> módulos → telas → funcionalidades por elemento nomeado, com critérios de
> aceite, notificações, anotações e fluxo). **Fonte de verdade:** `docs/ARCHITECTURE.md` (v2).
> Nada aqui foi inventado: cada funcionalidade deriva da arquitetura/Figma já validados.

- **Cliente / projeto:** Cleber Carvalho Pinto · CPEK (gestão financeira multiunidade)
- **Ambiente único:** App Web · **Modalidade: Web desktop only (> 1200 px)**
- **Stack:** Vue 3 + Nuxt 3 (Nitro) · Supabase/PostgreSQL · Prisma · Tailwind/Nuxt UI
- **Numeração:** global e contínua por módulo (não reinicia)
- **Horas:** estimadas por tela (faixas do padrão Fraktal). **Horas contratadas: a confirmar** ⚠️

---

## 1. Camada estratégica

### 1.1 Descrição do produto
Sistema web de gestão financeira multiunidade e multi-tenant para franqueados da
rede Supervisão (vistoria cautelar) e operações irmãs. Centraliza lançamentos
(entradas, saídas e fechamentos de boletos), consolida um dashboard com cards e
contas bancárias, fecha períodos mensais e gera um DRE contábil gerencial por tipo
de serviço, com export em CSV e PDF. Substitui o FCS (R$ 69/mês). Nasce multi-tenant
para, na V2, virar SaaS licenciável às ~200 unidades da rede.

### 1.2 Desafio central + definição de sucesso
- **Desafio:** dar ao franqueado controle financeiro real (fluxo, margem por serviço,
  inadimplência) sem planilha e sem a rigidez do FCS, com isolamento total entre contas.
- **Sucesso:** lançamento reflete no dashboard em tempo real; DRE bate com os
  lançamentos; período fechado trava edição; nenhum tenant enxerga dados de outro.

### 1.3 Business Model Canvas (condensado)
- **Segmentos:** franqueados Supervisão (MVP); rede com ~200 unidades **[V2]**.
- **Proposta de valor:** gestão financeira por serviço + DRE gerencial + multiempresa.
- **Canais:** app web direto (MVP); onboarding por template **[V2]**.
- **Receita:** substituição do FCS (MVP); licenciamento SaaS + billing **[V2]**.
- **Recursos-chave:** Supabase (RLS), template de franquia (seed).
- **Atividades-chave:** lançar, consolidar, fechar, exportar.

### 1.4 Personas
- **Cleber (franqueado/admin), ~45, proficiência 3/5.** Dia a dia: lança serviços,
  confere caixa, cobra boletos, fecha o mês. Hoje usa FCS + planilha. Objetivo: ver
  margem por serviço e inadimplência. Dor: retrabalho e falta de DRE gerencial.
- **Operador (member), ~30, proficiência 3/5.** Lança entradas/saídas do dia. Objetivo:
  lançar rápido com campos da operação (placa, modelo). Dor: formulário lento/genérico.

---

## 2. Seção A — Escopo e volumetria

**Ambiente: App Web (Gestão Financeira) · Web desktop**

| # | Módulo | Descrição | Modalidade | Horas Discovery | Horas UI | Total |
|---|---|---|---|---|---|---|
| 1 | Autenticação | Login, recuperação e redefinição de senha | Web | 0.5h | 1h | 1.5h |
| 2 | Dashboard | 5 cards, contas + saldo consolidado, fluxo acumulado | Web | 5h | 8h | 13h |
| 3 | Lançamentos | Entradas, Saídas, Fechamentos (lista + modal + export) | Web | 6h | 9h | 15h |
| 4 | DRE | DRE contábil por serviço, realizado×agendado, export | Web | 4h | 6h | 10h |
| 5 | Cadastros | Catálogos, centros de custo, taxas, contas, campos custom | Web | 5h | 7h | 12h |
| 6 | Contatos | Clientes e fornecedores | Web | 1h | 2h | 3h |
| 7 | Fechamento de período | Abrir, fechar e reabrir período (trava + auditoria) | Web | 1.5h | 2h | 3.5h |
| 8 | Configurações | Conta, empresas, membros, auditoria | Web | 3h | 4h | 7h |
| — | Shell / contexto | Sidebar, troca de empresa, seletor de período | Web | 1.5h | 2.5h | 4h |
| | **Total previsto** | | | **27.5h** | **41.5h** | **69h** |

> ⚠️ **Risco de estouro:** comparar com as horas contratadas (a confirmar). Caso o
> contratado seja inferior a ~69h, repriorizar (ex.: adiar Auditoria e Membros para um round posterior).

### 2.1 Decisões pendentes que afetam telas (ver ARCHITECTURE §19)
- **D1 — 5º card do dashboard:** default **"Vencidos"** (confirmar vs "A Receber").
- **D6 — permissão:** **2 papéis** (admin/member); ACL por formulário fica como gancho.
- **2ª empresa:** Securise vs Semijoias — afeta só o template de seed, não as telas.
- **Fora do MVP [V2]:** billing/gateway, venda a terceiros, HQ, usuário em múltiplos tenants.

---

## 3. Seção B — Planejamento de rounds (sugerido)

| Round | Pautas | Status |
|---|---|---|
| R1 | Shell + Autenticação + Dashboard (cards mock → real) | Pendente |
| R2 | Cadastros (catálogos, centros, taxas, contas, campos custom) | Pendente |
| R3 | Lançamentos (entradas/saídas/fechamentos) + Contatos | Pendente |
| R4 | Fechamento de período + DRE (realizado×agendado, export) | Pendente |
| R5 | Configurações (conta, empresas, membros, auditoria) + revisão | Pendente |

---

# Seção B — Mapeamento de módulos e funcionalidades

---

## MÓDULO 1 — AUTENTICAÇÃO — App Web — (0.5h Discovery / 1h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Usuário faz login com e-mail e senha válidos e é direcionado pelo papel
  Credenciais inválidas exibem mensagem genérica sem revelar qual campo está errado ¹
  Recuperação envia e-mail com link válido por tempo limitado
  Sessão expira após 30 dias de inatividade ²
  Tenant e papel vêm sempre do token validado no servidor, nunca do cliente ³

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  E-mail com link de recuperação ao solicitar (para o próprio usuário)
  E-mail de confirmação após redefinição concluída

### Telas

**[1] Login (0.5h)**
Título: "CPEK"
Campo: "E-mail"
Campo: "Senha"
Botão "Entrar"
Link "Esqueci minha senha" → 1.1
Mensagem de erro genérica para credenciais inválidas ¹
Estado de carregamento no botão durante autenticação

**[1.1] Recuperar senha — solicitar (0.25h)**
Título: "Recuperar acesso"
Campo: "E-mail"
Botão "Enviar link de recuperação"
Mensagem de confirmação genérica (não revela se o e-mail existe) ⁴
Link "Voltar ao login" → 1

**[1.1.1] Redefinir senha (0.25h)**
Título: "Definir nova senha"
Campo: "Nova senha"
Campo: "Confirmar nova senha"
Validação de força e de igualdade entre os campos
Botão "Salvar nova senha"
Mensagem de sucesso e redirecionamento ao login → 1

### Anotações p/ UI e dev
¹ Mensagem única para usuário/senha inválidos: não revelar qual campo está errado
² Sessão Supabase expira em 30 dias de inatividade (refresh token)
³ Claims account_id/role vivem em app_metadata; o middleware valida o JWT no servidor
⁴ Mesma mensagem mesmo quando o e-mail não está cadastrado (não revelar existência)

### Fluxo visual
[1] → [1.1] → [1.1.1]

---

## MÓDULO 2 — DASHBOARD — App Web — (5h Discovery / 8h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Os 5 cards calculam corretamente para a empresa e período ativos
  Cards sem dados exibem R$ 0,00, nunca erro ou tela branca ¹
  Painel de contas mostra saldo por conta e o Saldo Consolidado
  Gráfico de fluxo acumulado mostra série realizada vs prevista
  Trocar empresa ou período revalida todos os números

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação enviada (tela de consulta)
  Feedback visual imediato (skeleton ao carregar, toast em erro de carga)

### Telas

**[2] Dashboard (5h)**
Título: "Dashboard"
Barra de filtros
  Filtro de período (mês / ano)
  Filtro por tipo de lançamento
  Empresa ativa (herdada do shell, somente leitura aqui) → Shell
Cards de destaque
  Card "Faturamento Bruto" (soma de valor de serviço mais deslocamento das entradas) ²
  Card "Despesas" (soma das saídas, em vermelho quando negativo) ³
  Card "Lucro Real" (Faturamento Bruto menos Despesas)
  Card "Ticket Médio" (Faturamento Bruto dividido pelo nº de entradas)
  Card "Vencidos" (soma de lançamentos vencidos e não liquidados) ⁴
Painel de contas bancárias
  Linha por conta com saldo atual
  Indicador "Saldo Consolidado"
Gráfico de fluxo acumulado
  Série realizada
  Série prevista
Estados de tela
  Skeleton ao carregar
  Estado vazio com R$ 0,00 ¹
  Estado de erro com mensagem e ação de tentar novamente

### Anotações p/ UI e dev
¹ Card vazio mostra R$ 0,00; nunca tela branca ou erro silencioso
² Faturamento Bruto = Σ(valorServico + deslocamento) das entradas do período
³ Despesas = Σ valorDespesa das saídas; aplicar cor de alerta quando negativo
⁴ 5º card é "Vencidos" por padrão (D1, ARCHITECTURE §19): vencimento < hoje e não liquidado. Confirmar se vira "A Receber"

### Fluxo visual
[Shell] → [2]

---

## MÓDULO 3 — LANÇAMENTOS — App Web — (6h Discovery / 9h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Lançar entrada, saída ou fechamento reflete imediatamente no dashboard
  Validação acontece no servidor (zod) além do front; obrigatórios bloqueiam o salvar ¹
  Campos personalizados ativos aparecem no formulário e são gravados como snapshot ²
  Remover um campo personalizado não quebra o histórico já lançado ²
  Editar lançamento de período fechado é bloqueado com aviso (409) ³
  Após salvar, o formulário volta em branco para novo lançamento ⁴
  Export gera CSV com o snapshot resolvido e a coluna Unidade

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação externa; toast de sucesso/erro na própria tela
  Exclusão de lançamento registra no log de auditoria ⁵

### Telas

**[3a] Entradas (lista) (1.5h)**
Título: "Entradas"
Abas de navegação
  Aba "Entradas" (ativa por padrão)
  Aba "Saídas" → 3b
  Aba "Fechamentos" → 3c
Botão "Nova entrada" → 3.1
Barra de filtros
  Campo de busca
  Filtro por período (herda do shell)
  Filtro por status
Tabela de entradas
  Coluna: Data do serviço
  Coluna: Cliente
  Coluna: Serviço (Cautelar / Certicar / Constatação)
  Coluna: Valor do serviço
  Coluna: Deslocamento
  Coluna: Status com badge colorido
  Coluna: Ações (editar → 3.1 / excluir → 3.4)
Paginação da tabela
Botão "Exportar CSV"
Estado vazio quando não há entradas no período

**[3b] Saídas (lista) (1h)**
Título: "Saídas"
Abas de navegação (mesma régua de 3a)
Botão "Nova saída" → 3.2
Barra de filtros (busca, período, centro de custo, status)
Tabela de saídas
  Coluna: Data de lançamento
  Coluna: Fornecedor
  Coluna: Categoria
  Coluna: Centro de custo
  Coluna: Valor da despesa
  Coluna: Vencimento
  Coluna: Status com badge colorido
  Coluna: Ações (editar → 3.2 / excluir → 3.4)
Botão "Exportar CSV"
Estado vazio quando não há saídas no período

**[3c] Fechamentos (lista) (1h)**
Título: "Fechamentos"
Abas de navegação (mesma régua de 3a)
Botão "Novo fechamento" → 3.3
Tabela de fechamentos
  Coluna: Cliente
  Coluna: Valor do fechamento
  Coluna: Vencimento previsto
  Coluna: Data de recebimento (quando recebido)
  Coluna: Status com badge colorido
  Coluna: Ações (editar → 3.3 / excluir → 3.4)
Botão "Exportar CSV"
Estado vazio quando não há fechamentos no período

**[3.1] Modal de lançamento — Entrada (1.5h)**
Título: "Nova entrada" ou "Editar entrada"
Seção "Dados do serviço"
  Seletor de cliente (busca em Contatos) → 6
  Seletor de serviço (Cautelar / Certicar / Constatação)
  Campo: "Valor do serviço"
  Campo: "Deslocamento"
  Seletor de conta bancária
  Seletor de forma de pagamento
  Seletor de status
  Seletor de taxa/juros (perfil reutilizável)
  Campo de data do serviço
  Campo de data de pagamento (quando liquidado, marca como realizado) ⁶
  Campo: "Documento / NF"
Seção "Campos personalizados" (dinâmica por empresa) ²
  Campo conforme definição ativa (ex: Placa, Modelo, RENAVAM)
Campo de anotações (textarea)
Bloqueio de edição quando o período está fechado ³
Botões de ação
  Botão "Salvar"
  Botão "Salvar e novo" ⁴
  Link "Cancelar"

**[3.2] Modal de lançamento — Saída (1h)**
Título: "Nova saída" ou "Editar saída"
Seção "Dados da despesa"
  Seletor de fornecedor (busca em Contatos) → 6
  Seletor de categoria (com dreGroup associado) ⁷
  Seletor de centro de custo (Fixo / Variável)
  Campo: "Valor da despesa"
  Seletor de conta bancária
  Seletor de forma de pagamento
  Campo de data de lançamento
  Campo de data de vencimento
  Campo de data de pagamento (quando liquidado, marca como realizado) ⁶
  Campo: "Documento / NF"
Seção "Campos personalizados" (dinâmica) ²
Campo de descrição (textarea)
Bloqueio quando período fechado ³
Botões de ação (Salvar / Salvar e novo / Cancelar)

**[3.3] Modal de lançamento — Fechamento (1h)**
Título: "Novo fechamento" ou "Editar fechamento"
Seção "Recebimento consolidado" ⁸
  Seletor de cliente → 6
  Seletor de categoria
  Campo: "Valor do fechamento"
  Seletor de conta bancária
  Seletor de status
  Campo de data do fechamento
  Campo de data de vencimento previsto
  Campo de data de recebimento (quando recebido, marca como realizado) ⁶
  Campo: "Documento / NF"
Seção "Campos personalizados" (dinâmica) ²
Bloqueio quando período fechado ³
Botões de ação (Salvar / Salvar e novo / Cancelar)

**[3.4] Confirmação de exclusão (0.25h)**
Título: "Excluir lançamento"
Texto de confirmação com identificação do lançamento
Aviso de bloqueio quando o período está fechado (409) ³
Botão "Excluir" (registra auditoria) ⁵
Link "Cancelar"

### Anotações p/ UI e dev
¹ Validação no servidor com zod além do front: obrigatórios e tipos por campo
² Campos personalizados: definição viva resolvida na leitura; lançamento grava snapshot JSON imutável (fieldKey + valor + cache de label/tipo). Remover campo não apaga histórico; editar label propaga
³ Período fechado trava criação/edição/exclusão: servidor responde 409 PERIOD_CLOSED
⁴ "Salvar e novo" reabre o formulário em branco mantendo o contexto (empresa/período)
⁵ Exclusão grava AuditLog (ação, entidade, autor, data)
⁶ Data de liquidação não nula = "realizado"; vazia = "agendado" (entra no DRE conforme o modo)
⁷ categoria carrega o dreGroup, que define a linha do DRE
⁸ Fechamento = recebimento consolidado de boletos/faturas (diferente de "fechar período")

### Fluxo visual
[3a] → [3.1] → [3.4]
[3a] → [3b] → [3.2] → [3.4]
[3b] → [3c] → [3.3] → [3.4]

---

## MÓDULO 4 — DRE — App Web — (4h Discovery / 6h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  O DRE bate com os lançamentos do período
  Estrutura contábil correta: Receita Op, Custo Op, Margem, Resultado Op, Variação de Caixa ¹
  Receita Operacional abre por tipo de serviço (Cautelar / Certicar / Constatação)
  Alternar Realizado x Agendado recalcula as séries ²
  Filtro por contas bancárias afeta os números
  Linhas expansíveis abrem do resumo para o detalhe
  Export gera PDF e CSV com os mesmos números da tela

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação; export disponibiliza arquivo para download

### Telas

**[4] DRE (4h)**
Título: "DRE"
Barra de controles
  Seletor de ano (eixo JAN a DEZ mais total do ano)
  Toggle "Realizado x Agendado" ²
  Filtro por contas bancárias (múltipla escolha) ³
  Empresa ativa (herdada do shell) → Shell
Tabela do DRE (linhas contábeis) ¹
  Linha "Receita Operacional" (expansível por serviço)
    Sub-linha por serviço: Cautelar / Certicar / Constatação
  Linha "(menos) Custo Operacional" (expansível por categoria)
  Linha "= Margem de Contribuição (R$)"
  Linha "Margem de Contribuição (%)"
  Linha "(menos) Despesas Operacionais" (expansível)
  Linha "(mais) Outras Receitas"
  Linha "= Resultado Operacional"
  Linha "(mais ou menos) Atividades de Investimento"
  Linha "(mais ou menos) Atividades de Financiamento"
  Linha "= Variação de Caixa"
Colunas de meses (JAN a DEZ) mais coluna Total do ano
Controles de expandir/recolher linhas
Botão "Exportar" → 4.1
Estados de tela (skeleton ao carregar, vazio com zeros, erro com ação)

**[4.1] Exportar DRE (0.5h)**
Título: "Exportar DRE"
Seletor de formato
  Opção "PDF"
  Opção "CSV"
Botão "Gerar arquivo"
Indicador de progresso durante a geração
Link "Cancelar"

### Anotações p/ UI e dev
¹ Estrutura: Receita Op (Σ dreGroup OPERATING_REVENUE, quebra por serviceId) menos Custo Op (OPERATING_COST) = Margem; menos Despesas Op (OPERATING_EXPENSE) mais Outras Receitas (OTHER_REVENUE) = Resultado Op; mais Investimento (INVESTING) e Financiamento (FINANCING) = Variação de Caixa. Arredondamento explícito
² Realizado = liquidação no período (data de pagamento/recebimento não nula); Agendado = previsto por vencimento/competência; modo "Realizado x Agendado" mostra as duas séries
³ Filtro por bankAccountId; fechamentos entram pela categoria → dreGroup
⁴ Agregação no banco (groupBy/SQL dentro do withTenant), não carregando linha a linha

### Fluxo visual
[Shell] → [4] → [4.1]

---

## MÓDULO 5 — CADASTROS — App Web — (5h Discovery / 7h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Admin cria, edita e desativa itens de cada cadastro
  Cadastros desativam, nunca excluem fisicamente (preservar histórico) ¹
  Categoria exige um grupo de DRE (dreGroup) ²
  Campo personalizado novo afeta só lançamentos futuros; editar a definição propaga ao histórico ³
  Toda alteração de campo personalizado pede confirmação e registra auditoria ³
  Valores monetários usam Decimal(14,2) e taxas Decimal(14,4) ⁴

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação externa; toast de sucesso/erro
  Alteração e remoção de campo personalizado registram auditoria ³

### Telas

**[5] Cadastros (hub) (0.5h)**
Título: "Cadastros"
Lista de atalhos para cada cadastro
  Atalho "Categorias" → 5.1
  Atalho "Serviços" → 5.2
  Atalho "Status" → 5.3
  Atalho "Formas de pagamento" → 5.4
  Atalho "Centros de custo" → 5.5
  Atalho "Taxas e juros" → 5.6
  Atalho "Contas bancárias" → 5.7
  Atalho "Campos personalizados" → 5.8

**[5.1] Categorias (1h)**
Título: "Categorias"
Botão "Nova categoria" → 5.1.1
Tabela de categorias
  Coluna: Nome
  Coluna: Grupo de DRE (dreGroup) ²
  Coluna: Ordem
  Coluna: Status (ativo / inativo)
  Coluna: Ações (editar → 5.1.1 / ativar ou desativar ¹)
Estado vazio quando não há categorias

**[5.1.1] Modal de categoria (0.5h)**
Título: "Nova categoria" ou "Editar categoria"
Campo: "Nome"
Seletor de grupo de DRE (Receita Op / Custo Op / Despesa Op / Outras Receitas / Investimento / Financiamento) ²
Campo de ordem de exibição
Botão "Salvar"
Link "Cancelar"

**[5.2] Serviços (0.5h)**
Título: "Serviços"
Botão "Novo serviço"
Tabela de serviços (Cautelar / Certicar / Constatação por padrão)
  Coluna: Nome
  Coluna: Ordem
  Coluna: Status
  Coluna: Ações (editar / ativar ou desativar ¹)
Modal de serviço (Nome, ordem, salvar / cancelar)

**[5.3] Status (0.5h)**
Título: "Status do lançamento"
Botão "Novo status"
Tabela de status (Em Aberto / Pago / Vencido / Cancelado por padrão)
  Coluna: Nome / Ordem / Status / Ações (editar / ativar ou desativar ¹)
Modal de status (Nome, ordem, salvar / cancelar)

**[5.4] Formas de pagamento (0.5h)**
Título: "Formas de pagamento"
Botão "Nova forma de pagamento"
Tabela (Dinheiro / PIX / Cartões / Boleto / Transferência por padrão)
  Coluna: Nome / Ordem / Status / Ações (editar / ativar ou desativar ¹)
Modal de forma de pagamento (Nome, ordem, salvar / cancelar)

**[5.5] Centros de custo (0.5h)**
Título: "Centros de custo"
Botão "Novo centro de custo"
Tabela de centros de custo
  Coluna: Nome
  Coluna: Tipo (Fixo / Variável)
  Coluna: Status
  Coluna: Ações (editar / ativar ou desativar ¹)
Modal de centro de custo (Nome, tipo Fixo/Variável, salvar / cancelar)

**[5.6] Taxas e juros (0.75h)**
Título: "Taxas e juros"
Botão "Novo perfil de taxa"
Tabela de perfis
  Coluna: Nome
  Coluna: Tipo (Percentual / Fixo)
  Coluna: Valor ⁴
  Coluna: Status
  Coluna: Ações (editar / ativar ou desativar ¹)
Modal de taxa (Nome, tipo, valor Decimal(14,4), salvar / cancelar) ⁴

**[5.7] Contas bancárias (1h)**
Título: "Contas bancárias"
Botão "Nova conta"
Indicador de Saldo Consolidado das contas
Tabela de contas
  Coluna: Nome (ex: Boleto Itaú, Caixa Loja)
  Coluna: Saldo de abertura ⁴
  Coluna: Saldo atual
  Coluna: Status
  Coluna: Ações (editar / ativar ou desativar ¹)
Modal de conta (Nome, saldo de abertura, salvar / cancelar)

**[5.8] Campos personalizados (1.25h)**
Título: "Campos personalizados"
Seletor de formulário alvo (Entradas / Saídas / Fechamentos)
Botão "Novo campo" → 5.8.1
Tabela de campos
  Coluna: Rótulo
  Coluna: Chave (fieldKey, estável) ³
  Coluna: Tipo (Texto / Número / Moeda / Data / Seleção)
  Coluna: Obrigatório
  Coluna: Ordem
  Coluna: Ações (editar → 5.8.1 / remover com confirmação ³)
Estado vazio quando não há campos no formulário escolhido

**[5.8.1] Modal de campo personalizado (0.5h)**
Título: "Novo campo" ou "Editar campo"
Campo: "Rótulo"
Campo: "Chave" (somente leitura ao editar) ³
Seletor de tipo (Texto / Número / Moeda / Data / Seleção)
Lista de opções (quando tipo Seleção)
Toggle "Obrigatório"
Campo de ordem
Aviso de propagação ao histórico ao editar a definição ³
Caixa de confirmação obrigatória
Botão "Salvar"
Link "Cancelar"

### Anotações p/ UI e dev
¹ Desativar oculta o item de novas seleções sem apagar; não há exclusão física de cadastro
² Apenas Categoria carrega dreGroup; é o que define a linha do DRE
³ fieldKey é estável; rótulo/tipo são editáveis e a edição reflete em todo o histórico (resolvido na leitura). Remover campo mantém o histórico via cache do snapshot. Toda mudança pede confirmação e gera AuditLog
⁴ Dinheiro = Decimal(14,2); taxa/percentual = Decimal(14,4); nunca Float

### Fluxo visual
[5] → [5.1] → [5.1.1]
[5] → [5.2] / [5.3] / [5.4] / [5.5] / [5.6] / [5.7]
[5] → [5.8] → [5.8.1]

---

## MÓDULO 6 — CONTATOS — App Web — (1h Discovery / 2h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Admin/operador cria e edita clientes e fornecedores
  Contatos desativam, nunca excluem ¹
  Contato fica disponível para seleção nos lançamentos → 3.1 / 3.2 / 3.3

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação; toast de sucesso/erro

### Telas

**[6] Contatos (1h)**
Título: "Contatos"
Botão "Novo contato" → 6.1
Barra de filtros
  Campo de busca por nome
  Filtro por tipo (Cliente / Fornecedor)
Tabela de contatos
  Coluna: Nome
  Coluna: Tipo (Cliente / Fornecedor)
  Coluna: Telefone
  Coluna: E-mail
  Coluna: CNPJ / CPF
  Coluna: Status
  Coluna: Ações (editar → 6.1 / ativar ou desativar ¹)
Estado vazio quando não há contatos

**[6.1] Modal de contato (1h)**
Título: "Novo contato" ou "Editar contato"
Seletor de tipo (Cliente / Fornecedor)
Campo: "Nome"
Campo: "Pessoa de contato"
Campo: "Telefone"
Campo: "E-mail"
Campo: "CNPJ / CPF"
Campo: "Endereço"
Campo de observações (textarea)
Botão "Salvar"
Link "Cancelar"

### Anotações p/ UI e dev
¹ Desativar preserva o vínculo com lançamentos antigos; não há exclusão física

### Fluxo visual
[6] → [6.1]

---

## MÓDULO 7 — FECHAMENTO DE PERÍODO — App Web — (1.5h Discovery / 2h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Admin abre, fecha e reabre períodos por empresa
  Período fechado bloqueia criação/edição/exclusão de lançamentos (409) ¹
  Fechar e reabrir registram auditoria com autor e data ²
  Reabertura é restrita a admin ³

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  Nenhuma notificação externa
  Fechar/reabrir período registra auditoria ²

### Telas

**[7] Períodos (1h)**
Título: "Períodos"
Botão "Abrir período"
Tabela de períodos da empresa
  Coluna: Mês / Ano
  Coluna: Status (Aberto / Fechado) com badge
  Coluna: Fechado por
  Coluna: Data de fechamento
  Coluna: Ações (fechar → 7.1 / reabrir → 7.2, quando admin ³)
Estado vazio quando não há períodos

**[7.1] Confirmar fechamento (0.5h)**
Título: "Fechar período"
Texto de confirmação com mês/ano e aviso de trava de edição ¹
Caixa de confirmação obrigatória
Botão "Fechar período" (registra auditoria) ²
Link "Cancelar"

**[7.2] Confirmar reabertura (0.5h)**
Título: "Reabrir período"
Texto de confirmação com mês/ano
Caixa de confirmação obrigatória
Botão "Reabrir período" (admin, registra auditoria) ²³
Link "Cancelar"

### Anotações p/ UI e dev
¹ Período fechado: servidor responde 409 PERIOD_CLOSED em qualquer mutação de lançamento
² AuditLog registra PERIOD_CLOSE e PERIOD_REOPEN (autor, data, meta)
³ Reabrir período é ação de admin; confirmar política exata (quem e quando) com o cliente

### Fluxo visual
[Shell] → [7] → [7.1]
[7] → [7.2]

---

## MÓDULO 8 — CONFIGURAÇÕES — App Web — (3h Discovery / 4h UI)

### Critérios de aceite
O que o módulo precisa fazer para ser considerado operante?
  Admin edita dados da conta e gerencia empresas
  Criar empresa aplica o template de franquia automaticamente ¹
  Admin convida membros e define papel (admin / member) ²
  Convite grava os claims de tenant/papel no usuário ²
  Log de auditoria lista ações sensíveis com autor, data e detalhe ³

### Notificações
Quais ações desse módulo geram notificações, e para quem?
  E-mail de convite ao novo membro (com acesso à conta)
  Ações sensíveis registram auditoria ³

### Telas

**[8] Configurações (hub) (0.5h)**
Título: "Configurações"
Lista de atalhos
  Atalho "Conta" → 8.1
  Atalho "Empresas" → 8.2
  Atalho "Membros" → 8.3
  Atalho "Auditoria" → 8.4

**[8.1] Conta (0.5h)**
Título: "Conta"
Campo: "Nome da conta"
Dados de plano/uso (somente leitura no MVP)
Botão "Salvar"

**[8.2] Empresas (0.75h)**
Título: "Empresas"
Botão "Nova empresa" → 8.2.1
Tabela de empresas
  Coluna: Nome
  Coluna: Segmento
  Coluna: Status
  Coluna: Ações (editar / ativar ou desativar)
Estado vazio quando há só uma empresa

**[8.2.1] Nova empresa (0.5h)**
Título: "Nova empresa"
Campo: "Nome"
Campo: "Segmento"
Seletor de template de franquia (ex: Supervisão) ¹
Aviso de que o template cria catálogos, centros de custo e campos padrão
Botão "Criar empresa"
Link "Cancelar"

**[8.3] Membros (0.75h)**
Título: "Membros"
Botão "Convidar membro" → 8.3.1
Tabela de membros
  Coluna: Nome
  Coluna: E-mail
  Coluna: Papel (Admin / Member) ²
  Coluna: Status (ativo / inativo)
  Coluna: Ações (alterar papel / ativar ou desativar)
Estado vazio quando há só o admin

**[8.3.1] Convidar membro (0.5h)**
Título: "Convidar membro"
Campo: "E-mail"
Campo: "Nome"
Seletor de papel (Admin / Member) ²
Botão "Enviar convite"
Link "Cancelar"

**[8.4] Auditoria (0.5h)**
Título: "Auditoria"
Barra de filtros
  Filtro por ação
  Filtro por período
Tabela de eventos de auditoria ³
  Coluna: Data
  Coluna: Autor
  Coluna: Ação
  Coluna: Entidade
  Coluna: Detalhe
Estado vazio quando não há eventos

### Anotações p/ UI e dev
¹ Criar empresa aplica o template de seed (idempotente): serviços, categorias com dreGroup, status, formas de pagamento, centros de custo e campos padrão
² Dois papéis no MVP (admin/member); ACL por formulário fica como gancho (D6). Convite grava app_metadata { account_id, role } no usuário
³ AuditLog cobre: fechar/reabrir período, excluir lançamento, alterar campo personalizado, gerenciar membro

### Fluxo visual
[8] → [8.1]
[8] → [8.2] → [8.2.1]
[8] → [8.3] → [8.3.1]
[8] → [8.4]

---

## SHELL / CONTEXTO GLOBAL — App Web — (1.5h Discovery / 2.5h UI)

> Não é um módulo de negócio, mas a casca autenticada presente em todas as telas
> (exceto Autenticação). Documentado à parte porque concentra a troca de contexto.

### Critérios de aceite
O que precisa funcionar?
  Navegação lateral leva a todos os módulos conforme o papel
  Trocar empresa reseta o contexto (período e dados) com confirmação ¹
  Seletor de período define o mês/ano vigente para dashboard, lançamentos e DRE
  Indicador de período fechado fica visível ²

### Elementos (presentes em todas as telas internas)
Sidebar de navegação
  Atalho "Dashboard" → 2
  Atalho "Entradas" → 3a
  Atalho "Saídas" → 3b
  Atalho "Fechamentos" → 3c
  Atalho "DRE" → 4
  Atalho "Cadastros" → 5
  Atalho "Contatos" → 6
  Atalho "Períodos" → 7
  Atalho "Configurações" → 8 (somente admin)
  Botão "Sair" com confirmação → 1
Seletor de empresa ativa (company switcher) ¹
Seletor de período (mês / ano)
Indicador de período fechado ²

### Anotações p/ UI e dev
¹ Trocar empresa reseta período e dados em cache; pedir confirmação antes de trocar
² Quando o período ativo está fechado, exibir badge "Fechado" no cabeçalho

### Fluxo macro do ambiente
Autenticação (1) → Shell
Shell → Dashboard (2)
Shell → Lançamentos (3a / 3b / 3c)
Shell → DRE (4)
Shell → Cadastros (5)
Shell → Contatos (6)
Shell → Períodos (7)
Shell → Configurações (8)

---

## Resumo de volumetria (telas)

| Módulo | Telas (numeração) | Horas |
|---|---|---|
| 1 Autenticação | 1, 1.1, 1.1.1 | 1.5h |
| 2 Dashboard | 2 | 13h |
| 3 Lançamentos | 3a, 3b, 3c, 3.1, 3.2, 3.3, 3.4 | 15h |
| 4 DRE | 4, 4.1 | 10h |
| 5 Cadastros | 5, 5.1–5.8 (+ modais) | 12h |
| 6 Contatos | 6, 6.1 | 3h |
| 7 Fechamento de período | 7, 7.1, 7.2 | 3.5h |
| 8 Configurações | 8, 8.1–8.4 (+ modais) | 7h |
| Shell / contexto | — | 4h |
| **Total previsto** | | **~69h** |

> ⚠️ Comparar com horas contratadas (a confirmar) antes de fechar o escopo. Marcações
> [V2] (billing, multi-tenant por usuário, venda a terceiros, HQ) estão fora deste documento.

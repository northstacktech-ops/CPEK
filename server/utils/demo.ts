import type { AuthContext } from './jwt'

export const DEMO_ACCESS_TOKEN = 'demo-access-token'
export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000101'
export const DEMO_COMPANY_SP_ID = '00000000-0000-0000-0000-000000000201'
export const DEMO_COMPANY_RJ_ID = '00000000-0000-0000-0000-000000000202'
export const DEMO_PERIOD_SP_ID = '00000000-0000-0000-0000-000000000301'
export const DEMO_PERIOD_RJ_ID = '00000000-0000-0000-0000-000000000302'
export const DEMO_PERIOD_ID = DEMO_PERIOD_SP_ID
export const DEMO_BANK_BOLETO_ID = '00000000-0000-0000-0000-000000000401'
export const DEMO_BANK_CAIXA_ID = '00000000-0000-0000-0000-000000000402'
export const DEMO_BANK_CARTAO_ID = '00000000-0000-0000-0000-000000000403'
export const DEMO_BANK_CORTESIA_ID = '00000000-0000-0000-0000-000000000404'
export const DEMO_CONTACT_CLIENT_ID = '00000000-0000-0000-0000-000000000501'
export const DEMO_CONTACT_SUPPLIER_ID = '00000000-0000-0000-0000-000000000502'
export const DEMO_SERVICE_CAUTELAR_ID = '00000000-0000-0000-0000-000000000601'
export const DEMO_SERVICE_CERTICAR_ID = '00000000-0000-0000-0000-000000000602'
export const DEMO_STATUS_PAGO_ID = '00000000-0000-0000-0000-000000000701'
export const DEMO_STATUS_ABERTO_ID = '00000000-0000-0000-0000-000000000702'
export const DEMO_CATEGORY_RECEITA_ID = '00000000-0000-0000-0000-000000000801'
export const DEMO_CATEGORY_DESPESA_ID = '00000000-0000-0000-0000-000000000802'
export const DEMO_COST_FIXED_ID = '00000000-0000-0000-0000-000000000901'
export const DEMO_COST_VARIABLE_ID = '00000000-0000-0000-0000-000000000902'
export const DEMO_FEE_DEFAULT_ID = '00000000-0000-0000-0000-000000001001'

export function isDemoToken(token: string | null | undefined): boolean {
  return token === DEMO_ACCESS_TOKEN
}

export function isDemoAuth(auth: AuthContext): boolean {
  return auth.tenantId === DEMO_TENANT_ID
}

export function demoAuthContext(): AuthContext {
  return {
    userId: DEMO_USER_ID,
    email: 'demo@cpek.local',
    role: 'ADMIN',
    tenantId: DEMO_TENANT_ID,
  }
}

export const demoCompanies = [
  {
    id: DEMO_COMPANY_SP_ID,
    name: 'Supervisão Vistorias SP',
    legalName: 'Supervisão Vistorias Ltda.',
    taxId: '12.345.678/0001-99',
    segment: 'Vistoria Cautelar',
    active: true,
    responsible: 'Cleber C.',
    email: 'operacao@supervisaovistorias.com.br',
    phone: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    zipCode: '01310-100',
    address: 'Avenida Paulista',
    number: '1200',
    complement: 'Conjunto 52',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    municipalRegistration: 'SP-128734',
    stateRegistration: 'Isento',
    businessHours: 'Segunda a sexta, 08h às 18h',
    notes: 'Dados demonstrativos isolados do acesso real.',
    updatedAt: null,
  },
  {
    id: DEMO_COMPANY_RJ_ID,
    name: 'Supervisão Vistorias RJ',
    legalName: 'Supervisão Vistorias Rio Ltda.',
    taxId: '21.456.789/0001-32',
    segment: 'Vistoria Cautelar',
    active: true,
    responsible: 'Cleber C.',
    email: 'rio@supervisaovistorias.com.br',
    phone: '(21) 3456-7890',
    whatsapp: '(21) 98765-4321',
    zipCode: '20040-020',
    address: 'Avenida Rio Branco',
    number: '156',
    complement: 'Sala 804',
    district: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
    municipalRegistration: 'RJ-842391',
    stateRegistration: 'Isento',
    businessHours: 'Segunda a sexta, 08h às 18h',
    notes: 'Dados demonstrativos isolados do acesso real.',
    updatedAt: null,
  },
]

export const demoPeriods = [
  { id: DEMO_PERIOD_SP_ID, companyId: DEMO_COMPANY_SP_ID, month: 6, year: 2026, status: 'OPEN' },
  { id: DEMO_PERIOD_RJ_ID, companyId: DEMO_COMPANY_RJ_ID, month: 6, year: 2026, status: 'OPEN' },
]

export const demoBankAccounts = [
  { id: DEMO_BANK_BOLETO_ID, bankAccountId: DEMO_BANK_BOLETO_ID, name: 'Boleto Itau', balance: 88067.75 },
  { id: DEMO_BANK_CAIXA_ID, bankAccountId: DEMO_BANK_CAIXA_ID, name: 'Caixa Loja Principal', balance: 794.5 },
  { id: DEMO_BANK_CARTAO_ID, bankAccountId: DEMO_BANK_CARTAO_ID, name: 'Cartão Crédito/Débito', balance: 15376.5 },
  { id: DEMO_BANK_CORTESIA_ID, bankAccountId: DEMO_BANK_CORTESIA_ID, name: 'Conta Cortesia', balance: 10081.8 },
]

export const demoDashboard = {
  cards: {
    faturamentoBruto: 49420,
    despesas: 21820,
    lucroReal: 27600,
    ticketMedio: 3088.75,
    vencidos: 13910,
  },
  accounts: demoBankAccounts.map(({ bankAccountId, name, balance }) => ({ bankAccountId, name, balance })),
  consolidatedBalance: 114320.55,
  cashFlow: [
    { date: '2026-01-01', realized: 15200, planned: 17800 },
    { date: '2026-02-01', realized: 32200, planned: 36500 },
    { date: '2026-03-01', realized: 51500, planned: 56800 },
    { date: '2026-04-01', realized: 71200, planned: 78200 },
    { date: '2026-05-01', realized: 89500, planned: 99200 },
    { date: '2026-06-01', realized: 114320, planned: 121500 },
    { date: '2026-07-01', realized: 0, planned: 150000 },
    { date: '2026-08-01', realized: 0, planned: 176000 },
    { date: '2026-09-01', realized: 0, planned: 202000 },
    { date: '2026-10-01', realized: 0, planned: 228000 },
    { date: '2026-11-01', realized: 0, planned: 252000 },
    { date: '2026-12-01', realized: 0, planned: 278000 },
  ],
}

export const demoEntries = [
  { id: 'demo-entry-1', data: '10/06/2026', cliente: 'Marcos Andrade', servico: 'Cautelar', valor: 320, deslocamento: 45, status: 'Pago' },
  { id: 'demo-entry-2', data: '11/06/2026', cliente: 'Ana Lima', servico: 'Certicar', valor: 480, deslocamento: 60, status: 'Pago' },
  { id: 'demo-entry-3', data: '12/06/2026', cliente: 'Roberto Souza', servico: 'Constatação', valor: 280, deslocamento: 30, status: 'Em Aberto' },
]

export const demoExits = [
  { id: 'demo-exit-1', data: '02/06/2026', fornecedor: 'Posto Shell', categoria: 'Combustível', centroCusto: 'Variável', valor: 380, vencimento: '02/06/2026', status: 'Pago' },
  { id: 'demo-exit-2', data: '05/06/2026', fornecedor: 'Imobiliaria ABC', categoria: 'Aluguel', centroCusto: 'Fixo', valor: 3200, vencimento: '05/06/2026', status: 'Pago' },
]

export const demoClosings = [
  { id: 'demo-closing-1', cliente: 'Juliana Costa', valor: 13910, vencimento: '30/06/2026', recebimento: '', status: 'Vencido' },
]

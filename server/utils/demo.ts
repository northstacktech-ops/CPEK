import type { AuthContext } from './jwt'

// Registros demo aceitam tanto os campos de exibição legados (cliente, valor,
// status...) quanto os campos reais de schema (contactId, valorServico...),
// já que o front normaliza os dois formatos — ver normalizeEntry() nas páginas.
export type DemoRecord = Record<string, unknown> & { id: string }

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
export const DEMO_PAYMENT_PIX_ID = '00000000-0000-0000-0000-000000001101'
export const DEMO_PAYMENT_DINHEIRO_ID = '00000000-0000-0000-0000-000000001102'
export const DEMO_PAYMENT_CARTAO_ID = '00000000-0000-0000-0000-000000001103'
export const DEMO_PAYMENT_BOLETO_ID = '00000000-0000-0000-0000-000000001104'

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
    royaltiesPercent: 11,
    impostoNfPercent: 6,
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
    royaltiesPercent: 11,
    impostoNfPercent: 6,
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
    royalties: 5436.2, // 11% do faturamento bruto (percentual demo)
    impostoNf: 1729.7, // 6% sobre entradas com NF emitida (percentual demo)
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

export const demoCatalogs = [
  ...[DEMO_COMPANY_SP_ID, DEMO_COMPANY_RJ_ID].flatMap((companyId) => [
    { id: DEMO_SERVICE_CAUTELAR_ID, companyId, kind: 'SERVICE', label: 'Cautelar', active: true, order: 1 },
    { id: DEMO_SERVICE_CERTICAR_ID, companyId, kind: 'SERVICE', label: 'Certicar', active: true, order: 2 },
    { id: DEMO_STATUS_PAGO_ID, companyId, kind: 'STATUS', label: 'Pago', active: true, order: 1 },
    { id: DEMO_STATUS_ABERTO_ID, companyId, kind: 'STATUS', label: 'Em Aberto', active: true, order: 2 },
    { id: DEMO_CATEGORY_RECEITA_ID, companyId, kind: 'CATEGORY', label: 'Receita Bruta', dreGroup: 'OPERATING_REVENUE', active: true, order: 1 },
    { id: DEMO_CATEGORY_DESPESA_ID, companyId, kind: 'CATEGORY', label: 'Despesas Operacionais', dreGroup: 'OPERATING_EXPENSE', active: true, order: 2 },
    { id: DEMO_PAYMENT_PIX_ID, companyId, kind: 'PAYMENT_METHOD', label: 'PIX', active: true, order: 1 },
    { id: DEMO_PAYMENT_DINHEIRO_ID, companyId, kind: 'PAYMENT_METHOD', label: 'Dinheiro', active: true, order: 2 },
    { id: DEMO_PAYMENT_CARTAO_ID, companyId, kind: 'PAYMENT_METHOD', label: 'Cartão de Crédito', active: true, order: 3 },
    { id: DEMO_PAYMENT_BOLETO_ID, companyId, kind: 'PAYMENT_METHOD', label: 'Boleto', active: true, order: 4 },
  ]),
]

export const demoCostCenters = [
  { id: DEMO_COST_FIXED_ID, label: 'Fixo', costType: 'FIXED', active: true },
  { id: DEMO_COST_VARIABLE_ID, label: 'Variável', costType: 'VARIABLE', active: true },
]

export const demoFeeProfiles = [
  { id: DEMO_FEE_DEFAULT_ID, label: 'Padrao Boleto', feeType: 'PERCENTAGE', value: 2, active: true },
]

export const demoContacts: DemoRecord[] = [
  { id: DEMO_CONTACT_CLIENT_ID, type: 'CLIENT', name: 'Marcos Andrade', phone: '(11) 98765-4321', email: 'marcos@email.com', taxId: '123.456.789-00', active: true },
  { id: DEMO_CONTACT_SUPPLIER_ID, type: 'SUPPLIER', name: 'Posto Shell', phone: '(11) 2345-6789', email: 'shell@posto.com', taxId: '98.765.432/0001-11', active: true },
]

export const demoCustomFields = [
  { id: 'demo-field-1', kind: 'ENTRY', fieldKey: 'placa', label: 'Placa do veiculo', dataType: 'TEXT', required: true, active: true, order: 1 },
  { id: 'demo-field-2', kind: 'ENTRY', fieldKey: 'modelo', label: 'Modelo', dataType: 'TEXT', required: false, active: true, order: 2 },
]

export const demoEntries: DemoRecord[] = [
  { id: 'demo-entry-1', data: '10/06/2026', cliente: 'Marcos Andrade', servico: 'Cautelar', valor: 320, deslocamento: 45, status: 'Pago' },
  { id: 'demo-entry-2', data: '11/06/2026', cliente: 'Ana Lima', servico: 'Certicar', valor: 480, deslocamento: 60, status: 'Pago' },
  { id: 'demo-entry-3', data: '12/06/2026', cliente: 'Roberto Souza', servico: 'Constatação', valor: 280, deslocamento: 30, status: 'Em Aberto' },
]

export const demoExits: DemoRecord[] = [
  { id: 'demo-exit-1', data: '02/06/2026', fornecedor: 'Posto Shell', categoria: 'Combustível', centroCusto: 'Variável', valor: 380, vencimento: '02/06/2026', status: 'Pago' },
  { id: 'demo-exit-2', data: '05/06/2026', fornecedor: 'Imobiliaria ABC', categoria: 'Aluguel', centroCusto: 'Fixo', valor: 3200, vencimento: '05/06/2026', status: 'Pago' },
]

export const demoClosings: DemoRecord[] = [
  { id: 'demo-closing-1', cliente: 'Juliana Costa', valor: 13910, vencimento: '30/06/2026', recebimento: '', status: 'Vencido' },
]

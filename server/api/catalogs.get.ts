import {
  DEMO_CATEGORY_DESPESA_ID,
  DEMO_CATEGORY_RECEITA_ID,
  DEMO_COMPANY_RJ_ID,
  DEMO_COMPANY_SP_ID,
  DEMO_SERVICE_CAUTELAR_ID,
  DEMO_SERVICE_CERTICAR_ID,
  DEMO_STATUS_ABERTO_ID,
  DEMO_STATUS_PAGO_ID,
  isDemoAuth,
} from '../utils/demo'
import { requireAuth, validateQuery } from '../utils/http'
import { withTenant } from '../utils/withTenant'
import { listCatalogsQuery } from '../utils/validators/catalogs'

const demoCatalogs = [
  ...[DEMO_COMPANY_SP_ID, DEMO_COMPANY_RJ_ID].flatMap((companyId) => [
    { id: DEMO_SERVICE_CAUTELAR_ID, companyId, kind: 'SERVICE', label: 'Cautelar', active: true, order: 1 },
    { id: DEMO_SERVICE_CERTICAR_ID, companyId, kind: 'SERVICE', label: 'Certicar', active: true, order: 2 },
    { id: DEMO_STATUS_PAGO_ID, companyId, kind: 'STATUS', label: 'Pago', active: true, order: 1 },
    { id: DEMO_STATUS_ABERTO_ID, companyId, kind: 'STATUS', label: 'Em Aberto', active: true, order: 2 },
    { id: DEMO_CATEGORY_RECEITA_ID, companyId, kind: 'CATEGORY', label: 'Receita Bruta', dreGroup: 'OPERATING_REVENUE', active: true, order: 1 },
    { id: DEMO_CATEGORY_DESPESA_ID, companyId, kind: 'CATEGORY', label: 'Despesas Operacionais', dreGroup: 'OPERATING_EXPENSE', active: true, order: 2 },
  ]),
]

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const query = validateQuery(event, listCatalogsQuery)
  if (isDemoAuth(auth)) {
    return { items: demoCatalogs.filter((item) => item.companyId === query.companyId && (!query.kind || item.kind === query.kind)) }
  }

  return withTenant(auth.tenantId, async (tx) => {
    const items = await tx.catalogValue.findMany({
      where: { companyId: query.companyId, ...(query.kind ? { kind: query.kind } : {}) },
      orderBy: [{ kind: 'asc' }, { order: 'asc' }, { label: 'asc' }],
    })
    return { items }
  })
})

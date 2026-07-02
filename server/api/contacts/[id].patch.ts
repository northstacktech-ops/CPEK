import { isDemoAuth } from '../../utils/demo'
import { apiError, requireAuth, validateBody } from '../../utils/http'
import { supabaseAdmin } from '../../utils/supabaseAdmin'
import { withTenant } from '../../utils/withTenant'
import { updateContactBody } from '../../utils/validators/contacts'

function normalizeContact(row: Record<string, unknown>) {
  return {
    id: row.id,
    companyId: row.company_id ?? row.companyId,
    type: row.type,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    taxId: row.cnpj_cpf ?? row.taxId,
    contact: row.contact,
    notes: row.notes,
    active: row.active,
  }
}

export default defineEventHandler(async (event) => {
  const auth = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw apiError(400, 'MISSING_ID', 'Id obrigatorio')
  const body = await validateBody(event, updateContactBody)
  if (isDemoAuth(auth)) return { item: { id, ...body } }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const item = await tx.contact.update({ where: { id }, data: body })
      return { item }
    })
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('contact')
      .update({
        company_id: body.companyId,
        type: body.type,
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        cnpj_cpf: body.taxId,
        contact: body.contact,
        notes: body.notes,
        active: body.active,
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select('*')
      .single()

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível salvar o contato.' })
    return { item: normalizeContact(data) }
  }
})

import { randomUUID } from 'node:crypto'
import { isDemoAuth } from '../utils/demo'
import { requireAuth, validateBody } from '../utils/http'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { withTenant } from '../utils/withTenant'
import { createContactBody } from '../utils/validators/contacts'

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
  const body = await validateBody(event, createContactBody)
  if (isDemoAuth(auth)) return { item: { id: `demo-contact-${Date.now()}`, active: true, ...body } }

  try {
    return await withTenant(auth.tenantId, async (tx) => {
      const item = await tx.contact.create({
        data: { tenantId: auth.tenantId, ...body },
      })
      return { item }
    })
  } catch {
    const { data, error } = await supabaseAdmin()
      .from('contact')
      .insert({
        id: randomUUID(),
        tenant_id: auth.tenantId,
        company_id: body.companyId,
        type: body.type,
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        cnpj_cpf: body.taxId,
        contact: body.contact,
        notes: body.notes,
      })
      .select('*')
      .single()

    if (error) throw createError({ statusCode: 503, statusMessage: 'Não foi possível salvar o contato.' })
    return { item: normalizeContact(data) }
  }
})

// POST /api/companies — criar empresa (admin) → aplica template de seed (§8, §13).
import { withTenant } from '../utils/withTenant'
import { requireAdmin, validateBody } from '../utils/http'
import { createCompanyBody } from '../utils/validators/companies'
import { applyTemplate, type FranchiseTemplate } from '../utils/seedTemplate'
import { readFileSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const body = await validateBody(event, createCompanyBody)

  // Carrega o template de franquia (§13). TODO: validar nome de template permitido.
  const template = JSON.parse(
    readFileSync(new URL(`../../prisma/seed/templates/${body.template}.json`, import.meta.url), 'utf8'),
  ) as FranchiseTemplate

  return withTenant(auth.tenantId, async (tx) => {
    const company = await tx.company.create({
      data: { tenantId: auth.tenantId, name: body.name, segment: body.segment ?? template.segment },
      select: { id: true, name: true, segment: true, active: true },
    })
    await applyTemplate(tx, auth.tenantId, company.id, template)
    return { company }
  })
})

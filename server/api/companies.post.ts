// POST /api/companies — criar empresa (admin) → aplica template de seed (§8, §13).
import { withTenant } from '../utils/withTenant'
import { requireAdmin, validateBody } from '../utils/http'
import { createCompanyBody } from '../utils/validators/companies'
import { applyTemplate, type FranchiseTemplate } from '../utils/seedTemplate'
import supervisaoTemplate from '../../prisma/seed/templates/supervisao.json'
import type { z } from 'zod'

// Import estático (não readFileSync em runtime): o Nitro não empacota arquivos
// lidos dinamicamente fora de server/ no build serverless (Vercel), o que fazia
// a criação de empresa falhar em produção com ENOENT.
const templates: Record<z.infer<typeof createCompanyBody>['template'], FranchiseTemplate> = {
  supervisao: supervisaoTemplate as FranchiseTemplate,
}

export default defineEventHandler(async (event) => {
  const auth = requireAdmin(event)
  const body = await validateBody(event, createCompanyBody)
  const template = templates[body.template]

  return withTenant(auth.tenantId, async (tx) => {
    const company = await tx.company.create({
      data: { tenantId: auth.tenantId, name: body.name, segment: body.segment ?? template.segment },
      select: { id: true, name: true, segment: true, active: true },
    })
    await applyTemplate(tx, auth.tenantId, company.id, template)
    return { company }
  })
})

// ============================================================================
// CPEK — Seed idempotente (ARCHITECTURE §13). Rodar: `pnpm db:seed`.
//
// Cria (ou reaproveita) uma conta demo + a empresa Supervisão e aplica o template
// de franquia. IDEMPOTENTE: re-rodar não duplica.
//
// Como o RLS é FORCE, todo insert precisa de app.current_tenant setado — por isso
// o seed roda dentro de withTenant (igual ao runtime). Ver §4.2 / §4.3.
// ============================================================================
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { prismaBase } from '../../server/utils/prisma'
import { withTenant } from '../../server/utils/withTenant'
import { applyTemplate, type FranchiseTemplate } from '../../server/utils/seedTemplate'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Conta demo determinística (idempotência). Em produção a conta vem do signup.
const DEMO_TENANT_ID =
  process.env.SEED_TENANT_ID ?? '00000000-0000-0000-0000-000000000001'

function loadTemplate(name: string): FranchiseTemplate {
  const raw = readFileSync(join(__dirname, 'templates', `${name}.json`), 'utf8')
  return JSON.parse(raw) as FranchiseTemplate
}

async function main() {
  const template = loadTemplate('supervisao')

  await withTenant(DEMO_TENANT_ID, async (tx) => {
    // Conta (idempotente por id).
    await tx.account.upsert({
      where: { id: DEMO_TENANT_ID },
      update: {},
      create: { id: DEMO_TENANT_ID, name: 'Conta Demo (Cleber)' },
    })

    // Empresa Supervisão (idempotente por (tenantId, name)).
    let company = await tx.company.findFirst({
      where: { tenantId: DEMO_TENANT_ID, name: template.companyName },
    })
    if (!company) {
      company = await tx.company.create({
        data: { tenantId: DEMO_TENANT_ID, name: template.companyName, segment: template.segment },
      })
    }

    await applyTemplate(tx, DEMO_TENANT_ID, company.id, template)
    console.log(`Seed aplicado: conta ${DEMO_TENANT_ID}, empresa "${company.name}" (${company.id})`)
  })
}

main()
  .then(() => prismaBase.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prismaBase.$disconnect()
    process.exit(1)
  })

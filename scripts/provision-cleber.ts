import { createClient } from '@supabase/supabase-js'
import { Role } from '@prisma/client'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) loadEnvFile(envFile)
}

const TENANT_ID = process.env.CLEBER_TENANT_ID ?? '7b4e2f0f-8b64-4b5d-9d0c-5f1a8f0f2026'
const COMPANY_ID = process.env.CLEBER_COMPANY_ID ?? '6f8a1a62-3437-44a6-a9f3-2f5570cc2026'
const EMAIL = process.env.CLEBER_EMAIL ?? 'cleber.portoalegre@supervisao.com'
const PASSWORD = process.env.CLEBER_PASSWORD
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de provisionar o acesso.')
}

if (!PASSWORD) {
  throw new Error('Configure CLEBER_PASSWORD antes de provisionar o acesso. A senha nao deve ficar gravada no repositorio.')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findOrCreateUser() {
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError

  const existing = listed.users.find((user) => user.email?.toLowerCase() === EMAIL.toLowerCase())
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: 'Cleber C.' },
      app_metadata: { account_id: TENANT_ID, role: Role.ADMIN },
    })
    if (error) throw error
    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Cleber C.' },
    app_metadata: { account_id: TENANT_ID, role: Role.ADMIN },
  })
  if (error) throw error
  return data.user
}

async function upsertWithSupabaseRest(userId: string) {
  const account = await supabase
    .from('account')
    .upsert({ id: TENANT_ID, name: 'Supervisao Vistorias' }, { onConflict: 'id' })
  if (account.error) throw account.error

  const company = await supabase.from('company').upsert(
    {
      id: COMPANY_ID,
      tenant_id: TENANT_ID,
      name: 'Supervisao Vistorias Porto Alegre',
      segment: 'Vistoria Cautelar',
      active: true,
    },
    { onConflict: 'id' },
  )
  if (company.error) throw company.error

  const appUser = await supabase.from('app_user').upsert(
    {
      id: userId,
      tenant_id: TENANT_ID,
      email: EMAIL,
      name: 'Cleber C.',
      role: Role.ADMIN,
      active: true,
    },
    { onConflict: 'id' },
  )
  if (appUser.error) throw appUser.error
}

async function main() {
  const [{ hasCompanyProfileColumns }, { prismaBase }, { withTenant }] = await Promise.all([
    import('../server/utils/companyProfile'),
    import('../server/utils/prisma'),
    import('../server/utils/withTenant'),
  ])
  try {
    const user = await findOrCreateUser()

    try {
      await withTenant(TENANT_ID, async (tx) => {
        const hasProfile = await hasCompanyProfileColumns(tx)

        await tx.account.upsert({
          where: { id: TENANT_ID },
          update: { name: 'Supervisao Vistorias' },
          create: { id: TENANT_ID, name: 'Supervisao Vistorias' },
        })

        await tx.company.upsert({
          where: { id: COMPANY_ID },
          update: hasProfile
            ? {
                name: 'Supervisao Vistorias Porto Alegre',
                segment: 'Vistoria Cautelar',
                active: true,
                responsible: 'Cleber C.',
                email: EMAIL,
                city: 'Porto Alegre',
                state: 'RS',
              }
            : {
                name: 'Supervisao Vistorias Porto Alegre',
                segment: 'Vistoria Cautelar',
                active: true,
              },
          create: hasProfile
            ? {
                id: COMPANY_ID,
                tenantId: TENANT_ID,
                name: 'Supervisao Vistorias Porto Alegre',
                segment: 'Vistoria Cautelar',
                active: true,
                responsible: 'Cleber C.',
                email: EMAIL,
                city: 'Porto Alegre',
                state: 'RS',
              }
            : {
                id: COMPANY_ID,
                tenantId: TENANT_ID,
                name: 'Supervisao Vistorias Porto Alegre',
                segment: 'Vistoria Cautelar',
                active: true,
              },
          select: { id: true },
        })

        await tx.user.upsert({
          where: { id: user.id },
          update: {
            tenantId: TENANT_ID,
            email: EMAIL,
            name: 'Cleber C.',
            role: Role.ADMIN,
            active: true,
          },
          create: {
            id: user.id,
            tenantId: TENANT_ID,
            email: EMAIL,
            name: 'Cleber C.',
            role: Role.ADMIN,
            active: true,
          },
        })
      })
    } catch {
      console.warn('Banco direto indisponivel; usando fallback REST do Supabase para provisionar dados basicos.')
      await upsertWithSupabaseRest(user.id)
    }

    console.log(`Acesso provisionado para ${EMAIL} no tenant ${TENANT_ID}.`)
  } finally {
    await prismaBase.$disconnect()
  }
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exit(1)
  })

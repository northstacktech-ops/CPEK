// CPEK — autenticação Supabase no client (ARCHITECTURE §9). ESQUELETO Fase 1.
// Login/recuperação via Supabase Auth; sessão expira em 30 dias de inatividade.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { navigateTo, useRuntimeConfig } from '#imports'
import { useCompanyStore } from '../stores/company'
import { usePeriodStore } from '../stores/period'
import { useSessionStore } from '../stores/session'

let _client: SupabaseClient | null = null
const DEMO_ACCESS_TOKEN = 'demo-access-token'
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_STORAGE_KEY = 'cpek.demo.session'

export function useSupabase(): SupabaseClient {
  if (_client) return _client
  const cfg = useRuntimeConfig()
  _client = createClient(cfg.public.supabaseUrl as string, cfg.public.supabaseAnonKey as string)
  return _client
}

export function useAuth() {
  const session = useSessionStore()
  const company = useCompanyStore()
  const period = usePeriodStore()

  async function signIn(email: string, password: string) {
    const { data, error } = await useSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
    const token = data.session?.access_token
    const meta = (data.user?.app_metadata ?? {}) as { account_id?: string; role?: string }
    if (!token || !data.user) {
      throw new Error('Não foi possível iniciar a sessão. Tente novamente.')
    }
    if (!meta.account_id) {
      // Sem account_id não há tenant: deixar a sessão vazia faria o middleware
      // global mandar de volta pro /login sem nenhuma explicação visível.
      throw new Error('Esta conta ainda não está vinculada a nenhuma empresa. Fale com o administrador.')
    }

    session.set({
      user: { id: data.user.id, email: data.user.email, role: meta.role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
      accessToken: token,
      tenantId: meta.account_id,
    })

    const me = await $fetch<{
      companies: Array<{ id: string; name: string; segment?: string | null }>
    }>('/api/me', {
      headers: { authorization: `Bearer ${token}` },
    })
    company.setCompanies(me.companies)
  }

  async function signOut() {
    if (session.accessToken && session.accessToken !== DEMO_ACCESS_TOKEN) {
      await useSupabase().auth.signOut()
    }
    session.clear()
    company.clear()
    period.reset()
    if (import.meta.client) localStorage.removeItem(DEMO_STORAGE_KEY)
    await navigateTo('/login')
  }

  async function signInDemo() {
    session.set({
      user: {
        id: '00000000-0000-0000-0000-000000000101',
        email: 'demo@cpek.local',
        role: 'ADMIN',
      },
      accessToken: DEMO_ACCESS_TOKEN,
      tenantId: DEMO_TENANT_ID,
    })

    company.setCompanies([
      {
        id: '00000000-0000-0000-0000-000000000201',
        name: 'Supervisão Vistorias SP',
        segment: 'Vistoria Cautelar',
      },
      {
        id: '00000000-0000-0000-0000-000000000202',
        name: 'Supervisão Vistorias RJ',
        segment: 'Vistoria Cautelar',
      },
    ])
    company.setActive('00000000-0000-0000-0000-000000000201')
    period.set(6, 2026)
    if (import.meta.client) {
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({
          activeCompanyId: company.activeId,
          month: period.month,
          year: period.year,
        }),
      )
    }
  }

  return { signIn, signInDemo, signOut }
}

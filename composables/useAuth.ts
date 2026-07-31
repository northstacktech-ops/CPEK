// CPEK — autenticação Supabase no client (ARCHITECTURE §9). ESQUELETO Fase 1.
// Login/recuperação via Supabase Auth; sessão expira em 30 dias de inatividade.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { navigateTo, useRuntimeConfig } from '#imports'
import { useCompanyStore } from '../stores/company'
import { usePeriodStore } from '../stores/period'
import { useSessionStore } from '../stores/session'

let _client: SupabaseClient | null = null

export function useSupabase(): SupabaseClient {
  if (_client) return _client
  const cfg = useRuntimeConfig()
  _client = createClient(cfg.public.supabaseUrl as string, cfg.public.supabaseAnonKey as string)
  return _client
}

/**
 * Aplica ao Pinia (session + company) uma sessão do Supabase (login, restore
 * ou refresh automático de token) — lógica única reaproveitada por signIn,
 * restoreSession e o listener onAuthStateChange, pra não triplicar o parsing
 * de app_metadata em três lugares.
 */
export async function applySupabaseSession(
  supaSession: { access_token: string; user: { id: string; email?: string; app_metadata?: unknown } } | null,
): Promise<boolean> {
  const session = useSessionStore()
  const company = useCompanyStore()

  if (!supaSession) {
    session.clear()
    return false
  }

  const token = supaSession.access_token
  const user = supaSession.user
  const meta = (user.app_metadata ?? {}) as { account_id?: string; role?: string }
  if (!token || !meta.account_id) {
    session.clear()
    return false
  }

  session.set({
    user: { id: user.id, email: user.email, role: meta.role === 'ADMIN' ? 'ADMIN' : 'MEMBER' },
    accessToken: token,
    tenantId: meta.account_id,
  })

  try {
    const me = await $fetch<{
      companies: Array<{ id: string; name: string; segment?: string | null }>
    }>('/api/me', {
      headers: { authorization: `Bearer ${token}` },
    })
    company.setCompanies(me.companies)
  } catch {
    // Sessão existe no client mas o servidor recusou (ex.: revogada) —
    // segue autenticado sem empresas; as telas tratam a lista vazia.
  }
  return true
}

export function useAuth() {
  const session = useSessionStore()
  const company = useCompanyStore()
  const period = usePeriodStore()

  async function signIn(email: string, password: string) {
    const { data, error } = await useSupabase().auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.session || !data.user) {
      throw new Error('Não foi possível iniciar a sessão. Tente novamente.')
    }
    const meta = (data.user.app_metadata ?? {}) as { account_id?: string }
    if (!meta.account_id) {
      // Sem account_id não há tenant: deixar a sessão vazia faria o middleware
      // global mandar de volta pro /login sem nenhuma explicação visível.
      throw new Error('Esta conta ainda não está vinculada a nenhuma empresa. Fale com o administrador.')
    }
    await applySupabaseSession(data.session)
  }

  async function signOut() {
    await useSupabase().auth.signOut()
    session.clear()
    company.clear()
    period.reset()
    await navigateTo('/login')
  }

  /**
   * Restaura a sessão do app a partir da sessão do Supabase já persistida no
   * client (localStorage do próprio SDK). Sem isso, o store de sessão (Pinia,
   * só em memória) fica vazio a cada reload e o middleware manda todo mundo
   * de volta pro /login mesmo com um login válido.
   */
  async function restoreSession(): Promise<boolean> {
    const { data } = await useSupabase().auth.getSession()
    return applySupabaseSession(data.session)
  }

  return { signIn, signOut, restoreSession }
}

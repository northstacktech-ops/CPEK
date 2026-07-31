// CPEK — bootstrap de sessão (ARCHITECTURE §9). Sem isto, o Pinia (em memória)
// fica vazio a cada reload/nova aba e o middleware manda pro /login mesmo com
// um refresh token do Supabase ainda válido. Também mantém o accessToken do
// Pinia sincronizado quando o supabase-js renova o token sozinho, evitando
// 401 silencioso em useApi() depois de ~1h de uso contínuo.
import { applySupabaseSession, useAuth, useSupabase } from '../composables/useAuth'
import { useSessionStore } from '../stores/session'

export default defineNuxtPlugin(async () => {
  const { restoreSession } = useAuth()
  await restoreSession()

  useSupabase().auth.onAuthStateChange((event, supaSession) => {
    if (event === 'SIGNED_OUT') {
      useSessionStore().clear()
      return
    }
    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
      void applySupabaseSession(supaSession)
    }
  })
})

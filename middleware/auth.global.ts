// CPEK — guarda de rota no client (ARCHITECTURE §9). Redireciona não autenticado
// para /login. A autoridade de segurança é o servidor; isto é só UX.
import { useAuth } from '../composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const session = useSessionStore()
  const PUBLIC_PATHS = ['/login', '/definir-senha']
  const isPublic = PUBLIC_PATHS.includes(to.path)

  if (!session.isAuthenticated && !isPublic) {
    // Rede de segurança contra timing entre o plugin de bootstrap e a navegação
    // inicial — tenta restaurar a sessão do Supabase antes de desistir e mandar
    // pro /login (o plugin já faz isso no boot; isto cobre qualquer corrida).
    await useAuth().restoreSession()
  }
  if (!session.isAuthenticated && !isPublic) {
    return navigateTo('/login')
  }
  // /definir-senha nunca redireciona por conta da sessão do app — quem chega
  // ali tem uma sessão de recuperação própria do Supabase, separada da sessão
  // do app (session store), então "autenticado no app" não se aplica.
  if (session.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})

// CPEK — guarda de rota no client (ARCHITECTURE §9). Redireciona não autenticado
// para /login. A autoridade de segurança é o servidor; isto é só UX.
export default defineNuxtRouteMiddleware((to) => {
  const session = useSessionStore()
  const isPublic = to.path === '/login'
  if (!session.isAuthenticated && !isPublic) {
    return navigateTo('/login')
  }
  if (session.isAuthenticated && isPublic) {
    return navigateTo('/')
  }
})

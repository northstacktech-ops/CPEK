// CPEK — guarda de rota no client (ARCHITECTURE §9). Redireciona não autenticado
// para /login. A autoridade de segurança é o servidor; isto é só UX.
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const session = useSessionStore()
  const company = useCompanyStore()
  const period = usePeriodStore()
  const PUBLIC_PATHS = ['/login', '/definir-senha']
  const isPublic = PUBLIC_PATHS.includes(to.path)

  if (import.meta.client && !session.isAuthenticated) {
    const savedDemo = localStorage.getItem('cpek.demo.session')
    if (savedDemo) {
      const parsed = JSON.parse(savedDemo) as { activeCompanyId?: string; month?: number; year?: number }
      session.set({
        user: {
          id: '00000000-0000-0000-0000-000000000101',
          email: 'demo@cpek.local',
          role: 'ADMIN',
        },
        accessToken: 'demo-access-token',
        tenantId: '00000000-0000-0000-0000-000000000001',
      })
      company.setCompanies([
        {
          id: '00000000-0000-0000-0000-000000000201',
          name: 'Supervisao Vistorias SP',
          segment: 'Vistoria Cautelar',
        },
        {
          id: '00000000-0000-0000-0000-000000000202',
          name: 'Supervisao Vistorias RJ',
          segment: 'Vistoria Cautelar',
        },
      ])
      company.setActive(parsed.activeCompanyId ?? '00000000-0000-0000-0000-000000000201')
      period.set(parsed.month ?? 6, parsed.year ?? 2026)
    }
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

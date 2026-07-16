// ============================================================================
// CPEK — middleware de autenticação (ARCHITECTURE §9)
//
// Valida o JWT Supabase, extrai account_id/role e popula event.context.auth.
// Handlers usam withTenant(event.context.auth.tenantId, ...). NUNCA confiar em
// tenant_id/role vindos do client — sempre do token validado aqui.
//
// Rotas públicas (sem auth): health-check e endpoints de auth/bootstrap.
//
// Verificação do token: local HS256 se SUPABASE_JWT_SECRET estiver definido;
// senão, via API de Auth do Supabase (sem secret). Ver server/utils/authVerify.ts.
// ============================================================================
import { JwtError } from '../utils/jwt'
import { resolveAuthContext } from '../utils/authVerify'
import { apiError } from '../utils/http'

const PUBLIC_PREFIXES = ['/api/health', '/api/auth']

export default defineEventHandler(async (event) => {
  const path = event.path || ''

  // Só protege rotas de API; páginas/SSR e assets passam.
  if (!path.startsWith('/api/')) return
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return

  const header = getRequestHeader(event, 'authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    throw apiError(401, 'UNAUTHENTICATED', 'Não autenticado. Faça login novamente.')
  }

  try {
    event.context.auth = await resolveAuthContext(token)
  } catch (err) {
    if (err instanceof JwtError) {
      throw apiError(401, 'UNAUTHENTICATED', err.message)
    }
    throw err
  }
})

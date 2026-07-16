// ============================================================================
// CPEK — resolução do AuthContext a partir do access_token (ARCHITECTURE §9).
//
// Duas estratégias, nesta ordem:
//   1) Se SUPABASE_JWT_SECRET estiver definido → verificação LOCAL HS256 (rápida,
//      sem round-trip). Ver server/utils/jwt.ts.
//   2) Senão → verificação via API de Auth do Supabase (GET /auth/v1/user). Não
//      exige o JWT secret; usa apenas a URL + anon key. É a autoridade do servidor
//      (§2.3): o token é validado pelo próprio Supabase e devolve app_metadata.
//
// Em ambos os casos, tenant_id/role vêm de app_metadata — nunca do client.
// ============================================================================
import { JwtError, toAuthContext, verifySupabaseJwt, type AuthContext } from './jwt'
import { apiError } from './http'

interface SupabaseUserResponse {
  id: string
  email?: string
  app_metadata?: { account_id?: string; role?: string }
}

export async function resolveAuthContext(token: string): Promise<AuthContext> {
  const config = useRuntimeConfig()
  const secret = config.supabaseJwtSecret as string | undefined

  // Caminho rápido: verificação local HS256 (quando o secret está configurado).
  if (secret) {
    return toAuthContext(verifySupabaseJwt(token, secret))
  }

  // Caminho sem secret: o Supabase valida o token e devolve o usuário.
  const url = config.public.supabaseUrl as string | undefined
  const anon = config.public.supabaseAnonKey as string | undefined
  if (!url || !anon) {
    throw apiError(500, 'CONFIG_ERROR', 'Supabase Auth não configurado no servidor')
  }

  let user: SupabaseUserResponse
  try {
    user = await $fetch<SupabaseUserResponse>(`${url}/auth/v1/user`, {
      headers: { apikey: anon, authorization: `Bearer ${token}` },
    })
  } catch (err) {
    // Supabase rejeitou o token (401/403) → problema de sessão do usuário.
    // Qualquer outra falha (rede, timeout, 5xx) → indisponibilidade do serviço,
    // não "senha errada" — não confundir as duas coisas pro usuário.
    const status = (err as { response?: { status?: number } } | undefined)?.response?.status
    if (status === 401 || status === 403) throw new JwtError('Token inválido ou expirado')
    throw apiError(503, 'AUTH_SERVICE_UNAVAILABLE', 'Não foi possível verificar sua sessão agora. Tente novamente em instantes.')
  }

  const tenantId = user.app_metadata?.account_id
  if (!tenantId) throw new JwtError('Token sem app_metadata.account_id (tenant)')
  const role = user.app_metadata?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
  return { userId: user.id, email: user.email, tenantId, role }
}

// ============================================================================
// CPEK — verificação de JWT Supabase (HS256) sem dependências externas.
// ARCHITECTURE §9: o servidor é a autoridade; claims account_id/role vêm do token.
//
// Projetos Supabase clássicos assinam o access_token com HS256 usando o
// "JWT secret" do projeto (SUPABASE_JWT_SECRET). Validamos assinatura + exp e
// extraímos app_metadata.{account_id, role}. NUNCA confiar em claims do client.
// ============================================================================
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface SupabaseClaims {
  sub: string // auth.users.id
  email?: string
  exp: number
  app_metadata?: { account_id?: string; role?: string }
  [k: string]: unknown
}

export interface AuthContext {
  userId: string
  email?: string
  tenantId: string // = app_metadata.account_id
  role: 'ADMIN' | 'MEMBER'
}

function b64urlToBuffer(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export class JwtError extends Error {}

/**
 * Verifica um access_token Supabase (HS256) e retorna os claims. Lança JwtError
 * em assinatura inválida, formato inválido ou token expirado.
 */
export function verifySupabaseJwt(token: string, secret: string): SupabaseClaims {
  const parts = token.split('.')
  if (parts.length !== 3) throw new JwtError('Formato de JWT inválido')
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]

  const header = JSON.parse(b64urlToBuffer(headerB64).toString('utf8')) as { alg?: string }
  if (header.alg !== 'HS256') {
    throw new JwtError(`Algoritmo não suportado: ${header.alg ?? 'desconhecido'}`)
  }

  const expected = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest()
  const actual = b64urlToBuffer(signatureB64)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new JwtError('Assinatura inválida')
  }

  const claims = JSON.parse(b64urlToBuffer(payloadB64).toString('utf8')) as SupabaseClaims
  if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) {
    throw new JwtError('Token expirado')
  }
  return claims
}

/**
 * Resolve o AuthContext a partir dos claims. Fail-closed: sem account_id, nega.
 */
export function toAuthContext(claims: SupabaseClaims): AuthContext {
  const tenantId = claims.app_metadata?.account_id
  if (!tenantId) throw new JwtError('Token sem app_metadata.account_id (tenant)')
  const role = claims.app_metadata?.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
  return { userId: claims.sub, email: claims.email, tenantId, role }
}

// ============================================================================
// CPEK — helpers de handler (auth, validação zod, erros padronizados).
// ARCHITECTURE §8: erros no formato { error: { code, message } }; toda rota
// autenticada → withTenant → validação zod. Período fechado → 409 PERIOD_CLOSED.
// ============================================================================
import type { H3Event } from 'h3'
import { z, type ZodTypeAny } from 'zod'
import type { AuthContext } from './jwt'

/** Garante autenticação e retorna o contexto (tenantId/role do JWT). */
export function requireAuth(event: H3Event): AuthContext {
  const auth = event.context.auth
  if (!auth) throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  return auth
}

/** Garante papel admin (ARCHITECTURE §8: criar empresa, fechar período, membros). */
export function requireAdmin(event: H3Event): AuthContext {
  const auth = requireAuth(event)
  if (auth.role !== 'ADMIN') {
    throw apiError(403, 'FORBIDDEN', 'Ação restrita a administradores')
  }
  return auth
}

/** Erro de API no contrato { error: { code, message } } (§8). */
export function apiError(statusCode: number, code: string, message: string) {
  return createError({ statusCode, statusMessage: message, data: { error: { code, message } } })
}

/** Período fechado trava edição → 409 PERIOD_CLOSED (§8 / regra crítica 4). */
export function periodClosedError() {
  return apiError(409, 'PERIOD_CLOSED', 'Período fechado: edição bloqueada')
}

/** Valida o corpo da request com um schema zod (§6 regra 6: validação no servidor). */
export async function validateBody<S extends ZodTypeAny>(
  event: H3Event,
  schema: S,
): Promise<z.infer<S>> {
  const body = await readBody(event).catch(() => undefined)
  const result = schema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Payload inválido',
      data: { error: { code: 'VALIDATION_ERROR', message: 'Payload inválido' }, issues: result.error.issues },
    })
  }
  return result.data
}

/** Valida a query string com um schema zod. */
export function validateQuery<S extends ZodTypeAny>(event: H3Event, schema: S): z.infer<S> {
  const result = schema.safeParse(getQuery(event))
  if (!result.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Query inválida',
      data: { error: { code: 'VALIDATION_ERROR', message: 'Query inválida' }, issues: result.error.issues },
    })
  }
  return result.data
}

/** Marca um endpoint ainda não implementado (stub das Fases 1–4). */
export function notImplemented(section: string): never {
  throw apiError(501, 'NOT_IMPLEMENTED', `Stub — implementar conforme ARCHITECTURE ${section}`)
}

// ============================================================================
// CPEK — cliente Supabase Admin (service_role) — SÓ no servidor (ARCHITECTURE §9).
//
// Usado no signup/convite para gravar app_metadata = { account_id, role }, que
// passam a viajar no JWT como claims. A service_role key NUNCA vai ao client.
// ============================================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Role } from '@prisma/client'
import { apiError } from './http'

let _admin: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const serviceKey = config.supabaseServiceRoleKey
  if (!url || !serviceKey) {
    throw apiError(500, 'CONFIG_ERROR', 'Supabase admin não configurado no servidor')
  }
  _admin = createClient(url as string, serviceKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}

/**
 * Grava os claims de tenant/papel no usuário (app_metadata). Chamar no servidor,
 * no signup/convite. ARCHITECTURE §9 / §4.3 (bootstrap permitido).
 */
export async function setUserClaims(
  userId: string,
  claims: { account_id: string; role: Role },
): Promise<void> {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, {
    app_metadata: { account_id: claims.account_id, role: claims.role },
  })
  if (error) {
    throw apiError(500, 'SUPABASE_ADMIN_ERROR', `Falha ao gravar claims: ${error.message}`)
  }
}

// CPEK — wrapper de $fetch que injeta o Bearer token da sessão (ARCHITECTURE §9).
// Toda chamada ao servidor passa o JWT; o servidor é a autoridade (§2.3).
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export function useApi() {
  const session = useSessionStore()

  function api<T>(request: NitroFetchRequest, opts: NitroFetchOptions<NitroFetchRequest> = {}) {
    return $fetch<T>(request, {
      ...opts,
      headers: {
        ...(opts.headers as Record<string, string>),
        ...(session.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {}),
      },
    })
  }

  return { api }
}

// CPEK — store de sessão (ARCHITECTURE §11.3). Usuário, papel, token.
import { defineStore } from 'pinia'

export interface SessionUser {
  id: string
  email?: string
  role: 'ADMIN' | 'MEMBER'
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    user: null as SessionUser | null,
    accessToken: null as string | null,
    tenantId: null as string | null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    isAdmin: (s) => s.user?.role === 'ADMIN',
  },
  actions: {
    set(payload: { user: SessionUser; accessToken: string; tenantId: string }) {
      this.user = payload.user
      this.accessToken = payload.accessToken
      this.tenantId = payload.tenantId
    },
    clear() {
      this.user = null
      this.accessToken = null
      this.tenantId = null
    },
  },
})

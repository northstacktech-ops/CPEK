// Augmenta o contexto do H3/Nitro com o resultado do middleware de auth (§9).
import type { AuthContext } from '../server/utils/jwt'

declare module 'h3' {
  interface H3EventContext {
    auth?: AuthContext
  }
}

export {}

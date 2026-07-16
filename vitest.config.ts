import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

// Vitest — unit (motor de DRE, snapshot custom fields, fórmulas dashboard) +
// integração (isolamento RLS em matriz contra DB de teste). Ver ARCHITECTURE §15.
// Os testes de RLS exigem um Postgres de teste (DATABASE_URL/DIRECT_URL apontando
// para um banco descartável com schema + policies aplicados). Ver README §4 e
// tests/README.md.

// Carrega .env.local (convenção Nuxt) para process.env ANTES dos testes rodarem.
// Sem isso, `pnpm test` local não enxerga DATABASE_URL e tests/rls-isolation.spec.ts
// é pulado em silêncio (describe.skip) em vez de rodar de verdade — dá falsa
// sensação de "tudo passou". Não sobrescreve variáveis já definidas no ambiente
// (CI define DATABASE_URL explicitamente e deve continuar tendo prioridade).
const envLocalPath = fileURLToPath(new URL('./.env.local', import.meta.url))
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '')
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})

import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Vitest — unit (motor de DRE, snapshot custom fields, fórmulas dashboard) +
// integração (isolamento RLS em matriz contra DB de teste). Ver ARCHITECTURE §15.
// Os testes de RLS exigem um Postgres de teste (DATABASE_URL/DIRECT_URL apontando
// para um banco descartável com schema + policies aplicados). Ver README §4 e
// tests/README.md.
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

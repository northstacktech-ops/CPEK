// ESLint 9 flat config — CPEK
// Inclui a regra de arquitetura que proíbe o cliente Prisma base em server/api/**
// (ARCHITECTURE §4.3 / §8 / §14 — gate de segurança).
import cpek from './eslint-rules/no-base-prisma-in-api.js'
import tsParser from '@typescript-eslint/parser'

// O Nuxt gera um config base em .nuxt/eslint.config.mjs quando @nuxt/eslint está
// instalado. Aqui mantemos um config mínimo e independente para garantir que a
// regra crítica rode no CI mesmo sem o módulo do Nuxt.
export default [
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      'prisma/migrations/**',
    ],
  },
  {
    // Sem isso, o ESLint usa o parser JS puro (espree), que não entende sintaxe
    // TS (type-only imports, generics, etc.) e quebra o parsing em vez de lintar.
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module' },
    },
  },
  {
    files: ['server/api/**/*.{ts,js}'],
    plugins: {
      cpek,
    },
    rules: {
      'cpek/no-base-prisma-in-api': 'error',
    },
  },
]

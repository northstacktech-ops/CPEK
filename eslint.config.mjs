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
      '**/*.vue',
    ],
  },
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
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

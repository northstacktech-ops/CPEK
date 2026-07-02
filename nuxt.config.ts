// https://nuxt.com/docs/api/configuration/nuxt-config
// CPEK - Nuxt 3 (Nitro). Desktop-first financial app.
import Aura from '@primeuix/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  pages: true,

  modules: ['@pinia/nuxt', '@primevue/nuxt-module', '@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },

  nitro: {
    moduleSideEffects: ['@prisma/client'],
    externals: {
      external: ['@prisma/client', '.prisma/client', 'prisma'],
    },
    compressPublicAssets: true,
  },

  routeRules: {
    '/login': { ssr: true },
    '/api/health': { headers: { 'cache-control': 'no-store' } },
    '/api/**': { headers: { 'cache-control': 'private, no-store' } },
  },

  build: {
    analyze: process.env.ANALYZE === 'true',
  },

  app: {
    head: {
      title: 'CPEK',
      htmlAttrs: { lang: 'pt-BR' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      ],
    },
  },
})

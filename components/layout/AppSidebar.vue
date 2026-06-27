<script setup lang="ts">
import { useRoute } from '#imports'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const { signOut } = useAuth()

const operacao = [
  { label: 'Painel', icon: 'pi pi-chart-line', route: '/' },
  { label: 'Entradas', icon: 'pi pi-arrow-circle-down', route: '/lancamentos/entradas' },
  { label: 'Saídas', icon: 'pi pi-arrow-circle-up', route: '/lancamentos/saidas' },
  { label: 'Fechamentos', icon: 'pi pi-file-check', route: '/lancamentos/fechamentos' },
]

const gestao = [
  { label: 'DRE', icon: 'pi pi-table', route: '/dre' },
  { label: 'Cadastros', icon: 'pi pi-list-check', route: '/cadastros' },
  { label: 'Contatos', icon: 'pi pi-users', route: '/contatos' },
]

function isActive(itemRoute: string) {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}
</script>

<template>
  <aside class="flex h-screen w-60 flex-col border-r border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-950">
    <!-- Brand -->
    <div class="flex items-center px-4 py-5 border-b border-surface-100 dark:border-surface-800">
      <strong class="text-2xl font-black tracking-tight text-brand-600 dark:text-brand-300">CPEK</strong>
    </div>

    <!-- Nav -->
    <nav class="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      <!-- Operação -->
      <div>
        <p class="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">Operação</p>
        <ul class="space-y-0.5">
          <li v-for="item in operacao" :key="item.route">
            <NuxtLink
              :to="item.route"
              class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
              :class="isActive(item.route)
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100'"
            >
              <i :class="[item.icon, 'text-base', isActive(item.route) ? 'text-brand-600 dark:text-brand-300' : 'text-surface-400 dark:text-surface-500']" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Gestão -->
      <div>
        <p class="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">Gestão</p>
        <ul class="space-y-0.5">
          <li v-for="item in gestao" :key="item.route">
            <NuxtLink
              :to="item.route"
              class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
              :class="isActive(item.route)
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300'
                : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100'"
            >
              <i :class="[item.icon, 'text-base', isActive(item.route) ? 'text-brand-600 dark:text-brand-300' : 'text-surface-400 dark:text-surface-500']" />
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Bottom -->
    <div class="border-t border-surface-100 px-3 py-3 dark:border-surface-800">
      <ul class="space-y-0.5">
        <li>
          <NuxtLink
            to="/periodos"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
            :class="isActive('/periodos')
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300'
              : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100'"
          >
            <i class="pi pi-calendar text-base text-surface-400 dark:text-surface-500" />
            Períodos
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/configuracoes"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
            :class="isActive('/configuracoes')
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300'
              : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100'"
          >
            <i class="pi pi-cog text-base text-surface-400 dark:text-surface-500" />
            Configurações
          </NuxtLink>
        </li>
        <li>
          <button
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
            @click="signOut"
          >
            <i class="pi pi-sign-out text-base text-surface-400 dark:text-surface-500" />
            Sair
          </button>
        </li>
      </ul>
    </div>
  </aside>
</template>

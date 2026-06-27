<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import { useCompanyStore } from '../../stores/company'
import { useAuth } from '../../composables/useAuth'

const company = useCompanyStore()
const { signOut } = useAuth()
const darkMode = ref(false)

const companyMenuRef = ref()
const switchTarget = ref<{ id: string; name: string } | null>(null)
const switchDialogOpen = ref(false)

const companyMenuItems = computed(() =>
  company.companies.map(c => ({
    label: c.name,
    icon: company.activeId === c.id ? 'pi pi-check' : 'pi pi-building',
    command: () => {
      if (c.id === company.activeId) return
      switchTarget.value = { id: c.id, name: c.name }
      switchDialogOpen.value = true
    },
  })),
)

function confirmSwitch() {
  if (switchTarget.value) company.setActive(switchTarget.value.id)
  switchDialogOpen.value = false
  switchTarget.value = null
}

function applyTheme(enabled: boolean) {
  document.documentElement.classList.toggle('app-dark', enabled)
  localStorage.setItem('cpek-theme', enabled ? 'dark' : 'light')
}

onMounted(() => {
  darkMode.value = localStorage.getItem('cpek-theme') === 'dark'
  applyTheme(darkMode.value)
})

watch(darkMode, applyTheme)

const notifRef = ref()
const notifCount = ref(2)
const notifications = ref([
  { id: '1', icon: 'pi pi-clock', title: 'Vencimento amanhã — Juliana Costa', time: 'há 1 hora', read: false },
  { id: '2', icon: 'pi pi-arrow-circle-down', title: 'Nova entrada lançada por Marcos Silva', time: 'há 3 horas', read: false },
  { id: '3', icon: 'pi pi-check-circle', title: 'Fechamento de maio aprovado', time: 'há 2 dias', read: true },
])

function markAllRead() {
  notifications.value.forEach(n => (n.read = true))
  notifCount.value = 0
}

const profileMenuRef = ref()
const profileItems = [
  { label: 'Configurações', icon: 'pi pi-cog', command: () => navigateTo('/configuracoes') },
  { separator: true },
  { label: 'Sair', icon: 'pi pi-sign-out', command: () => signOut() },
]
</script>

<template>
  <div>
    <Toolbar class="cpek-topbar">
      <template #start>
        <div class="flex min-w-0 items-center gap-2">
          <i class="pi pi-building flex-shrink-0 text-brand-600 dark:text-brand-300" />
          <span class="max-w-[200px] truncate text-sm font-bold text-surface-900 dark:text-surface-0">
            {{ company.active?.name ?? 'Selecionar empresa' }}
          </span>
          <Button
            icon="pi pi-chevron-down"
            text
            rounded
            size="small"
            severity="secondary"
            aria-label="Trocar empresa"
            @click="companyMenuRef.toggle($event)"
          />
          <Menu ref="companyMenuRef" :model="companyMenuItems" popup />
        </div>
      </template>

      <template #end>
        <div class="flex items-center gap-2">
          <!-- Dark mode toggle -->
          <div class="hidden items-center gap-2 text-sm text-surface-500 md:flex">
            <i class="pi pi-moon text-xs" aria-hidden="true" />
            <ToggleSwitch v-model="darkMode" aria-label="Alternar tema escuro" />
          </div>

          <Divider layout="vertical" class="!mx-1 !hidden !h-6 md:!block" />

          <!-- Notifications -->
          <div class="relative">
            <Button
              icon="pi pi-bell"
              text
              rounded
              severity="secondary"
              size="small"
              aria-label="Notificações"
              @click="notifRef.toggle($event)"
            />
            <span
              v-if="notifCount > 0"
              class="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white"
            >{{ notifCount }}</span>
          </div>

          <Popover ref="notifRef">
            <div class="w-80">
              <div class="flex items-center justify-between px-1 pb-2">
                <span class="text-sm font-bold text-surface-900 dark:text-surface-0">Notificações</span>
                <Button label="Marcar tudo lido" text size="small" class="!text-xs" @click="markAllRead" />
              </div>
              <Divider class="!my-1" />
              <div
                v-for="n in notifications"
                :key="n.id"
                class="flex cursor-default gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                <div
                  class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  :class="n.read ? 'bg-surface-100 dark:bg-surface-800' : 'bg-brand-50 dark:bg-brand-900/30'"
                >
                  <i :class="[n.icon, 'text-sm', n.read ? 'text-surface-400' : 'text-brand-600 dark:text-brand-300']" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-surface-800 dark:text-surface-100">{{ n.title }}</p>
                  <p class="text-xs text-surface-400">{{ n.time }}</p>
                </div>
                <span v-if="!n.read" class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
              </div>
            </div>
          </Popover>

          <Divider layout="vertical" class="!mx-1 !hidden !h-6 md:!block" />

          <!-- User profile -->
          <Menu ref="profileMenuRef" :model="profileItems" popup />
          <button
            class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
            type="button"
            @click="profileMenuRef.toggle($event)"
          >
            <img
              src="https://i.pravatar.cc/150?img=3"
              alt="Foto de perfil"
              class="h-8 w-8 rounded-full object-cover ring-2 ring-surface-200 dark:ring-surface-700"
            />
            <div class="hidden text-left leading-tight sm:block">
              <strong class="block text-sm text-surface-900 dark:text-surface-0">Cleber C.</strong>
              <span class="text-xs text-surface-500">Dono da firma</span>
            </div>
            <i class="pi pi-chevron-down hidden text-[10px] text-surface-400 sm:block" />
          </button>
        </div>
      </template>
    </Toolbar>

    <!-- Dialog de confirmação de troca de empresa -->
    <Dialog v-model:visible="switchDialogOpen" modal header="Trocar de empresa" class="!w-[440px]" :draggable="false">
      <div class="space-y-4">
        <div class="flex items-start gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
          <i class="pi pi-exclamation-triangle mt-0.5 text-amber-500" />
          <div>
            <p class="text-sm font-semibold text-amber-800 dark:text-amber-300">Todos os dados serão alterados</p>
            <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Você está trocando para <strong>{{ switchTarget?.name }}</strong>.
              O painel, lançamentos e relatórios exibirão os dados dessa unidade.
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="switchDialogOpen = false" />
          <Button label="Confirmar troca" fluid @click="confirmSwitch" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

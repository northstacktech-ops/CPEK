<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from '#app'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import { useCompanyStore, type CompanyRef } from '../../stores/company'

const company = useCompanyStore()
const route = useRoute()
const { load: loadCompanies } = useCompany()
const { api } = useApi()

const creating = ref(false)
const createError = ref<string | null>(null)
const createForm = reactive({ name: '', segment: 'Vistoria Cautelar' })

const segmentOptions = [
  { label: 'Vistoria Cautelar', value: 'Vistoria Cautelar' },
  { label: 'Perícia Veicular', value: 'Perícia Veicular' },
  { label: 'Inspeção Automotiva', value: 'Inspeção Automotiva' },
  { label: 'Administrativo', value: 'Administrativo' },
]

const showNoCompanyModal = computed(() => company.companies.length === 0 && route.path !== '/configuracoes')


async function createCompany() {
  if (!createForm.name.trim() || creating.value) return
  creating.value = true
  createError.value = null
  try {
    const response = await api<{ company: CompanyRef }>('/api/companies', {
      method: 'POST',
      body: { name: createForm.name.trim(), segment: createForm.segment },
    })
    await loadCompanies()
    company.setActive(response.company.id)
  } catch (err) {
    createError.value = apiErrorMessage(err, 'Não foi possível criar a empresa agora.')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-slate-900 transition-colors dark:bg-surface-950 dark:text-slate-100">
    <div class="flex min-h-screen">
      <AppSidebar class="sticky top-0 shrink-0 max-lg:hidden" />
      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main class="flex-1 px-6 py-5 max-md:px-4">
          <slot />
        </main>
      </div>
    </div>

    <Dialog
      :visible="showNoCompanyModal"
      modal
      :closable="false"
      :close-on-escape="false"
      header="Bem-vindo! Vamos criar sua primeira empresa"
      class="!w-[440px] !max-w-[96vw]"
      :draggable="false"
    >
      <form class="space-y-4" @submit.prevent="createCompany">
        <p class="text-sm text-surface-500">
          Ainda não existe nenhuma empresa cadastrada nesta conta. Crie a primeira empresa para começar a usar cadastros,
          lançamentos e relatórios — nada pode ser salvo até que isso seja feito.
        </p>
        <Message v-if="createError" severity="error" size="small">{{ createError }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome da empresa</label>
          <InputText v-model="createForm.name" fluid autofocus />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Segmento</label>
          <Select v-model="createForm.segment" :options="segmentOptions" option-label="label" option-value="value" editable fluid />
        </div>
      </form>
      <template #footer>
        <Button label="Criar empresa" :loading="creating" :disabled="!createForm.name.trim()" fluid @click="createCompany" />
      </template>
    </Dialog>
  </div>
</template>

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
      :show-header="false"
      class="!w-[440px] !max-w-[96vw] !rounded-2xl"
      :draggable="false"
    >
      <div class="px-2 pt-2">
        <div class="mb-5 flex flex-col items-center text-center">
          <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-600/15">
            <i class="pi pi-building text-2xl text-brand-600 dark:text-brand-300" />
          </span>
          <h1 class="text-xl font-bold text-surface-900 dark:text-surface-0">Vamos criar sua primeira empresa</h1>
          <p class="mt-1.5 max-w-xs text-sm text-surface-400">
            Nenhuma empresa cadastrada ainda — crie a primeira pra começar a usar cadastros, lançamentos e relatórios.
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="createCompany">
          <Message v-if="createError" severity="error" size="small" variant="simple">{{ createError }}</Message>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome da empresa</label>
            <InputText v-model="createForm.name" placeholder="Ex.: Supervisão Vistorias" fluid autofocus />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Segmento</label>
            <Select v-model="createForm.segment" :options="segmentOptions" option-label="label" option-value="value" editable fluid />
          </div>
          <Button type="submit" label="Criar empresa" :loading="creating" :disabled="!createForm.name.trim()" class="mt-2" fluid />
        </form>
      </div>
    </Dialog>
  </div>
</template>

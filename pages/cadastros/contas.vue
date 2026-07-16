<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

interface BankAccount {
  id?: string
  bankAccountId?: string
  name: string
  balance?: number
  openingBalance?: number | string
}

const company = useCompanyStore()
const { api } = useApi()

const drawerOpen = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const form = ref({ name: '', openingBalance: null as number | null })
const items = ref<BankAccount[]>([])

const orderedItems = computed(() => [...items.value].sort((a, b) => a.name.localeCompare(b.name)))

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function accountId(account: BankAccount) {
  return account.bankAccountId ?? account.id ?? account.name
}

function accountBalance(account: BankAccount) {
  return Number(account.balance ?? account.openingBalance ?? 0)
}

async function loadItems() {
  if (!company.activeId) return
  loading.value = true
  error.value = null
  try {
    const response = await api<{ items: BankAccount[] }>('/api/bank-accounts', { query: { companyId: company.activeId } })
    items.value = response.items
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar as contas.')
  } finally {
    loading.value = false
  }
}

function openNew() {
  form.value = { name: '', openingBalance: null }
  drawerOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null
  try {
    const response = await api<{ item: BankAccount }>('/api/bank-accounts', {
      method: 'POST',
      body: {
        companyId: company.activeId,
        name: form.value.name,
        openingBalance: form.value.openingBalance ?? 0,
      },
    })
    items.value = [response.item, ...items.value]
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar a conta.')
  } finally {
    saving.value = false
  }
}

watch(() => company.activeId, () => {
  void loadItems()
})

onMounted(() => {
  void loadItems()
})
</script>

<template>
  <div>
    <PageHeader title="Contas Bancárias">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Contas Bancárias' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Nova conta" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <UiTableSkeleton v-if="loading" :rows="6" :columns="4" />

        <DataTable v-else :value="orderedItems" :data-key="accountId" size="small" class="cpek-table">
          <Column field="name" header="Nome" sortable />
          <Column field="balance" header="Saldo atual" style="width:12rem">
            <template #body="{ data }"><span class="tabular-nums font-semibold">{{ brl(accountBalance(data)) }}</span></template>
          </Column>
          <Column header="Status" style="width:8rem">
            <template #body><Tag value="Ativa" severity="success" /></template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-surface-400">Nenhuma conta bancária encontrada.</div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal header="Nova conta bancária" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.name" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Saldo inicial</label>
          <InputNumber v-model="form.openingBalance" mode="currency" currency="BRL" locale="pt-BR" fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button label="Salvar" :loading="saving" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

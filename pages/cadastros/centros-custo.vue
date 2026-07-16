<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

interface CostCenter {
  id: string
  label: string
  costType: 'FIXED' | 'VARIABLE'
  active?: boolean
}

const company = useCompanyStore()
const { api } = useApi()

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const form = ref({ label: '', costType: 'FIXED' as 'FIXED' | 'VARIABLE', active: true })
const items = ref<CostCenter[]>([])

const tipoOptions = [
  { label: 'Fixo', value: 'FIXED' },
  { label: 'Variável', value: 'VARIABLE' },
]

const orderedItems = computed(() => [...items.value].sort((a, b) => a.label.localeCompare(b.label)))

function typeLabel(type: CostCenter['costType']) {
  return type === 'FIXED' ? 'Fixo' : 'Variável'
}

async function loadItems() {
  if (!company.activeId) return
  loading.value = true
  error.value = null
  try {
    const response = await api<{ items: CostCenter[] }>('/api/cost-centers', { query: { companyId: company.activeId } })
    items.value = response.items
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar os centros de custo.')
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = { label: '', costType: 'FIXED', active: true }
  drawerOpen.value = true
}

function openEdit(row: CostCenter) {
  editingId.value = row.id
  form.value = { label: row.label, costType: row.costType, active: row.active !== false }
  drawerOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null
  try {
    const body = { label: form.value.label, costType: form.value.costType, active: form.value.active }
    const response = editingId.value
      ? await api<{ item: CostCenter }>(`/api/cost-centers/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: CostCenter }>('/api/cost-centers', {
          method: 'POST',
          body: { ...body, companyId: company.activeId },
        })

    if (editingId.value) {
      items.value = items.value.map((item) => (item.id === editingId.value ? response.item : item))
    } else {
      items.value = [response.item, ...items.value]
    }
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar o centro de custo.')
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
    <PageHeader title="Centros de Custo">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Centros de Custo' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo centro" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <TableSkeleton v-if="loading" :rows="6" :columns="4" />

        <DataTable v-else :value="orderedItems" data-key="id" size="small" class="cpek-table">
          <Column field="label" header="Nome" sortable />
          <Column field="costType" header="Tipo" style="width:10rem">
            <template #body="{ data }"><Tag :value="typeLabel(data.costType)" :severity="data.costType === 'FIXED' ? 'info' : 'warn'" /></template>
          </Column>
          <Column field="active" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.active === false ? 'Inativo' : 'Ativo'" :severity="data.active === false ? 'secondary' : 'success'" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar centro" @click="openEdit(data)" />
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-surface-400">Nenhum centro de custo encontrado.</div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar centro' : 'Novo centro de custo'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.label" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <Select v-model="form.costType" :options="tipoOptions" option-label="label" option-value="value" fluid />
        </div>
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="form.active" input-id="cost-center-active" />
          <label for="cost-center-active" class="text-sm">Centro ativo</label>
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

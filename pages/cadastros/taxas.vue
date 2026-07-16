<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

interface FeeProfile {
  id: string
  label: string
  feeType: 'PERCENTAGE' | 'FIXED'
  value: number | string
  active?: boolean
}

const company = useCompanyStore()
const { api } = useApi()

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const form = ref({ label: '', feeType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: null as number | null, active: true })
const items = ref<FeeProfile[]>([])

const typeOptions = [
  { label: 'Percentual', value: 'PERCENTAGE' },
  { label: 'Valor fixo', value: 'FIXED' },
]

const orderedItems = computed(() => [...items.value].sort((a, b) => a.label.localeCompare(b.label)))

function typeLabel(type: FeeProfile['feeType']) {
  return type === 'PERCENTAGE' ? 'Percentual' : 'Valor fixo'
}

function valueLabel(item: FeeProfile) {
  const value = Number(item.value)
  if (item.feeType === 'PERCENTAGE') return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function loadItems() {
  if (!company.activeId) return
  loading.value = true
  error.value = null
  try {
    const response = await api<{ items: FeeProfile[] }>('/api/fee-profiles', { query: { companyId: company.activeId } })
    items.value = response.items
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar as taxas.')
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = { label: '', feeType: 'PERCENTAGE', value: null, active: true }
  drawerOpen.value = true
}

function openEdit(row: FeeProfile) {
  editingId.value = row.id
  form.value = { label: row.label, feeType: row.feeType, value: Number(row.value), active: row.active !== false }
  drawerOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null
  try {
    const body = {
      label: form.value.label,
      feeType: form.value.feeType,
      value: form.value.value ?? 0,
      active: form.value.active,
    }
    const response = editingId.value
      ? await api<{ item: FeeProfile }>(`/api/fee-profiles/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: FeeProfile }>('/api/fee-profiles', {
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
    error.value = apiErrorMessage(err, 'Não foi possível salvar a taxa.')
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
    <PageHeader title="Taxas e Juros">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Taxas e Juros' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Nova taxa" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <TableSkeleton v-if="loading" :rows="6" :columns="5" />

        <DataTable v-else :value="orderedItems" data-key="id" size="small" class="cpek-table">
          <Column field="label" header="Nome" sortable />
          <Column field="feeType" header="Tipo" style="width:10rem">
            <template #body="{ data }"><Tag :value="typeLabel(data.feeType)" severity="secondary" /></template>
          </Column>
          <Column field="value" header="Valor" style="width:10rem">
            <template #body="{ data }"><span class="tabular-nums">{{ valueLabel(data) }}</span></template>
          </Column>
          <Column field="active" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.active === false ? 'Inativo' : 'Ativo'" :severity="data.active === false ? 'secondary' : 'success'" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar taxa" @click="openEdit(data)" />
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-surface-400">Nenhuma taxa cadastrada.</div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar taxa' : 'Nova taxa'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome do perfil</label>
          <InputText v-model="form.label" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <Select v-model="form.feeType" :options="typeOptions" option-label="label" option-value="value" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">{{ form.feeType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor fixo' }}</label>
          <InputNumber v-model="form.value" :mode="form.feeType === 'FIXED' ? 'currency' : 'decimal'" currency="BRL" locale="pt-BR" fluid />
        </div>
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="form.active" input-id="fee-active" />
          <label for="fee-active" class="text-sm">Perfil ativo</label>
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

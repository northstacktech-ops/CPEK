<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

type Kind = 'ENTRY' | 'EXIT' | 'CLOSING'
type DataType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'SELECT'

interface CustomField {
  id: string
  kind: Kind
  fieldKey: string
  label: string
  dataType: DataType
  required: boolean
  options?: string[] | null
  order: number
  active?: boolean
}

const company = useCompanyStore()
const { api } = useApi()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const items = ref<CustomField[]>([])

const form = ref({ label: '', dataType: 'TEXT' as DataType, kind: 'ENTRY' as Kind, required: false })

const dataTypeOptions = [
  { label: 'Texto', value: 'TEXT' },
  { label: 'Número', value: 'NUMBER' },
  { label: 'Moeda', value: 'CURRENCY' },
  { label: 'Data', value: 'DATE' },
  { label: 'Lista', value: 'SELECT' },
]
const kindOptions = [
  { label: 'Entrada', value: 'ENTRY' },
  { label: 'Saída', value: 'EXIT' },
  { label: 'Fechamento', value: 'CLOSING' },
]
const kindLabel = (kind: Kind) => kindOptions.find((k) => k.value === kind)?.label ?? kind
const dataTypeLabel = (type: DataType) => dataTypeOptions.find((t) => t.value === type)?.label ?? type

const orderedItems = computed(() => [...items.value].sort((a, b) => a.order - b.order))

function slugify(label: string) {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]+/, '') || 'campo'
}

async function loadItems() {
  if (!company.activeId) return
  loading.value = true
  error.value = null
  try {
    const response = await api<{ items: CustomField[] }>('/api/custom-fields', { query: { companyId: company.activeId } })
    items.value = response.items
  } catch {
    error.value = 'Não foi possível carregar os campos personalizados.'
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = { label: '', dataType: 'TEXT', kind: 'ENTRY', required: false }
  drawerOpen.value = true
}

function openEdit(row: CustomField) {
  editingId.value = row.id
  form.value = { label: row.label, dataType: row.dataType, kind: row.kind, required: row.required }
  drawerOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value || !form.value.label.trim()) return
  saving.value = true
  error.value = null
  try {
    if (editingId.value) {
      const body = { label: form.value.label, dataType: form.value.dataType, required: form.value.required, confirm: true as const }
      const response = await api<{ item: CustomField }>(`/api/custom-fields/${editingId.value}`, { method: 'PATCH', body })
      items.value = items.value.map((item) => (item.id === editingId.value ? { ...item, ...response.item } : item))
    } else {
      const body = {
        companyId: company.activeId,
        kind: form.value.kind,
        fieldKey: slugify(form.value.label),
        label: form.value.label,
        dataType: form.value.dataType,
        required: form.value.required,
      }
      const response = await api<{ item: CustomField }>('/api/custom-fields', { method: 'POST', body })
      items.value = [response.item, ...items.value]
    }
    drawerOpen.value = false
  } catch {
    error.value = 'Não foi possível salvar o campo personalizado.'
  } finally {
    saving.value = false
  }
}

async function deleteItem(id: string) {
  if (!window.confirm('Remover este campo personalizado?')) return
  try {
    await api<{ ok: boolean }>(`/api/custom-fields/${id}`, { method: 'DELETE' })
    items.value = items.value.filter((item) => item.id !== id)
  } catch {
    error.value = 'Não foi possível remover o campo.'
  }
}

watch(() => company.activeId, () => { void loadItems() })
onMounted(() => { void loadItems() })
</script>

<template>
  <div>
    <PageHeader title="Campos Personalizados">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Campos Personalizados' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo campo" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <TableSkeleton v-if="loading" :rows="6" :columns="5" />

        <DataTable v-else :value="orderedItems" data-key="id" size="small" class="cpek-table">
          <Column field="label" header="Nome" sortable />
          <Column field="dataType" header="Tipo" style="width:9rem">
            <template #body="{ data }"><Tag :value="dataTypeLabel(data.dataType)" severity="secondary" /></template>
          </Column>
          <Column field="kind" header="Entidade" style="width:9rem">
            <template #body="{ data }"><Tag :value="kindLabel(data.kind)" severity="info" /></template>
          </Column>
          <Column field="required" header="Obrigatório" style="width:9rem">
            <template #body="{ data }">
              <i :class="data.required ? 'pi pi-check text-green-500' : 'pi pi-minus text-surface-300'" />
            </template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar campo" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Remover campo" @click="deleteItem(data.id)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-surface-400">Nenhum campo personalizado cadastrado.</div>
          </template>
        </DataTable>
      </div>
    </PageContent>
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar campo' : 'Novo campo personalizado'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome do campo</label>
          <InputText v-model="form.label" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo de dado</label>
          <Select v-model="form.dataType" :options="dataTypeOptions" option-label="label" option-value="value" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Entidade</label>
          <Select v-model="form.kind" :options="kindOptions" option-label="label" option-value="value" :disabled="!!editingId" fluid />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Obrigatório</label>
          <ToggleSwitch v-model="form.required" />
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

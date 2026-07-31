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
const showInactive = ref(false)

const form = ref({ label: '', dataType: 'TEXT' as DataType, kind: 'ENTRY' as Kind, required: false, active: true })

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
    const response = await api<{ items: CustomField[] }>('/api/custom-fields', {
      query: { companyId: company.activeId, includeInactive: showInactive.value },
    })
    items.value = response.items
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar os campos personalizados.')
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = { label: '', dataType: 'TEXT', kind: 'ENTRY', required: false, active: true }
  drawerOpen.value = true
}

function openEdit(row: CustomField) {
  editingId.value = row.id
  form.value = { label: row.label, dataType: row.dataType, kind: row.kind, required: row.required, active: row.active !== false }
  drawerOpen.value = true
}

async function save() {
  if (saving.value) return
  if (!company.activeId) {
    error.value = 'Selecione ou crie uma empresa em Configurações antes de criar um campo customizado.'
    return
  }
  if (!form.value.label.trim()) {
    error.value = 'Informe um nome para o campo customizado.'
    return
  }
  saving.value = true
  error.value = null
  try {
    if (editingId.value) {
      const body = {
        label: form.value.label,
        dataType: form.value.dataType,
        required: form.value.required,
        active: form.value.active,
        confirm: true as const,
      }
      const response = await api<{ item: CustomField }>(`/api/custom-fields/${editingId.value}`, { method: 'PATCH', body })
      if (showInactive.value) {
        items.value = items.value.map((item) => (item.id === editingId.value ? { ...item, ...response.item } : item))
      } else {
        items.value = response.item.active === false
          ? items.value.filter((item) => item.id !== editingId.value)
          : items.value.map((item) => (item.id === editingId.value ? { ...item, ...response.item } : item))
      }
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
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar o campo personalizado.')
  } finally {
    saving.value = false
  }
}

async function block(item: CustomField) {
  if (!window.confirm(`Bloquear "${item.label}"? Ele some dos formulários de novos lançamentos, mas o histórico continua íntegro.`)) return
  try {
    const body = { active: false, confirm: true as const }
    await api<{ item: CustomField }>(`/api/custom-fields/${item.id}`, { method: 'PATCH', body })
    if (showInactive.value) {
      items.value = items.value.map((current) => (current.id === item.id ? { ...current, active: false } : current))
    } else {
      items.value = items.value.filter((current) => current.id !== item.id)
    }
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível bloquear o campo.')
  }
}

async function deleteForever(item: CustomField) {
  if (!window.confirm(`Apagar "${item.label}" de vez? Lançamentos antigos continuam mostrando o valor gravado; o campo só some dos formulários novos.`)) return
  try {
    await api<{ ok: boolean }>(`/api/custom-fields/${item.id}`, { method: 'DELETE' })
    items.value = items.value.filter((current) => current.id !== item.id)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível apagar o campo.')
  }
}

watch(() => company.activeId, () => { void loadItems() })
watch(showInactive, () => { void loadItems() })
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

      <div class="col-span-12 flex items-center justify-end gap-2">
        <ToggleSwitch v-model="showInactive" input-id="show-inactive-cf" />
        <label for="show-inactive-cf" class="text-sm text-surface-500">Mostrar bloqueados</label>
      </div>

      <div class="col-span-12">
        <UiTableSkeleton v-if="loading" :rows="6" :columns="6" />

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
          <Column field="active" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.active === false ? 'Inativo' : 'Ativo'" :severity="data.active === false ? 'secondary' : 'success'" /></template>
          </Column>
          <Column header="" style="width:8rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar campo" @click="openEdit(data)" />
                <Button v-if="data.active !== false" icon="pi pi-ban" text rounded size="small" severity="warn" aria-label="Bloquear campo" @click="block(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Apagar campo" @click="deleteForever(data)" />
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
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
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
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="form.active" input-id="custom-field-active" />
          <label for="custom-field-active" class="text-sm">Campo ativo</label>
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

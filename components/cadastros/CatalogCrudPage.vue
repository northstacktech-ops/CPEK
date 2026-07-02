<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../layout/AppBreadcrumb.vue'
import PageContent from '../layout/PageContent.vue'
import PageHeader from '../layout/PageHeader.vue'
import { useCompanyStore } from '../../stores/company'

type CatalogKind = 'PAYMENT_METHOD' | 'SERVICE' | 'STATUS' | 'CATEGORY'

interface CatalogItem {
  id: string
  label: string
  order?: number
  active?: boolean
  dreGroup?: string | null
}

const props = defineProps<{
  title: string
  kind: CatalogKind
  newLabel: string
  showDreGroup?: boolean
}>()

const company = useCompanyStore()
const { api } = useApi()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const dialogOpen = ref(false)
const editingId = ref<string | null>(null)
const items = ref<CatalogItem[]>([])
const form = ref({ label: '', order: 0, dreGroup: 'OPERATING_REVENUE', active: true })

const dreGroupOptions = [
  { label: 'Receita operacional', value: 'OPERATING_REVENUE' },
  { label: 'Custo operacional', value: 'OPERATING_COST' },
  { label: 'Despesas operacionais', value: 'OPERATING_EXPENSE' },
  { label: 'Outras receitas', value: 'OTHER_REVENUE' },
  { label: 'Investimentos', value: 'INVESTING' },
  { label: 'Financiamentos', value: 'FINANCING' },
]

const orderedItems = computed(() =>
  [...items.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label)),
)

function dreGroupLabel(value?: string | null) {
  return dreGroupOptions.find((option) => option.value === value)?.label ?? '-'
}

async function loadItems() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const response = await api<{ items: CatalogItem[] }>('/api/catalogs', {
      query: { companyId: company.activeId, kind: props.kind },
    })
    items.value = response.items
  } catch {
    error.value = 'Não foi possível carregar os cadastros.'
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = { label: '', order: items.value.length + 1, dreGroup: 'OPERATING_REVENUE', active: true }
  dialogOpen.value = true
}

function openEdit(item: CatalogItem) {
  editingId.value = item.id
  form.value = {
    label: item.label,
    order: item.order ?? 0,
    dreGroup: item.dreGroup ?? 'OPERATING_REVENUE',
    active: item.active !== false,
  }
  dialogOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null

  try {
    const body = {
      label: form.value.label,
      order: form.value.order,
      active: form.value.active,
      ...(props.showDreGroup ? { dreGroup: form.value.dreGroup } : {}),
    }
    const response = editingId.value
      ? await api<{ item: CatalogItem }>(`/api/catalogs/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: CatalogItem }>('/api/catalogs', {
          method: 'POST',
          body: { ...body, companyId: company.activeId, kind: props.kind },
        })

    if (editingId.value) {
      items.value = items.value.map((item) => (item.id === editingId.value ? response.item : item))
    } else {
      items.value = [response.item, ...items.value]
    }
    dialogOpen.value = false
  } catch {
    error.value = 'Não foi possível salvar o cadastro.'
  } finally {
    saving.value = false
  }
}

async function remove(item: CatalogItem) {
  if (!window.confirm(`Desativar "${item.label}"?`)) return
  try {
    await api<{ ok: boolean }>(`/api/catalogs/${item.id}`, { method: 'DELETE' })
    items.value = items.value.map((current) => (current.id === item.id ? { ...current, active: false } : current))
  } catch {
    error.value = 'Não foi possível desativar o cadastro.'
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
    <PageHeader :title="title">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: title }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" :label="newLabel" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <TableSkeleton v-if="loading" :rows="6" :columns="4" />

        <DataTable v-else :value="orderedItems" data-key="id" size="small" class="cpek-table">
          <Column field="label" header="Nome" sortable />
          <Column v-if="showDreGroup" field="dreGroup" header="Grupo DRE" sortable style="width:15rem">
            <template #body="{ data }">{{ dreGroupLabel(data.dreGroup) }}</template>
          </Column>
          <Column field="order" header="Ordem" sortable style="width:7rem" />
          <Column field="active" header="Status" style="width:8rem">
            <template #body="{ data }">
              <Tag :value="data.active === false ? 'Inativo' : 'Ativo'" :severity="data.active === false ? 'secondary' : 'success'" />
            </template>
          </Column>
          <Column header="" style="width:6rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar" @click="openEdit(data)" />
                <Button icon="pi pi-ban" text rounded size="small" severity="danger" aria-label="Desativar" @click="remove(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-sm text-surface-400">Nenhum cadastro encontrado.</div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="dialogOpen" modal :header="editingId ? 'Editar cadastro' : newLabel" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.label" fluid />
        </div>
        <div v-if="showDreGroup" class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Grupo DRE</label>
          <Select v-model="form.dreGroup" :options="dreGroupOptions" option-label="label" option-value="value" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Ordem</label>
          <InputNumber v-model="form.order" :min="0" fluid />
        </div>
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="form.active" input-id="catalog-active" />
          <label for="catalog-active" class="text-sm">Cadastro ativo</label>
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="dialogOpen = false" />
          <Button label="Salvar" :loading="saving" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

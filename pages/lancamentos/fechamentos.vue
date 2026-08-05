<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import CustomFieldsFields from '../../components/lancamentos/CustomFieldsFields.vue'
import { useCompanyStore } from '../../stores/company'

interface NamedOption {
  id: string
  label?: string
  name?: string
  active?: boolean
}

interface CustomFieldOption {
  fieldKey: string
  label: string
  active?: boolean
}

interface CustomSnapshotItem {
  fieldKey: string
  value: unknown
  _label: string
  _type: string
}

interface ClosingRecord {
  id: string
  cliente?: string
  valor?: number | string
  vencimento?: string
  recebimento?: string
  status?: string
  valorFechamento?: number | string
  descricao?: string | null
  documentoNf?: string | null
  dataFechamento?: string | null
  dataVencPrev?: string | null
  dataRecebimento?: string | null
  contactId?: string | null
  categoryId?: string | null
  statusId?: string | null
  customSnapshot?: unknown
}

interface ClosingRow {
  id: string
  cliente: string
  valor: number
  vencimento: string
  recebimento: string
  status: string
  raw: ClosingRecord
}

const company = useCompanyStore()
const { api } = useApi()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const statusFilter = ref<string | null>(null)
const notaFiscalFilter = ref<string | null>(null)
const notaFiscalOptions = ['Com nota fiscal', 'Sem nota fiscal']
const dateFrom = ref<Date | null>(null)
const dateTo = ref<Date | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

// Paginação real, resolvida no servidor — busca/status/nota fiscal/data também
// vão pro servidor, senão a paginação escondia lançamentos de novo (só a
// página carregada era vasculhada).
const page = ref(1)
const pageSize = 50
const total = ref(0)

const closings = ref<ClosingRow[]>([])
const clients = ref<NamedOption[]>([])
const categories = ref<NamedOption[]>([])
const statuses = ref<NamedOption[]>([])
const customFieldDefs = ref<CustomFieldOption[]>([])
const displayField = ref<string | null>(null)

const form = ref({
  cliente: null as string | null,
  categoria: null as string | null,
  descricao: '',
  documentoNf: '',
  valor: null as number | null,
  fechamento: new Date() as Date | null,
  vencimento: new Date() as Date | null,
  recebimento: null as Date | null,
  status: 'Em Aberto',
  custom: {} as Record<string, unknown>,
})

// Listas completas trazem inativos (pra resolver rótulo de lançamentos antigos
// via labelOf/optionIdByLabel) — mas cadastro bloqueado não pode virar opção nova.
const statusOptions = computed(() => statuses.value.filter((item) => item.active !== false).map(labelOf))
const clienteOptions = computed(() => clients.value.filter((item) => item.active !== false).map(labelOf))
const categoriaOptions = computed(() => categories.value.filter((item) => item.active !== false).map(labelOf))
const statusSeverity: Record<string, string> = { Recebido: 'success', Pago: 'success', 'Em Aberto': 'info', Vencido: 'danger', Cancelado: 'secondary' }

const displayFieldOptions = computed(() => customFieldDefs.value.map((f) => ({ value: f.fieldKey, label: f.label })))
const displayFieldLabel = computed(() => displayFieldOptions.value.find((o) => o.value === displayField.value)?.label ?? 'Campo personalizado')

function labelOf(item: NamedOption) {
  return item.label ?? item.name ?? ''
}

function optionIdByLabel(list: NamedOption[], label: string | null) {
  if (!label) return null
  return list.find((item) => labelOf(item) === label)?.id ?? null
}

function labelById(list: NamedOption[], id: string | null | undefined) {
  if (!id) return ''
  const match = list.find((item) => item.id === id)
  return match ? labelOf(match) : ''
}

function customColumnValue(closing: ClosingRecord): string {
  const snapshot = Array.isArray(closing.customSnapshot) ? (closing.customSnapshot as CustomSnapshotItem[]) : []
  const item = snapshot.find((s) => s.fieldKey === displayField.value)
  if (!item || item.value == null || item.value === '') return '-'
  if (item._type === 'CURRENCY') return brl(Number(item.value))
  if (item._type === 'DATE') return formatDate(item.value as string)
  return String(item.value)
}

function customSnapshotToRecord(snapshot: unknown): Record<string, unknown> {
  if (!Array.isArray(snapshot)) return {}
  const record: Record<string, unknown> = {}
  for (const item of snapshot) {
    if (item && typeof item === 'object' && 'fieldKey' in item) {
      record[(item as { fieldKey: string }).fieldKey] = (item as { value: unknown }).value
    }
  }
  return record
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR')
}

function statusFromClosing(closing: ClosingRecord) {
  const persisted = labelById(statuses.value, closing.statusId)
  if (persisted) return persisted
  if (closing.dataRecebimento) return 'Recebido'
  if (closing.dataVencPrev && new Date(closing.dataVencPrev) < new Date()) return 'Vencido'
  return 'Em Aberto'
}

function normalizeClosing(closing: ClosingRecord): ClosingRow {
  return {
    id: closing.id,
    cliente: (closing.cliente ?? labelById(clients.value, closing.contactId)) || 'Sem cliente',
    valor: Number(closing.valor ?? closing.valorFechamento ?? 0),
    vencimento: closing.vencimento ?? formatDate(closing.dataVencPrev),
    recebimento: closing.recebimento ?? formatDate(closing.dataRecebimento),
    status: statusFromClosing(closing),
    raw: closing,
  }
}

async function loadReferences() {
  if (!company.activeId) return
  const [clientRes, categoryRes, statusRes, customFieldRes] = await Promise.all([
    api<{ items: NamedOption[] }>('/api/contacts', { query: { companyId: company.activeId, type: 'CLIENT', includeInactive: true } }),
    api<{ items: NamedOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'CATEGORY', includeInactive: true } }),
    api<{ items: NamedOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'STATUS', includeInactive: true } }),
    api<{ items: CustomFieldOption[] }>('/api/custom-fields', { query: { companyId: company.activeId, kind: 'CLOSING', includeInactive: true } }),
  ])

  clients.value = clientRes.items
  categories.value = categoryRes.items
  statuses.value = statusRes.items
  customFieldDefs.value = customFieldRes.items.filter((f) => f.active !== false)
  if (!displayField.value && customFieldDefs.value.length) displayField.value = customFieldDefs.value[0].fieldKey
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

async function loadClosings() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const statusId = optionIdByLabel(statuses.value, statusFilter.value)
    const response = await api<{ items: ClosingRecord[]; total: number }>('/api/closings', {
      query: {
        companyId: company.activeId,
        page: page.value,
        pageSize,
        ...(search.value.trim() ? { q: search.value.trim() } : {}),
        ...(statusId ? { statusId } : {}),
        ...(notaFiscalFilter.value ? { notaFiscal: notaFiscalFilter.value === 'Com nota fiscal' ? 'true' : 'false' } : {}),
        ...(dateFrom.value ? { from: dateFrom.value.toISOString() } : {}),
        ...(dateTo.value ? { to: endOfDay(dateTo.value).toISOString() } : {}),
      },
    })
    closings.value = response.items.map(normalizeClosing)
    total.value = response.total
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar os fechamentos.')
  } finally {
    loading.value = false
  }
}

function onPage(event: { page: number }) {
  page.value = event.page + 1
  void loadClosings()
}

let searchDebounce: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    void loadClosings()
  }, 400)
})

watch([statusFilter, notaFiscalFilter, dateFrom, dateTo], () => {
  page.value = 1
  void loadClosings()
})

function resetForm() {
  form.value = {
    cliente: null,
    categoria: null,
    descricao: '',
    documentoNf: '',
    valor: null,
    fechamento: new Date(),
    vencimento: new Date(),
    recebimento: null,
    status: 'Em Aberto',
    custom: {},
  }
}

function openNew() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(row: ClosingRow) {
  editingId.value = row.id
  form.value = {
    cliente: row.cliente === 'Sem cliente' ? null : row.cliente,
    categoria: labelById(categories.value, row.raw.categoryId) || null,
    descricao: row.raw.descricao ?? '',
    documentoNf: row.raw.documentoNf ?? '',
    valor: row.valor,
    fechamento: row.raw.dataFechamento ? new Date(row.raw.dataFechamento) : new Date(),
    vencimento: row.raw.dataVencPrev ? new Date(row.raw.dataVencPrev) : new Date(),
    recebimento: row.raw.dataRecebimento ? new Date(row.raw.dataRecebimento) : null,
    status: row.status,
    custom: customSnapshotToRecord(row.raw.customSnapshot),
  }
  drawerOpen.value = true
}

async function save() {
  if (saving.value) return
  if (!company.activeId) {
    error.value = 'Selecione ou crie uma empresa em Configurações antes de registrar um fechamento.'
    return
  }
  saving.value = true
  error.value = null

  try {
    const receivedDate = form.value.status === 'Recebido'
      ? (form.value.recebimento ?? new Date())
      : (form.value.recebimento ?? null)
    const body = {
      contactId: optionIdByLabel(clients.value, form.value.cliente),
      categoryId: optionIdByLabel(categories.value, form.value.categoria),
      statusId: optionIdByLabel(statuses.value, form.value.status),
      valorFechamento: form.value.valor ?? 0,
      // null (não undefined) quando o campo foi limpo: undefined = "não mexer" no PATCH,
      // e ficaria com o valor antigo preso no banco em vez de apagar de verdade.
      descricao: form.value.descricao || null,
      documentoNf: form.value.documentoNf || null,
      dataFechamento: form.value.fechamento?.toISOString(),
      dataVencPrev: form.value.vencimento?.toISOString(),
      dataRecebimento: receivedDate ? receivedDate.toISOString() : null,
      custom: form.value.custom,
    }

    const response = editingId.value
      ? await api<{ item: ClosingRecord }>(`/api/closings/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: ClosingRecord }>('/api/closings', {
          method: 'POST',
          body: { ...body, companyId: company.activeId },
        })

    const displayRecord: ClosingRecord = {
      ...response.item,
      id: response.item.id,
      cliente: form.value.cliente ?? 'Sem cliente',
      valor: form.value.valor ?? 0,
      vencimento: formatDate(form.value.vencimento),
      recebimento: formatDate(receivedDate),
      status: form.value.status,
      dataRecebimento: receivedDate?.toISOString() ?? null,
    }
    const normalized = normalizeClosing(displayRecord)

    if (editingId.value) {
      closings.value = closings.value.map((closing) => (closing.id === editingId.value ? normalized : closing))
    } else {
      closings.value = [normalized, ...closings.value]
    }
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar o fechamento.')
  } finally {
    saving.value = false
  }
}

async function deleteClosing(id: string) {
  if (!window.confirm('Excluir este fechamento?')) return
  try {
    await api<{ ok: boolean }>(`/api/closings/${id}`, { method: 'DELETE' })
    closings.value = closings.value.filter((closing) => closing.id !== id)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível excluir o fechamento.')
  }
}

function exportCSV() {
  const headers = [
    'Data do fechamento', 'Vencimento previsto', 'Data de recebimento', 'Cliente', 'Categoria',
    'Valor do fechamento', 'Nota fiscal', 'Documento NF', 'Status', 'Descrição',
    ...customFieldDefs.value.map((f) => f.label),
  ]
  const rows: string[][] = [headers]
  closings.value.forEach((closing) => {
    const raw = closing.raw
    const snapshot = Array.isArray(raw.customSnapshot) ? (raw.customSnapshot as CustomSnapshotItem[]) : []
    const customValues = customFieldDefs.value.map((f) => {
      const item = snapshot.find((s) => s.fieldKey === f.fieldKey)
      if (!item || item.value == null || item.value === '') return ''
      if (item._type === 'CURRENCY') return brl(Number(item.value))
      if (item._type === 'DATE') return formatDate(item.value as string)
      return String(item.value)
    })
    rows.push([
      formatDate(raw.dataFechamento),
      formatDate(raw.dataVencPrev),
      formatDate(raw.dataRecebimento),
      closing.cliente,
      labelById(categories.value, raw.categoryId) || '-',
      brl(Number(raw.valorFechamento ?? closing.valor ?? 0)),
      raw.documentoNf ? 'Sim' : 'Não',
      raw.documentoNf ?? '',
      closing.status,
      raw.descricao ?? '',
      ...customValues,
    ])
  })
  // Excel pt-BR: separador ';', BOM UTF-8 e CRLF (senão abre tudo numa coluna).
  const csv = '﻿' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  anchor.download = 'fechamentos.csv'
  anchor.click()
}

watch(() => company.activeId, () => {
  page.value = 1
  void loadReferences()
  void loadClosings()
})

onMounted(() => {
  void loadReferences()
  void loadClosings()
})
</script>

<template>
  <div>
    <PageHeader title="Lançamentos">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Lançamentos' }, { label: 'Fechamentos' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-download" label="Exportar CSV" severity="secondary" outlined size="small" @click="exportCSV" />
        <Button icon="pi pi-plus" label="Novo fechamento" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <div class="mb-4 flex gap-1 border-b border-surface-200 dark:border-surface-800">
      <NuxtLink to="/lancamentos/entradas" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Entradas</NuxtLink>
      <NuxtLink to="/lancamentos/saidas" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Saídas</NuxtLink>
      <NuxtLink to="/lancamentos/fechamentos" class="border-b-2 border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600">Fechamentos</NuxtLink>
    </div>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
          <IconField class="w-full md:w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar cliente ou nota fiscal..." size="small" fluid />
          </IconField>
          <Select v-model="statusFilter" :options="statusOptions" placeholder="Status" show-clear size="small" class="w-full md:w-40" />
          <Select v-model="notaFiscalFilter" :options="notaFiscalOptions" placeholder="Nota fiscal" show-clear size="small" class="w-full md:w-44" />
          <DatePicker v-model="dateFrom" placeholder="De" date-format="dd/mm/yy" show-icon show-clear size="small" class="w-full md:w-36" />
          <DatePicker v-model="dateTo" placeholder="Até" date-format="dd/mm/yy" show-icon show-clear size="small" class="w-full md:w-36" />
          <Select
            v-model="displayField"
            :options="displayFieldOptions"
            option-label="label"
            option-value="value"
            placeholder="Campo personalizado"
            size="small"
            class="w-full md:w-52"
          />
        </div>

        <UiTableSkeleton v-if="loading" :rows="6" :columns="7" />

        <DataTable
          v-else
          :value="closings"
          data-key="id"
          lazy
          paginator
          :rows="pageSize"
          :total-records="total"
          :first="(page - 1) * pageSize"
          size="small"
          class="cpek-table"
          @page="onPage"
        >
          <Column field="cliente" header="Cliente" />
          <Column field="valor" header="Valor" style="width:10rem">
            <template #body="{ data }"><span class="font-semibold tabular-nums">{{ brl(data.valor) }}</span></template>
          </Column>
          <Column field="vencimento" header="Vencimento previsto" style="width:12rem" />
          <Column field="recebimento" header="Data recebimento" style="width:12rem">
            <template #body="{ data }">
              <span :class="data.recebimento ? 'text-surface-700 dark:text-surface-200' : 'text-surface-400'">
                {{ data.recebimento || '-' }}
              </span>
            </template>
          </Column>
          <Column header="Nota Fiscal" style="width:9rem">
            <template #body="{ data }">
              <div class="flex flex-col gap-0.5">
                <Tag
                  :value="data.raw.documentoNf ? 'Emitida' : 'Sem NF'"
                  :severity="data.raw.documentoNf ? 'success' : 'secondary'"
                />
                <span v-if="data.raw.documentoNf?.trim()" class="text-xs text-surface-400">
                  {{ data.raw.documentoNf }}
                </span>
              </div>
            </template>
          </Column>
          <Column v-if="displayField" :header="displayFieldLabel" style="width:9rem">
            <template #body="{ data }">
              <span class="text-sm text-surface-600 dark:text-surface-300">{{ customColumnValue(data.raw) }}</span>
            </template>
          </Column>
          <Column field="status" header="Status" style="width:9rem">
            <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status] ?? 'secondary'" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar fechamento" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Excluir fechamento" @click="deleteClosing(data.id)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-file-check mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhum fechamento encontrado</p>
              <p class="mt-1 text-xs text-surface-400">Clique em "Novo fechamento" para registrar.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar fechamento' : 'Novo fechamento'" class="!w-[640px] !max-w-[96vw]" :draggable="false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small" class="md:col-span-2">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Cliente</label>
          <Select v-model="form.cliente" :options="clienteOptions" placeholder="Selecione o cliente" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Categoria</label>
          <Select v-model="form.categoria" :options="categoriaOptions" placeholder="Selecione a categoria" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Valor do fechamento</label>
          <InputNumber v-model="form.valor" mode="currency" currency="BRL" locale="pt-BR" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data do fechamento</label>
          <DatePicker v-model="form.fechamento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Vencimento previsto</label>
          <DatePicker v-model="form.vencimento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data de recebimento</label>
          <DatePicker v-model="form.recebimento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Status</label>
          <Select v-model="form.status" :options="statusOptions" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Documento (NF)</label>
          <InputText v-model="form.documentoNf" placeholder="Nº da nota fiscal / documento" fluid />
        </div>
        <CustomFieldsFields :company-id="company.activeId" kind="CLOSING" v-model="form.custom" />
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Descrição</label>
          <Textarea v-model="form.descricao" rows="3" fluid />
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'
import { usePeriodStore } from '../../stores/period'

interface CatalogOption {
  id: string
  label: string
  active?: boolean
}

interface ContactOption {
  id: string
  name: string
  active?: boolean
}

interface AccountOption {
  id?: string
  bankAccountId?: string
  name: string
}

interface EntryRecord {
  id: string
  data?: string
  cliente?: string
  servico?: string
  status?: string
  valor?: number | string
  valorServico?: number | string
  deslocamento?: number | string
  dataServico?: string | null
  dataPagamento?: string | null
  bankAccountId?: string | null
  contactId?: string | null
  serviceId?: string | null
  categoryId?: string | null
  statusId?: string | null
  feeProfileId?: string | null
  anotacoes?: string | null
}

interface EntryRow {
  id: string
  data: string
  cliente: string
  servico: string
  valor: number
  deslocamento: number
  status: string
  raw: EntryRecord
}

const company = useCompanyStore()
const period = usePeriodStore()
const { api } = useApi()
const { ensure } = usePeriod()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const statusFilter = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const services = ref<CatalogOption[]>([])
const categories = ref<CatalogOption[]>([])
const statuses = ref<CatalogOption[]>([])
const accounts = ref<AccountOption[]>([])
const clients = ref<ContactOption[]>([])
const entries = ref<EntryRow[]>([])

const form = ref({
  valor: null as number | null,
  jaRecebido: false,
  dataRecebimento: null as Date | null,
  descricao: '',
  categoria: null as string | null,
  conta: null as string | null,
  dataCompetencia: new Date() as Date | null,
  cliente: null as string | null,
  taxa: null as string | null,
  servico: null as string | null,
  deslocamento: null as number | null,
  status: 'Em Aberto',
})

const fallbackStatusOptions = ['Em Aberto', 'Pago', 'Vencido', 'Cancelado']
const statusOptions = computed(() => unique([...statuses.value.map((item) => item.label), ...fallbackStatusOptions]))
const servicoOptions = computed(() => services.value.map((item) => item.label))
const categoriaOptions = computed(() => categories.value.map((item) => item.label))
const contaOptions = computed(() => accounts.value.map((item) => item.name))
const clienteOptions = computed(() => clients.value.map((item) => item.name))

const statusSeverity: Record<string, string> = {
  Pago: 'success',
  Recebido: 'success',
  'Em Aberto': 'info',
  Vencido: 'danger',
  Cancelado: 'secondary',
}

const filtered = computed(() => {
  let result = entries.value
  if (statusFilter.value) result = result.filter((entry) => entry.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) result = result.filter((entry) => `${entry.cliente} ${entry.servico} ${entry.status}`.toLowerCase().includes(q))
  return result
})

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function optionIdByLabel(list: Array<CatalogOption | ContactOption | AccountOption>, label: string | null) {
  if (!label) return undefined
  const match = list.find((item) => ('label' in item ? item.label : item.name) === label)
  if (!match) return undefined
  return 'bankAccountId' in match ? (match.bankAccountId ?? match.id) : match.id
}

function labelById(list: Array<CatalogOption | ContactOption | AccountOption>, id: string | null | undefined) {
  if (!id) return ''
  const match = list.find((item) => ('bankAccountId' in item ? item.bankAccountId === id || item.id === id : item.id === id))
  return match ? ('label' in match ? match.label : match.name) : ''
}

function statusFromEntry(entry: EntryRecord) {
  if (entry.status) return entry.status
  if (entry.dataPagamento) return 'Pago'
  if (entry.dataServico && new Date(entry.dataServico) < new Date()) return 'Vencido'
  return 'Em Aberto'
}

function normalizeEntry(entry: EntryRecord): EntryRow {
  return {
    id: entry.id,
    data: entry.data ?? formatDate(entry.dataServico),
    cliente: (entry.cliente ?? labelById(clients.value, entry.contactId)) || 'Sem cliente',
    servico: (entry.servico ?? labelById(services.value, entry.serviceId)) || 'Sem serviço',
    valor: Number(entry.valor ?? entry.valorServico ?? 0),
    deslocamento: Number(entry.deslocamento ?? 0),
    status: statusFromEntry(entry),
    raw: entry,
  }
}

async function loadEntries() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const [currentPeriod, serviceRes, categoryRes, statusRes, accountRes, clientRes] = await Promise.all([
      ensure(company.activeId),
      api<{ items: CatalogOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'SERVICE' } }),
      api<{ items: CatalogOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'CATEGORY' } }),
      api<{ items: CatalogOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'STATUS' } }),
      api<{ items: AccountOption[] }>('/api/bank-accounts', { query: { companyId: company.activeId } }),
      api<{ items: ContactOption[] }>('/api/contacts', { query: { companyId: company.activeId, type: 'CLIENT' } }),
    ])

    services.value = serviceRes.items
    categories.value = categoryRes.items
    statuses.value = statusRes.items
    accounts.value = accountRes.items
    clients.value = clientRes.items

    const response = await api<{ items: EntryRecord[] }>('/api/entries', {
      query: { companyId: company.activeId, periodId: currentPeriod.id },
    })
    entries.value = response.items.map(normalizeEntry)
  } catch {
    error.value = 'Não foi possível carregar as entradas.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    valor: null,
    jaRecebido: false,
    dataRecebimento: null,
    descricao: '',
    categoria: null,
    conta: null,
    dataCompetencia: new Date(),
    cliente: null,
    taxa: null,
    servico: null,
    deslocamento: null,
    status: 'Em Aberto',
  }
}

function openNew() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(row: EntryRow) {
  editingId.value = row.id
  form.value = {
    valor: row.valor,
    jaRecebido: Boolean(row.raw.dataPagamento) || row.status === 'Pago',
    dataRecebimento: row.raw.dataPagamento ? new Date(row.raw.dataPagamento) : null,
    descricao: row.raw.anotacoes ?? '',
    categoria: labelById(categories.value, row.raw.categoryId) || null,
    conta: labelById(accounts.value, row.raw.bankAccountId) || null,
    dataCompetencia: row.raw.dataServico ? new Date(row.raw.dataServico) : new Date(),
    cliente: row.cliente === 'Sem cliente' ? null : row.cliente,
    taxa: null,
    servico: row.servico === 'Sem serviço' ? null : row.servico,
    deslocamento: row.deslocamento,
    status: row.status,
  }
  drawerOpen.value = true
}

async function saveEntry() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null

  try {
    const currentPeriod = await ensure(company.activeId)
    const receivedDate = form.value.jaRecebido || form.value.status === 'Pago'
      ? (form.value.dataRecebimento ?? new Date())
      : undefined
    const body = {
      bankAccountId: optionIdByLabel(accounts.value, form.value.conta),
      contactId: optionIdByLabel(clients.value, form.value.cliente),
      serviceId: optionIdByLabel(services.value, form.value.servico),
      categoryId: optionIdByLabel(categories.value, form.value.categoria),
      statusId: optionIdByLabel(statuses.value, form.value.status),
      valorServico: form.value.valor ?? 0,
      deslocamento: form.value.deslocamento ?? 0,
      dataServico: form.value.dataCompetencia?.toISOString(),
      dataPagamento: receivedDate?.toISOString(),
      anotacoes: form.value.descricao || undefined,
    }

    const response = editingId.value
      ? await api<{ item: EntryRecord }>(`/api/entries/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: EntryRecord }>('/api/entries', {
          method: 'POST',
          body: { ...body, companyId: company.activeId, periodId: currentPeriod.id },
        })

    const displayRecord: EntryRecord = {
      ...response.item,
      id: response.item.id,
      data: formatDate(form.value.dataCompetencia),
      cliente: form.value.cliente ?? 'Sem cliente',
      servico: form.value.servico ?? 'Sem serviço',
      valor: form.value.valor ?? 0,
      deslocamento: form.value.deslocamento ?? 0,
      status: form.value.status,
      dataPagamento: receivedDate?.toISOString() ?? null,
    }
    const normalized = normalizeEntry(displayRecord)

    if (editingId.value) {
      entries.value = entries.value.map((entry) => (entry.id === editingId.value ? normalized : entry))
    } else {
      entries.value = [normalized, ...entries.value]
    }
    drawerOpen.value = false
  } catch {
    error.value = 'Não foi possível salvar a entrada.'
  } finally {
    saving.value = false
  }
}

async function deleteEntry(id: string) {
  if (!window.confirm('Excluir esta entrada?')) return
  try {
    await api<{ ok: boolean }>(`/api/entries/${id}`, { method: 'DELETE' })
    entries.value = entries.value.filter((entry) => entry.id !== id)
  } catch {
    error.value = 'Não foi possível excluir a entrada.'
  }
}

function exportCSV() {
  const rows = [['Data', 'Cliente', 'Serviço', 'Valor', 'Deslocamento', 'Status']]
  filtered.value.forEach((entry) => rows.push([entry.data, entry.cliente, entry.servico, String(entry.valor), String(entry.deslocamento), entry.status]))
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  anchor.download = 'entradas.csv'
  anchor.click()
}

watch(() => company.activeId, () => {
  void loadEntries()
})

watch(() => [period.month, period.year], () => {
  void loadEntries()
})

onMounted(() => {
  void loadEntries()
})
</script>

<template>
  <div>
    <PageHeader title="Lançamentos">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Lançamentos' }, { label: 'Entradas' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-download" label="Exportar CSV" severity="secondary" outlined size="small" @click="exportCSV" />
        <Button icon="pi pi-plus" label="Nova entrada" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <div class="mb-4 flex gap-1 border-b border-surface-200 dark:border-surface-800">
      <NuxtLink to="/lancamentos/entradas" class="border-b-2 border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600">Entradas</NuxtLink>
      <NuxtLink to="/lancamentos/saidas" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Saídas</NuxtLink>
      <NuxtLink to="/lancamentos/fechamentos" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Fechamentos</NuxtLink>
    </div>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
          <IconField class="w-full md:w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar cliente, serviço..." size="small" fluid />
          </IconField>
          <Select v-model="statusFilter" :options="statusOptions" placeholder="Status" show-clear size="small" class="w-full md:w-40" />
        </div>

        <TableSkeleton v-if="loading" :rows="6" :columns="7" />

        <DataTable
          v-else
          :value="filtered"
          data-key="id"
          paginator
          :rows="8"
          size="small"
          sort-field="data"
          :sort-order="-1"
          class="cpek-table"
        >
          <Column field="data" header="Data" sortable style="width:9rem" />
          <Column field="cliente" header="Cliente" sortable />
          <Column field="servico" header="Serviço" sortable style="width:10rem">
            <template #body="{ data }">
              <Tag :value="data.servico" severity="secondary" />
            </template>
          </Column>
          <Column field="valor" header="Valor" sortable style="width:9rem">
            <template #body="{ data }">
              <span class="font-semibold tabular-nums">{{ brl(data.valor) }}</span>
            </template>
          </Column>
          <Column field="deslocamento" header="Desloc." sortable style="width:8rem">
            <template #body="{ data }">
              <span class="tabular-nums text-surface-500">{{ brl(data.deslocamento) }}</span>
            </template>
          </Column>
          <Column field="status" header="Status" sortable style="width:9rem">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity[data.status] ?? 'secondary'" />
            </template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex items-center justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar entrada" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Excluir entrada" @click="deleteEntry(data.id)" />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-inbox mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhuma entrada neste período</p>
              <p class="mt-1 text-xs text-surface-400">Clique em "Nova entrada" para registrar.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog
      v-model:visible="drawerOpen"
      modal
      :header="editingId ? 'Editar entrada' : 'Conta a receber'"
      class="!w-[720px] !max-w-[96vw]"
      :draggable="false"
    >
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="saveEntry">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Valor do recebimento</label>
          <InputNumber v-model="form.valor" mode="currency" currency="BRL" locale="pt-BR" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data de competência</label>
          <DatePicker v-model="form.dataCompetencia" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Cliente</label>
          <Select v-model="form.cliente" :options="clienteOptions" placeholder="Selecione o cliente" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Serviço</label>
          <Select v-model="form.servico" :options="servicoOptions" placeholder="Selecione o serviço" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Categoria</label>
          <Select v-model="form.categoria" :options="categoriaOptions" placeholder="Selecione a categoria" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Conta bancária</label>
          <Select v-model="form.conta" :options="contaOptions" placeholder="Selecione a conta" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Deslocamento</label>
          <InputNumber v-model="form.deslocamento" mode="currency" currency="BRL" locale="pt-BR" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Status</label>
          <Select v-model="form.status" :options="statusOptions" fluid />
        </div>
        <div class="flex items-center gap-2 md:col-span-2">
          <Checkbox v-model="form.jaRecebido" binary input-id="ja-recebido" />
          <label for="ja-recebido" class="cursor-pointer text-sm">Já foi recebido</label>
        </div>
        <div v-if="form.jaRecebido" class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data do recebimento</label>
          <DatePicker v-model="form.dataRecebimento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Descrição</label>
          <Textarea v-model="form.descricao" rows="3" fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button :label="editingId ? 'Salvar' : 'Adicionar'" :loading="saving" fluid @click="saveEntry" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

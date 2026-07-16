<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'
import { usePeriodStore } from '../../stores/period'

interface NamedOption {
  id: string
  label?: string
  name?: string
  costType?: string
}

interface ExitRecord {
  id: string
  data?: string
  fornecedor?: string
  categoria?: string
  centroCusto?: string
  vencimento?: string
  status?: string
  valor?: number | string
  valorDespesa?: number | string
  descricao?: string | null
  anotacoes?: string | null
  documentoNf?: string | null
  dataLancamento?: string | null
  dataVencimento?: string | null
  dataPagamento?: string | null
  bankAccountId?: string | null
  contactId?: string | null
  categoryId?: string | null
  costCenterId?: string | null
  paymentId?: string | null
}

interface ExitRow {
  id: string
  data: string
  fornecedor: string
  categoria: string
  centroCusto: string
  valor: number
  vencimento: string
  status: string
  raw: ExitRecord
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
const centroCustoFilter = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const exits = ref<ExitRow[]>([])
const categories = ref<NamedOption[]>([])
const suppliers = ref<NamedOption[]>([])
const accounts = ref<NamedOption[]>([])
const costCenters = ref<NamedOption[]>([])
const payments = ref<NamedOption[]>([])

const form = ref({
  valor: null as number | null,
  jaPago: false,
  dataPagamento: null as Date | null,
  descricao: '',
  anotacoes: '',
  documentoNf: '',
  formaPagamento: null as string | null,
  categoria: null as string | null,
  conta: null as string | null,
  dataCompetencia: new Date() as Date | null,
  dataVencimento: new Date() as Date | null,
  fornecedor: null as string | null,
  centroCusto: null as string | null,
  status: 'Em Aberto',
})

const statusOptions = ['Em Aberto', 'Pago', 'Vencido', 'Cancelado']
const categoriaOptions = computed(() => categories.value.map(labelOf))
const fornecedorOptions = computed(() => suppliers.value.map(labelOf))
const contaOptions = computed(() => accounts.value.map(labelOf))
const centroCustoOptions = computed(() => costCenters.value.map(labelOf))
const pagamentoOptions = computed(() => payments.value.map(labelOf))
const statusSeverity: Record<string, string> = { Pago: 'success', 'Em Aberto': 'info', Vencido: 'danger', Cancelado: 'secondary' }

const filtered = computed(() => {
  let result = exits.value
  if (statusFilter.value) result = result.filter((exit) => exit.status === statusFilter.value)
  if (centroCustoFilter.value) result = result.filter((exit) => exit.centroCusto === centroCustoFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) result = result.filter((exit) => `${exit.fornecedor} ${exit.categoria} ${exit.status}`.toLowerCase().includes(q))
  return result
})

function labelOf(item: NamedOption) {
  return item.label ?? item.name ?? ''
}

function optionIdByLabel(list: NamedOption[], label: string | null) {
  if (!label) return undefined
  return list.find((item) => labelOf(item) === label)?.id
}

function labelById(list: NamedOption[], id: string | null | undefined) {
  if (!id) return ''
  return labelOf(list.find((item) => item.id === id) ?? { id: '' })
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('pt-BR')
}

function statusFromExit(exit: ExitRecord) {
  if (exit.status) return exit.status
  if (exit.dataPagamento) return 'Pago'
  if (exit.dataVencimento && new Date(exit.dataVencimento) < new Date()) return 'Vencido'
  return 'Em Aberto'
}

function normalizeExit(exit: ExitRecord): ExitRow {
  return {
    id: exit.id,
    data: exit.data ?? formatDate(exit.dataLancamento),
    fornecedor: (exit.fornecedor ?? labelById(suppliers.value, exit.contactId)) || 'Sem fornecedor',
    categoria: (exit.categoria ?? labelById(categories.value, exit.categoryId)) || 'Sem categoria',
    centroCusto: (exit.centroCusto ?? labelById(costCenters.value, exit.costCenterId)) || 'Sem centro',
    valor: Number(exit.valor ?? exit.valorDespesa ?? 0),
    vencimento: exit.vencimento ?? formatDate(exit.dataVencimento),
    status: statusFromExit(exit),
    raw: exit,
  }
}

async function loadExits() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const [currentPeriod, categoryRes, supplierRes, accountRes, costCenterRes, paymentRes] = await Promise.all([
      ensure(company.activeId),
      api<{ items: NamedOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'CATEGORY' } }),
      api<{ items: NamedOption[] }>('/api/contacts', { query: { companyId: company.activeId, type: 'SUPPLIER' } }),
      api<{ items: NamedOption[] }>('/api/bank-accounts', { query: { companyId: company.activeId } }),
      api<{ items: NamedOption[] }>('/api/cost-centers', { query: { companyId: company.activeId } }),
      api<{ items: NamedOption[] }>('/api/catalogs', { query: { companyId: company.activeId, kind: 'PAYMENT_METHOD' } }),
    ])

    categories.value = categoryRes.items
    suppliers.value = supplierRes.items
    accounts.value = accountRes.items
    costCenters.value = costCenterRes.items
    payments.value = paymentRes.items

    const response = await api<{ items: ExitRecord[] }>('/api/exits', {
      query: { companyId: company.activeId, periodId: currentPeriod.id },
    })
    exits.value = response.items.map(normalizeExit)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar as saídas.')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    valor: null,
    jaPago: false,
    dataPagamento: null,
    descricao: '',
    anotacoes: '',
    documentoNf: '',
    formaPagamento: null,
    categoria: null,
    conta: null,
    dataCompetencia: new Date(),
    dataVencimento: new Date(),
    fornecedor: null,
    centroCusto: null,
    status: 'Em Aberto',
  }
}

function openNew() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(row: ExitRow) {
  editingId.value = row.id
  form.value = {
    valor: row.valor,
    jaPago: Boolean(row.raw.dataPagamento) || row.status === 'Pago',
    dataPagamento: row.raw.dataPagamento ? new Date(row.raw.dataPagamento) : null,
    descricao: row.raw.descricao ?? '',
    anotacoes: row.raw.anotacoes ?? '',
    documentoNf: row.raw.documentoNf ?? '',
    formaPagamento: labelById(payments.value, row.raw.paymentId) || null,
    categoria: row.categoria === 'Sem categoria' ? null : row.categoria,
    conta: labelById(accounts.value, row.raw.bankAccountId) || null,
    dataCompetencia: row.raw.dataLancamento ? new Date(row.raw.dataLancamento) : new Date(),
    dataVencimento: row.raw.dataVencimento ? new Date(row.raw.dataVencimento) : new Date(),
    fornecedor: row.fornecedor === 'Sem fornecedor' ? null : row.fornecedor,
    centroCusto: row.centroCusto === 'Sem centro' ? null : row.centroCusto,
    status: row.status,
  }
  drawerOpen.value = true
}

async function save() {
  if (!company.activeId || saving.value) return
  saving.value = true
  error.value = null

  try {
    const currentPeriod = await ensure(company.activeId)
    const paidDate = form.value.jaPago || form.value.status === 'Pago'
      ? (form.value.dataPagamento ?? new Date())
      : undefined
    const body = {
      bankAccountId: optionIdByLabel(accounts.value, form.value.conta),
      contactId: optionIdByLabel(suppliers.value, form.value.fornecedor),
      costCenterId: optionIdByLabel(costCenters.value, form.value.centroCusto),
      categoryId: optionIdByLabel(categories.value, form.value.categoria),
      paymentId: optionIdByLabel(payments.value, form.value.formaPagamento),
      valorDespesa: form.value.valor ?? 0,
      descricao: form.value.descricao || undefined,
      anotacoes: form.value.anotacoes || undefined,
      documentoNf: form.value.documentoNf || undefined,
      dataLancamento: form.value.dataCompetencia?.toISOString(),
      dataVencimento: form.value.dataVencimento?.toISOString(),
      dataPagamento: paidDate?.toISOString(),
    }

    const response = editingId.value
      ? await api<{ item: ExitRecord }>(`/api/exits/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: ExitRecord }>('/api/exits', {
          method: 'POST',
          body: { ...body, companyId: company.activeId, periodId: currentPeriod.id },
        })

    const displayRecord: ExitRecord = {
      ...response.item,
      id: response.item.id,
      data: formatDate(form.value.dataCompetencia),
      fornecedor: form.value.fornecedor ?? 'Sem fornecedor',
      categoria: form.value.categoria ?? 'Sem categoria',
      centroCusto: form.value.centroCusto ?? 'Sem centro',
      valor: form.value.valor ?? 0,
      vencimento: formatDate(form.value.dataVencimento),
      status: form.value.status,
      dataPagamento: paidDate?.toISOString() ?? null,
    }
    const normalized = normalizeExit(displayRecord)

    if (editingId.value) {
      exits.value = exits.value.map((exit) => (exit.id === editingId.value ? normalized : exit))
    } else {
      exits.value = [normalized, ...exits.value]
    }
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar a saída.')
  } finally {
    saving.value = false
  }
}

async function deleteExit(id: string) {
  if (!window.confirm('Excluir esta saída?')) return
  try {
    await api<{ ok: boolean }>(`/api/exits/${id}`, { method: 'DELETE' })
    exits.value = exits.value.filter((exit) => exit.id !== id)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível excluir a saída.')
  }
}

function exportCSV() {
  const rows = [['Data', 'Fornecedor', 'Categoria', 'C. Custo', 'Valor', 'Vencimento', 'Status']]
  filtered.value.forEach((exit) => rows.push([exit.data, exit.fornecedor, exit.categoria, exit.centroCusto, String(exit.valor), exit.vencimento, exit.status]))
  // Excel pt-BR: separador ';', BOM UTF-8 e CRLF (senão abre tudo numa coluna).
  const csv = '﻿' + rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  anchor.download = 'saídas.csv'
  anchor.click()
}

watch(() => company.activeId, () => {
  void loadExits()
})

watch(() => [period.month, period.year], () => {
  void loadExits()
})

onMounted(() => {
  void loadExits()
})
</script>

<template>
  <div>
    <PageHeader title="Lançamentos">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Lançamentos' }, { label: 'Saídas' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-download" label="Exportar CSV" severity="secondary" outlined size="small" @click="exportCSV" />
        <Button icon="pi pi-plus" label="Nova saída" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <div class="mb-4 flex gap-1 border-b border-surface-200 dark:border-surface-800">
      <NuxtLink to="/lancamentos/entradas" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Entradas</NuxtLink>
      <NuxtLink to="/lancamentos/saidas" class="border-b-2 border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600">Saídas</NuxtLink>
      <NuxtLink to="/lancamentos/fechamentos" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Fechamentos</NuxtLink>
    </div>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
          <IconField class="w-full md:w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar fornecedor, categoria..." size="small" fluid />
          </IconField>
          <Select v-model="centroCustoFilter" :options="centroCustoOptions" placeholder="C. Custo" show-clear size="small" class="w-full md:w-40" />
          <Select v-model="statusFilter" :options="statusOptions" placeholder="Status" show-clear size="small" class="w-full md:w-40" />
        </div>

        <UiTableSkeleton v-if="loading" :rows="6" :columns="7" />

        <DataTable v-else :value="filtered" data-key="id" paginator :rows="8" size="small" class="cpek-table">
          <Column field="data" header="Data" sortable style="width:9rem" />
          <Column field="fornecedor" header="Fornecedor" sortable />
          <Column field="categoria" header="Categoria" sortable style="width:13rem">
            <template #body="{ data }"><Tag :value="data.categoria" severity="secondary" /></template>
          </Column>
          <Column field="centroCusto" header="C. Custo" sortable style="width:8rem">
            <template #body="{ data }"><span class="text-sm text-surface-500">{{ data.centroCusto }}</span></template>
          </Column>
          <Column field="valor" header="Valor" sortable style="width:9rem">
            <template #body="{ data }"><span class="font-semibold tabular-nums text-red-600">{{ brl(data.valor) }}</span></template>
          </Column>
          <Column field="vencimento" header="Vencimento" sortable style="width:9rem" />
          <Column field="status" header="Status" sortable style="width:9rem">
            <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status] ?? 'secondary'" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar saída" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Excluir saída" @click="deleteExit(data.id)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-inbox mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhuma saída neste período</p>
              <p class="mt-1 text-xs text-surface-400">Clique em "Nova saída" para registrar.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar saída' : 'Conta a pagar'" class="!w-[720px] !max-w-[96vw]" :draggable="false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small" class="md:col-span-2">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Valor da despesa</label>
          <InputNumber v-model="form.valor" mode="currency" currency="BRL" locale="pt-BR" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data de competência</label>
          <DatePicker v-model="form.dataCompetencia" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Fornecedor</label>
          <Select v-model="form.fornecedor" :options="fornecedorOptions" placeholder="Selecione o fornecedor" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Categoria</label>
          <Select v-model="form.categoria" :options="categoriaOptions" placeholder="Selecione a categoria" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Centro de custo</label>
          <Select v-model="form.centroCusto" :options="centroCustoOptions" placeholder="Selecione o centro" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Conta bancária</label>
          <Select v-model="form.conta" :options="contaOptions" placeholder="Selecione a conta" filter fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Vencimento</label>
          <DatePicker v-model="form.dataVencimento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Status</label>
          <Select v-model="form.status" :options="statusOptions" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Forma de pagamento</label>
          <Select v-model="form.formaPagamento" :options="pagamentoOptions" placeholder="Selecione" show-clear fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Documento (NF)</label>
          <InputText v-model="form.documentoNf" placeholder="Nº da nota fiscal / documento" fluid />
        </div>
        <div class="flex items-center gap-2 md:col-span-2">
          <Checkbox v-model="form.jaPago" binary input-id="ja-pago" />
          <label for="ja-pago" class="cursor-pointer text-sm">Já foi pago</label>
        </div>
        <div v-if="form.jaPago" class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Data do pagamento</label>
          <DatePicker v-model="form.dataPagamento" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Descrição</label>
          <Textarea v-model="form.descricao" rows="2" placeholder="Descrição curta (ex.: 1kg de café)" fluid />
        </div>
        <div class="flex flex-col gap-1.5 md:col-span-2">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Anotações</label>
          <Textarea v-model="form.anotacoes" rows="3" placeholder="Observações internas (opcional)" fluid />
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

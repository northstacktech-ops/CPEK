<script setup lang="ts">
import { ref, computed } from 'vue'
import { navigateTo } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const loading = ref(false)
const search = ref('')
const statusFilter = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  valor: null as number | null,
  jaRecebido: false,
  dataRecebimento: null as Date | null,
  descricao: '',
  categoria: null as string | null,
  conta: null as string | null,
  dataCompetencia: new Date() as Date | null,
  dataVencimento: new Date() as Date | null,
  cliente: null as string | null,
  centroCusto: null as string | null,
  taxa: null as string | null,
  servico: null as string | null,
  deslocamento: null as number | null,
  status: 'Em Aberto',
  data: null as Date | null,
  recorrente: false,
  recorrenciaFreq: 'Mensal' as string,
  recorrenciaQtd: '12 meses' as string,
})

const activeModalTab = ref(0)
const modalTabs = ['Dados do Lançamento', 'Recorrência', 'Adicionais', 'Documentos']

const statusOptions = ['Em Aberto', 'Pago', 'Vencido', 'Cancelado']
const servicoOptions = ['Cautelar', 'Certicar', 'Constatação']
const categoriaOptions = ['Receita de Serviços', 'Receita de Vistorias', 'Outras Receitas']
const contaOptions = ['Boleto Itaú', 'Caixa Loja', 'Cartão Créd./Déb.', 'Conta Cortesia']
const clienteOptions = ['Marcos Andrade', 'Imobiliária ABC', 'Ana Lima', 'Posto Shell', 'Roberto Souza', 'Juliana Costa']
const centroCustoOptions = ['Fixo', 'Variável']
const taxaOptions = ['Padrão Boleto', 'Tolerância 5 dias']

const statusSeverity: Record<string, string> = {
  'Pago': 'success',
  'Em Aberto': 'info',
  'Vencido': 'danger',
  'Cancelado': 'secondary',
}

const entries = ref([
  { id: '1', data: '10/06/2026', cliente: 'Marcos Andrade', servico: 'Cautelar', valor: 320, deslocamento: 45, status: 'Pago' },
  { id: '2', data: '11/06/2026', cliente: 'Ana Lima', servico: 'Certicar', valor: 480, deslocamento: 60, status: 'Pago' },
  { id: '3', data: '12/06/2026', cliente: 'Roberto Souza', servico: 'Constatação', valor: 280, deslocamento: 30, status: 'Em Aberto' },
  { id: '4', data: '13/06/2026', cliente: 'Juliana Costa', servico: 'Cautelar', valor: 350, deslocamento: 50, status: 'Vencido' },
  { id: '5', data: '14/06/2026', cliente: 'Paulo Ferreira', servico: 'Certicar', valor: 520, deslocamento: 80, status: 'Pago' },
  { id: '6', data: '15/06/2026', cliente: 'Carla Mendes', servico: 'Cautelar', valor: 310, deslocamento: 40, status: 'Em Aberto' },
  { id: '7', data: '16/06/2026', cliente: 'Fernando Rocha', servico: 'Constatação', valor: 290, deslocamento: 35, status: 'Pago' },
  { id: '8', data: '17/06/2026', cliente: 'Luciana Alves', servico: 'Certicar', valor: 460, deslocamento: 70, status: 'Cancelado' },
  { id: '9', data: '18/06/2026', cliente: 'Diego Martins', servico: 'Cautelar', valor: 330, deslocamento: 48, status: 'Pago' },
  { id: '10', data: '19/06/2026', cliente: 'Silvia Nunes', servico: 'Constatação', valor: 270, deslocamento: 25, status: 'Em Aberto' },
])

const filtered = computed(() => {
  let result = entries.value
  if (statusFilter.value) result = result.filter(e => e.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) result = result.filter(e => `${e.cliente} ${e.servico} ${e.status}`.toLowerCase().includes(q))
  return result
})

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR')
const today = () => new Date().toLocaleDateString('pt-BR')

function openNew() {
  editingId.value = null
  form.value = { valor: null, jaRecebido: false, dataRecebimento: null, descricao: '', categoria: null, conta: null, dataCompetencia: new Date(), dataVencimento: new Date(), cliente: null, centroCusto: null, taxa: null, servico: null, deslocamento: null, status: 'Em Aberto', data: null, recorrente: false, recorrenciaFreq: 'Mensal', recorrenciaQtd: '12 meses' }
  activeModalTab.value = 0
  drawerOpen.value = true
}

function openEdit(row: typeof entries.value[0]) {
  editingId.value = row.id
  form.value = { valor: row.valor, jaRecebido: false, dataRecebimento: null, descricao: '', categoria: null, conta: null, dataCompetencia: new Date(), dataVencimento: new Date(), cliente: row.cliente, centroCusto: null, taxa: null, servico: row.servico, deslocamento: row.deslocamento, status: row.status, data: null, recorrente: false, recorrenciaFreq: 'Mensal', recorrenciaQtd: '12 meses' }
  activeModalTab.value = 0
  drawerOpen.value = true
}

function saveEntry() {
  const dataStr = form.value.dataCompetencia ? fmtDate(form.value.dataCompetencia) : today()
  if (editingId.value) {
    const idx = entries.value.findIndex(e => e.id === editingId.value)
    const existing = entries.value[idx]
    if (existing) {
      entries.value[idx] = {
        ...existing,
        cliente: form.value.cliente ?? '',
        servico: form.value.servico ?? '',
        valor: form.value.valor ?? 0,
        deslocamento: existing.deslocamento,
        status: form.value.status,
        data: dataStr,
      }
    }
  } else {
    entries.value.unshift({
      id: String(Date.now()),
      data: dataStr,
      cliente: form.value.cliente ?? '',
      servico: form.value.servico ?? '',
      valor: form.value.valor ?? 0,
      deslocamento: 0,
      status: form.value.status,
    })
  }
  drawerOpen.value = false
}

function deleteEntry(id: string) {
  if (!window.confirm('Excluir este lançamento?')) return
  const idx = entries.value.findIndex(e => e.id === id)
  if (idx !== -1) entries.value.splice(idx, 1)
}

function exportCSV() {
  const rows = [['Data', 'Cliente', 'Serviço', 'Valor', 'Deslocamento', 'Status']]
  entries.value.forEach(e => rows.push([e.data, e.cliente, e.servico, String(e.valor), String(e.deslocamento), e.status]))
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = 'entradas.csv'
  a.click()
}
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

    <!-- Abas de navegação -->
    <div class="mb-4 flex gap-1 border-b border-surface-200 dark:border-surface-800">
      <NuxtLink to="/lancamentos/entradas" class="border-b-2 px-4 py-2 text-sm font-semibold border-brand-600 text-brand-600">Entradas</NuxtLink>
      <NuxtLink to="/lancamentos/saidas" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Saídas</NuxtLink>
      <NuxtLink to="/lancamentos/fechamentos" class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200">Fechamentos</NuxtLink>
    </div>

    <PageContent>
      <div class="col-span-12">
        <div class="mb-3 flex items-center gap-2">
          <IconField class="w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar cliente, serviço..." size="small" />
          </IconField>
          <Select v-model="statusFilter" :options="statusOptions" placeholder="Status" show-clear size="small" class="w-36" />
        </div>

        <DataTable
          :value="filtered"
          data-key="id"
          :loading="loading"
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
              <Tag :value="data.status" :severity="statusSeverity[data.status]" />
            </template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex items-center justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Excluir" @click="deleteEntry(data.id)" />
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
          <template #loading>
            <div class="space-y-2 p-3">
              <Skeleton v-for="i in 5" :key="i" height="2.5rem" />
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <!-- Modal de formulário two-column -->
    <Dialog
      v-model:visible="drawerOpen"
      modal
      :header="editingId ? 'Editar entrada' : 'Conta a receber'"
      class="!w-[900px] !max-w-[96vw]"
      :draggable="false"
    >
      <form class="flex min-h-[420px] gap-0 divide-x divide-surface-200 dark:divide-surface-800" @submit.prevent="saveEntry">
        <!-- Painel esquerdo -->
        <div class="flex w-72 flex-shrink-0 flex-col gap-4 pr-6">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Valor do recebimento</label>
            <InputNumber v-model="form.valor" mode="currency" currency="BRL" locale="pt-BR" fluid :input-style="{ fontSize: '1.25rem', fontWeight: '700' }" />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Checkbox v-model="form.jaRecebido" binary input-id="ja-recebido" />
              <label for="ja-recebido" class="cursor-pointer text-sm">Já foi recebido</label>
            </div>
            <DatePicker v-if="form.jaRecebido" v-model="form.dataRecebimento" date-format="dd/mm/yy" show-icon fluid placeholder="Data do recebimento" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Descrição</label>
            <Textarea v-model="form.descricao" rows="3" placeholder="Breve descrição do lançamento..." fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Categoria</label>
            <Select v-model="form.categoria" :options="categoriaOptions" placeholder="Selecione a categoria..." fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Conta</label>
            <Select v-model="form.conta" :options="contaOptions" placeholder="Selecione a conta..." fluid />
          </div>
          <div class="mt-auto pt-2">
            <Button type="submit" label="Adicionar" fluid icon="pi pi-check" />
          </div>
        </div>

        <!-- Painel direito -->
        <div class="flex min-w-0 flex-1 flex-col pl-6">
          <!-- Abas -->
          <div class="mb-5 flex border-b border-surface-200 dark:border-surface-800">
            <button
              v-for="(tab, i) in modalTabs"
              :key="i"
              type="button"
              class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors"
              :class="activeModalTab === i
                ? 'border-brand-600 text-brand-600 dark:border-brand-300 dark:text-brand-300'
                : 'border-transparent text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'"
              @click="activeModalTab = i"
            >{{ tab }}</button>
          </div>

          <!-- Tab: Dados do Lançamento -->
          <div v-if="activeModalTab === 0" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Data de Competência</label>
                <DatePicker v-model="form.dataCompetencia" date-format="dd/mm/yy" show-icon fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Data de Vencimento</label>
                <DatePicker v-model="form.dataVencimento" date-format="dd/mm/yy" show-icon fluid />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Cliente</label>
              <Select v-model="form.cliente" :options="clienteOptions" placeholder="Selecione o cliente..." fluid />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Serviço</label>
                <Select v-model="form.servico" :options="servicoOptions" placeholder="Selecione..." fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Status</label>
                <Select v-model="form.status" :options="statusOptions" fluid />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Centro de Custo</label>
                <Select v-model="form.centroCusto" :options="centroCustoOptions" placeholder="Selecione..." fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Taxas e Juros</label>
                <Select v-model="form.taxa" :options="taxaOptions" placeholder="Selecione..." fluid />
              </div>
            </div>
            <div class="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 text-sm dark:bg-surface-800">
              <i class="pi pi-info-circle text-surface-400" />
              <span class="text-surface-500">Unidade de negócio: <strong class="font-semibold text-surface-700 dark:text-surface-200">Supervisão</strong></span>
            </div>
          </div>

          <!-- Tab: Recorrência -->
          <div v-else-if="activeModalTab === 1" class="space-y-4">
            <div class="flex items-center justify-between rounded-xl border border-surface-200 p-4 dark:border-surface-800">
              <div>
                <p class="text-sm font-semibold text-surface-800 dark:text-surface-100">Lançamento recorrente</p>
                <p class="mt-0.5 text-xs text-surface-400">Repetir automaticamente em intervalo definido</p>
              </div>
              <ToggleSwitch v-model="form.recorrente" />
            </div>
            <template v-if="form.recorrente">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Frequência</label>
                  <Select v-model="form.recorrenciaFreq" :options="['Diário','Semanal','Mensal','Anual']" fluid />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-widest text-surface-400">Repetir por</label>
                  <Select v-model="form.recorrenciaQtd" :options="['3 meses','6 meses','12 meses','Indefinidamente']" fluid />
                </div>
              </div>
              <div class="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2.5 text-xs text-surface-500 dark:bg-surface-800">
                <i class="pi pi-info-circle" />
                Serão geradas cobranças automáticas conforme a frequência selecionada.
              </div>
            </template>
            <p v-else class="py-4 text-center text-xs text-surface-400">
              Ative para configurar repetição automática deste lançamento.
            </p>
          </div>

          <!-- Tab: Adicionais -->
          <div v-else-if="activeModalTab === 2" class="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <i class="pi pi-list mb-3 text-4xl text-surface-200 dark:text-surface-700" />
            <p class="text-sm font-medium text-surface-500">Nenhum campo adicional configurado</p>
          </div>

          <!-- Tab: Documentos -->
          <div v-else-if="activeModalTab === 3" class="space-y-4">
            <label class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 py-10 transition-colors hover:border-brand-300 dark:border-surface-700 dark:hover:border-brand-600">
              <input type="file" class="sr-only" multiple accept=".pdf,.docx,.xlsx,.png,.jpg" />
              <i class="pi pi-cloud-upload text-4xl text-surface-300" />
              <p class="text-sm font-medium text-surface-600 dark:text-surface-400">
                Arraste arquivos aqui ou <span class="text-brand-600 dark:text-brand-300">clique para selecionar</span>
              </p>
              <p class="text-[10px] text-surface-300">PDF, DOCX, XLSX, PNG, JPG · máx. 10 MB por arquivo</p>
            </label>
            <div class="rounded-xl border border-surface-100 dark:border-surface-800">
              <p class="px-4 py-3 text-center text-xs text-surface-400">Nenhum arquivo anexado ainda.</p>
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  </div>
</template>

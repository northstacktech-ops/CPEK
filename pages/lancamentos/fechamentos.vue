<script setup lang="ts">
import { ref, computed } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const loading = ref(false)
const search = ref('')
const statusFilter = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const form = ref({ cliente: '', valor: null as number | null, vencimento: null as Date | null, recebimento: null as Date | null, status: 'Em Aberto' })
const statusOptions = ['Em Aberto', 'Recebido', 'Vencido', 'Cancelado']
const statusSeverity: Record<string, string> = { 'Recebido': 'success', 'Em Aberto': 'info', 'Vencido': 'danger', 'Cancelado': 'secondary' }

const closings = ref([
  { id: '1', cliente: 'Marcos Andrade', valor: 1280, vencimento: '10/06/2026', recebimento: '09/06/2026', status: 'Recebido' },
  { id: '2', cliente: 'Ana Lima', valor: 960, vencimento: '15/06/2026', recebimento: '', status: 'Em Aberto' },
  { id: '3', cliente: 'Roberto Souza', valor: 1680, vencimento: '20/06/2026', recebimento: '18/06/2026', status: 'Recebido' },
  { id: '4', cliente: 'Juliana Costa', valor: 720, vencimento: '05/06/2026', recebimento: '', status: 'Vencido' },
  { id: '5', cliente: 'Paulo Ferreira', valor: 2040, vencimento: '25/06/2026', recebimento: '', status: 'Em Aberto' },
  { id: '6', cliente: 'Carla Mendes', valor: 1120, vencimento: '12/06/2026', recebimento: '11/06/2026', status: 'Recebido' },
])

const filtered = computed(() => {
  let result = closings.value
  if (statusFilter.value) result = result.filter(c => c.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) result = result.filter(c => `${c.cliente} ${c.status}`.toLowerCase().includes(q))
  return result
})

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR')
const today = () => new Date().toLocaleDateString('pt-BR')

function openNew() {
  editingId.value = null
  form.value = { cliente: '', valor: null, vencimento: null, recebimento: null, status: 'Em Aberto' }
  drawerOpen.value = true
}

function openEdit(row: typeof closings.value[0]) {
  editingId.value = row.id
  form.value = { cliente: row.cliente, valor: row.valor, vencimento: null, recebimento: null, status: row.status }
  drawerOpen.value = true
}

function save() {
  if (editingId.value) {
    const idx = closings.value.findIndex(c => c.id === editingId.value)
    if (idx !== -1) {
      closings.value[idx] = {
        ...closings.value[idx],
        cliente: form.value.cliente,
        valor: form.value.valor ?? 0,
        vencimento: form.value.vencimento ? fmtDate(form.value.vencimento) : closings.value[idx].vencimento,
        recebimento: form.value.recebimento ? fmtDate(form.value.recebimento) : closings.value[idx].recebimento,
        status: form.value.status,
      }
    }
  } else {
    closings.value.unshift({
      id: String(Date.now()),
      cliente: form.value.cliente,
      valor: form.value.valor ?? 0,
      vencimento: form.value.vencimento ? fmtDate(form.value.vencimento) : today(),
      recebimento: form.value.recebimento ? fmtDate(form.value.recebimento) : '',
      status: form.value.status,
    })
  }
  drawerOpen.value = false
}

function deleteClosing(id: string) {
  if (!window.confirm('Excluir este fechamento?')) return
  const idx = closings.value.findIndex(c => c.id === id)
  if (idx !== -1) closings.value.splice(idx, 1)
}

function exportCSV() {
  const rows = [['Cliente', 'Valor', 'Vencimento', 'Recebimento', 'Status']]
  closings.value.forEach(c => rows.push([c.cliente, String(c.valor), c.vencimento, c.recebimento, c.status]))
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = 'fechamentos.csv'
  a.click()
}
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
      <div class="col-span-12">
        <div class="mb-3 flex items-center gap-2">
          <IconField class="w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar cliente..." size="small" />
          </IconField>
          <Select v-model="statusFilter" :options="statusOptions" placeholder="Status" show-clear size="small" class="w-36" />
        </div>

        <DataTable :value="filtered" data-key="id" :loading="loading" paginator :rows="8" size="small" class="cpek-table">
          <Column field="cliente" header="Cliente" sortable />
          <Column field="valor" header="Valor" sortable style="width:10rem">
            <template #body="{ data }"><span class="font-semibold tabular-nums">{{ brl(data.valor) }}</span></template>
          </Column>
          <Column field="vencimento" header="Vencimento previsto" sortable style="width:12rem" />
          <Column field="recebimento" header="Data recebimento" sortable style="width:12rem">
            <template #body="{ data }">
              <span :class="data.recebimento ? 'text-surface-700 dark:text-surface-200' : 'text-surface-400'">
                {{ data.recebimento || '—' }}
              </span>
            </template>
          </Column>
          <Column field="status" header="Status" sortable style="width:9rem">
            <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status]" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Excluir" @click="deleteClosing(data.id)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-file-check mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhum fechamento neste período</p>
              <p class="mt-1 text-xs text-surface-400">Clique em "Novo fechamento" para registrar.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar fechamento' : 'Novo fechamento'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Cliente</label>
          <InputText v-model="form.cliente" placeholder="Nome do cliente" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Valor do fechamento</label>
          <InputNumber v-model="form.valor" mode="currency" currency="BRL" locale="pt-BR" fluid />
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
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button label="Salvar" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

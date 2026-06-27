<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'Dinheiro', taxa: null as number | null, diasCompensacao: 0, status: 'Ativo' })
const tipoOptions = ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'TED/DOC']
const statusOptions = ['Ativo', 'Inativo']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const items = ref([
  { id: '1', nome: 'Dinheiro', tipo: 'Dinheiro', taxa: 0, diasCompensacao: 0, status: 'Ativo' },
  { id: '2', nome: 'PIX', tipo: 'PIX', taxa: 0, diasCompensacao: 0, status: 'Ativo' },
  { id: '3', nome: 'Cartão de Crédito', tipo: 'Cartão de Crédito', taxa: 2.5, diasCompensacao: 30, status: 'Ativo' },
  { id: '4', nome: 'Boleto Bancário', tipo: 'Boleto', taxa: 1.5, diasCompensacao: 3, status: 'Ativo' },
  { id: '5', nome: 'TED', tipo: 'TED/DOC', taxa: 0, diasCompensacao: 1, status: 'Ativo' },
])

function openNew() { editingId.value = null; form.value = { nome: '', tipo: 'Dinheiro', taxa: null, diasCompensacao: 0, status: 'Ativo' }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, tipo: row.tipo, taxa: row.taxa, diasCompensacao: row.diasCompensacao, status: row.status }; drawerOpen.value = true }
function save() {
  if (editingId.value) {
    const idx = items.value.findIndex(i => i.id === editingId.value)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], ...form.value }
  } else {
    items.value.unshift({ id: String(Date.now()), ...form.value })
  }
  drawerOpen.value = false
}
function deleteItem(id: string) {
  if (!window.confirm('Excluir?')) return
  const idx = items.value.findIndex(i => i.id === id)
  if (idx !== -1) items.value.splice(idx, 1)
}
</script>

<template>
  <div>
    <PageHeader title="Formas de Pagamento">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Formas de Pagamento' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Nova forma" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" style="width:13rem">
            <template #body="{ data }"><Tag :value="data.tipo" severity="secondary" /></template>
          </Column>
          <Column field="taxa" header="Taxa (%)" style="width:8rem">
            <template #body="{ data }">
              <span class="tabular-nums">{{ data.taxa > 0 ? data.taxa + '%' : '—' }}</span>
            </template>
          </Column>
          <Column field="diasCompensacao" header="Dias p/ compensar" style="width:11rem">
            <template #body="{ data }"><span class="tabular-nums">{{ data.diasCompensacao === 0 ? 'Imediato' : data.diasCompensacao + ' dias' }}</span></template>
          </Column>
          <Column field="status" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status]" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEdit(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </PageContent>
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar forma' : 'Nova forma de pagamento'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <Select v-model="form.tipo" :options="tipoOptions" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Taxa (%)</label>
            <InputNumber v-model="form.taxa" :min-fraction-digits="1" :max-fraction-digits="2" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Dias p/ compensar</label>
            <InputNumber v-model="form.diasCompensacao" :min="0" fluid />
          </div>
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

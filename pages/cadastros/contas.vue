<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'Recebimento', banco: '', agencia: '', saldoInicial: null as number | null })
const tipoOptions = ['Recebimento', 'Caixa', 'Cartão', 'Cortesia']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const items = ref([
  { id: '1', nome: 'Boleto Itaú', tipo: 'Recebimento', banco: 'Itaú', agencia: '0341', saldoInicial: 0, status: 'Ativo' },
  { id: '2', nome: 'Caixa Loja', tipo: 'Caixa', banco: '—', agencia: '—', saldoInicial: 500, status: 'Ativo' },
  { id: '3', nome: 'Cartão Créd./Déb.', tipo: 'Cartão', banco: 'Cielo', agencia: '—', saldoInicial: 0, status: 'Ativo' },
  { id: '4', nome: 'Conta Cortesia', tipo: 'Cortesia', banco: '—', agencia: '—', saldoInicial: 0, status: 'Ativo' },
])

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function openNew() { editingId.value = null; form.value = { nome: '', tipo: 'Recebimento', banco: '', agencia: '', saldoInicial: null }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, tipo: row.tipo, banco: row.banco, agencia: row.agencia, saldoInicial: row.saldoInicial }; drawerOpen.value = true }
function save() {
  if (editingId.value) {
    const idx = items.value.findIndex(i => i.id === editingId.value)
    const existing = items.value[idx]
    if (existing) items.value[idx] = { ...existing, ...form.value, saldoInicial: form.value.saldoInicial ?? existing.saldoInicial }
  } else {
    items.value.unshift({ id: String(Date.now()), nome: form.value.nome, tipo: form.value.tipo, banco: form.value.banco, agencia: form.value.agencia, saldoInicial: form.value.saldoInicial ?? 0, status: 'Ativo' })
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
    <PageHeader title="Contas Bancárias">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Contas Bancárias' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Nova conta" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" style="width:10rem">
            <template #body="{ data }"><Tag :value="data.tipo" severity="secondary" /></template>
          </Column>
          <Column field="banco" header="Banco" style="width:9rem" />
          <Column field="agencia" header="Agência" style="width:8rem" />
          <Column field="saldoInicial" header="Saldo inicial" style="width:10rem">
            <template #body="{ data }"><span class="tabular-nums font-semibold">{{ brl(data.saldoInicial) }}</span></template>
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
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar conta' : 'Nova conta bancária'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
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
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Banco</label>
            <InputText v-model="form.banco" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Agência</label>
            <InputText v-model="form.agencia" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Saldo inicial</label>
          <InputNumber v-model="form.saldoInicial" mode="currency" currency="BRL" locale="pt-BR" fluid />
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

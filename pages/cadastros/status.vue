<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'Entrada', cor: '#22c55e', padrao: false })
const tipoOptions = ['Entrada', 'Saída', 'Ambos']

const items = ref([
  { id: '1', nome: 'Em Aberto', tipo: 'Ambos', cor: '#3b82f6', padrao: true },
  { id: '2', nome: 'Pago', tipo: 'Entrada', cor: '#22c55e', padrao: false },
  { id: '3', nome: 'Vencido', tipo: 'Ambos', cor: '#ef4444', padrao: false },
  { id: '4', nome: 'Cancelado', tipo: 'Ambos', cor: '#94a3b8', padrao: false },
])

function openNew() { editingId.value = null; form.value = { nome: '', tipo: 'Entrada', cor: '#22c55e', padrao: false }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, tipo: row.tipo, cor: row.cor, padrao: row.padrao }; drawerOpen.value = true }
function save() {
  if (editingId.value) {
    const idx = items.value.findIndex(i => i.id === editingId.value)
    const existing = items.value[idx]
    if (existing) items.value[idx] = { ...existing, ...form.value }
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
    <PageHeader title="Status">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Status' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo status" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" style="width:9rem">
            <template #body="{ data }"><Tag :value="data.tipo" severity="secondary" /></template>
          </Column>
          <Column field="cor" header="Cor" style="width:7rem">
            <template #body="{ data }">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3 w-3 rounded-full" :style="{ background: data.cor }" />
                <span class="text-xs text-surface-500">{{ data.cor }}</span>
              </span>
            </template>
          </Column>
          <Column field="padrao" header="Padrão" style="width:7rem">
            <template #body="{ data }">
              <i :class="data.padrao ? 'pi pi-check text-green-500' : 'pi pi-minus text-surface-300'" />
            </template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEdit(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </PageContent>
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar status' : 'Novo status'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <Select v-model="form.tipo" :options="tipoOptions" fluid />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Padrão</label>
          <ToggleSwitch v-model="form.padrao" />
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

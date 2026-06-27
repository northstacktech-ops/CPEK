<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'Fixo', status: 'Ativo' })
const tipoOptions = ['Fixo', 'Variável']
const statusOptions = ['Ativo', 'Inativo']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const items = ref([
  { id: '1', nome: 'Fixo', tipo: 'Fixo', status: 'Ativo' },
  { id: '2', nome: 'Variável', tipo: 'Variável', status: 'Ativo' },
])

function openNew() { editingId.value = null; form.value = { nome: '', tipo: 'Fixo', status: 'Ativo' }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, tipo: row.tipo, status: row.status }; drawerOpen.value = true }
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
    <PageHeader title="Centros de Custo">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Centros de Custo' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo centro" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" style="width:10rem">
            <template #body="{ data }"><Tag :value="data.tipo" :severity="data.tipo === 'Fixo' ? 'info' : 'warn'" /></template>
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
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar centro' : 'Novo centro de custo'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <SelectButton v-model="form.tipo" :options="tipoOptions" />
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

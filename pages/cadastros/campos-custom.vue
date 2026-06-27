<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', tipo: 'Texto', entidade: 'Entrada', obrigatorio: false })
const tipoOptions = ['Texto', 'Número', 'Lista', 'Data', 'Sim/Não']
const entidadeOptions = ['Entrada', 'Saída', 'Contato']
const statusSeverity: Record<string, string> = { true: 'warn', false: 'secondary' }

const items = ref([
  { id: '1', nome: 'Placa do veículo', tipo: 'Texto', entidade: 'Entrada', obrigatorio: true },
  { id: '2', nome: 'Modelo', tipo: 'Texto', entidade: 'Entrada', obrigatorio: false },
  { id: '3', nome: 'RENAVAM', tipo: 'Texto', entidade: 'Entrada', obrigatorio: false },
])

function openNew() { editingId.value = null; form.value = { nome: '', tipo: 'Texto', entidade: 'Entrada', obrigatorio: false }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, tipo: row.tipo, entidade: row.entidade, obrigatorio: row.obrigatorio }; drawerOpen.value = true }
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
    <PageHeader title="Campos Personalizados">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Campos Personalizados' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo campo" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" style="width:9rem">
            <template #body="{ data }"><Tag :value="data.tipo" severity="secondary" /></template>
          </Column>
          <Column field="entidade" header="Entidade" style="width:9rem">
            <template #body="{ data }"><Tag :value="data.entidade" severity="info" /></template>
          </Column>
          <Column field="obrigatorio" header="Obrigatório" style="width:9rem">
            <template #body="{ data }">
              <i :class="data.obrigatorio ? 'pi pi-check text-green-500' : 'pi pi-minus text-surface-300'" />
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
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar campo' : 'Novo campo personalizado'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome do campo</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo de dado</label>
          <Select v-model="form.tipo" :options="tipoOptions" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Entidade</label>
          <Select v-model="form.entidade" :options="entidadeOptions" fluid />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Obrigatório</label>
          <ToggleSwitch v-model="form.obrigatorio" />
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

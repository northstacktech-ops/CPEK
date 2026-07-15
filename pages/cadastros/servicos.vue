<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', descricao: '', valorBase: null as number | null, status: 'Ativo' })
const statusOptions = ['Ativo', 'Inativo']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const items = ref([
  { id: '1', nome: 'Cautelar', descricao: 'Vistoria cautelar de veículo', valorBase: 320, status: 'Ativo' },
  { id: '2', nome: 'Certicar', descricao: 'Certificação e aprovação', valorBase: 480, status: 'Ativo' },
  { id: '3', nome: 'Constatação', descricao: 'Vistoria de constatação', valorBase: 280, status: 'Ativo' },
])

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function openNew() { editingId.value = null; form.value = { nome: '', descricao: '', valorBase: null, status: 'Ativo' }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, descricao: row.descricao, valorBase: row.valorBase, status: row.status }; drawerOpen.value = true }
function save() {
  if (editingId.value) {
    const idx = items.value.findIndex(i => i.id === editingId.value)
    const existing = items.value[idx]
    if (existing) items.value[idx] = { ...existing, ...form.value, valorBase: form.value.valorBase ?? existing.valorBase }
  } else {
    items.value.unshift({ id: String(Date.now()), ...form.value, valorBase: form.value.valorBase ?? 0 })
  }
  drawerOpen.value = false
}

function deleteItem(id: string) {
  if (!window.confirm('Excluir este serviço?')) return
  const idx = items.value.findIndex(i => i.id === id)
  if (idx !== -1) items.value.splice(idx, 1)
}
</script>

<template>
  <div>
    <PageHeader title="Serviços">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Serviços' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo serviço" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="descricao" header="Descrição" />
          <Column field="valorBase" header="Valor base" style="width:10rem">
            <template #body="{ data }"><span class="tabular-nums font-semibold">{{ brl(data.valorBase) }}</span></template>
          </Column>
          <Column field="status" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status]" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEdit(data)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteItem(data.id)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </PageContent>
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar serviço' : 'Novo serviço'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Descrição</label>
          <InputText v-model="form.descricao" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Valor base</label>
          <InputNumber v-model="form.valorBase" mode="currency" currency="BRL" locale="pt-BR" fluid />
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

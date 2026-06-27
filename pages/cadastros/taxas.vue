<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ nome: '', jurosMes: null as number | null, multa: null as number | null, status: 'Ativo' })
const statusOptions = ['Ativo', 'Inativo']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const items = ref([
  { id: '1', nome: 'Padrão Boleto', jurosMes: 1.0, multa: 2.0, status: 'Ativo' },
  { id: '2', nome: 'Tolerância 5 dias', jurosMes: 0.5, multa: 1.0, status: 'Ativo' },
])

function openNew() { editingId.value = null; form.value = { nome: '', jurosMes: null, multa: null, status: 'Ativo' }; drawerOpen.value = true }
function openEdit(row: typeof items.value[0]) { editingId.value = row.id; form.value = { nome: row.nome, jurosMes: row.jurosMes, multa: row.multa, status: row.status }; drawerOpen.value = true }
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
    <PageHeader title="Taxas e Juros">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros', url: '/cadastros' }, { label: 'Taxas e Juros' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Nova taxa" size="small" @click="openNew" />
      </template>
    </PageHeader>
    <PageContent>
      <div class="col-span-12">
        <DataTable :value="items" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="jurosMes" header="Juros ao mês" style="width:11rem">
            <template #body="{ data }"><span class="tabular-nums">{{ data.jurosMes }}%</span></template>
          </Column>
          <Column field="multa" header="Multa" style="width:8rem">
            <template #body="{ data }"><span class="tabular-nums">{{ data.multa }}%</span></template>
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
    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar taxa' : 'Nova taxa'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome do perfil</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Juros ao mês (%)</label>
            <InputNumber v-model="form.jurosMes" :min-fraction-digits="1" :max-fraction-digits="2" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Multa (%)</label>
            <InputNumber v-model="form.multa" :min-fraction-digits="1" :max-fraction-digits="2" fluid />
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

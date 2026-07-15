<script setup lang="ts">
import { ref, computed } from 'vue'
import { navigateTo } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const loading = ref(false)
const search = ref('')
const tipoFiltro = ref<string | null>(null)
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const form = ref({ nome: '', tipo: 'Cliente', contato: '', telefone: '', email: '', cpfCnpj: '', endereco: '', obs: '' })
const tipoOptions = ['Cliente', 'Fornecedor']
const statusSeverity: Record<string, string> = { 'Ativo': 'success', 'Inativo': 'secondary' }

const contacts = ref([
  { id: '1', nome: 'Marcos Andrade', tipo: 'Cliente', telefone: '(11) 98765-4321', email: 'marcos@email.com', cpfCnpj: '123.456.789-00', status: 'Ativo' },
  { id: '2', nome: 'Imobiliária ABC', tipo: 'Fornecedor', telefone: '(11) 3456-7890', email: 'contato@abc.com.br', cpfCnpj: '12.345.678/0001-99', status: 'Ativo' },
  { id: '3', nome: 'Ana Lima', tipo: 'Cliente', telefone: '(21) 99123-4567', email: 'ana@email.com', cpfCnpj: '987.654.321-00', status: 'Ativo' },
  { id: '4', nome: 'Posto Shell', tipo: 'Fornecedor', telefone: '(11) 2345-6789', email: 'shell@posto.com', cpfCnpj: '98.765.432/0001-11', status: 'Ativo' },
  { id: '5', nome: 'Roberto Souza', tipo: 'Cliente', telefone: '(31) 97654-3210', email: 'roberto@email.com', cpfCnpj: '456.789.123-00', status: 'Ativo' },
  { id: '6', nome: 'Google Brasil', tipo: 'Fornecedor', telefone: '(11) 4000-0000', email: 'ads@google.com', cpfCnpj: '06.990.590/0001-23', status: 'Ativo' },
  { id: '7', nome: 'Juliana Costa', tipo: 'Cliente', telefone: '(41) 98888-7777', email: 'juliana@email.com', cpfCnpj: '321.654.987-00', status: 'Inativo' },
])

const filtered = computed(() => {
  let list = contacts.value
  if (tipoFiltro.value) list = list.filter((c) => c.tipo === tipoFiltro.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((c) => `${c.nome} ${c.email} ${c.cpfCnpj}`.toLowerCase().includes(q))
  return list
})

function openNew() {
  editingId.value = null
  form.value = { nome: '', tipo: 'Cliente', contato: '', telefone: '', email: '', cpfCnpj: '', endereco: '', obs: '' }
  drawerOpen.value = true
}

function openEdit(row: typeof contacts.value[0]) {
  editingId.value = row.id
  form.value = { nome: row.nome, tipo: row.tipo, contato: '', telefone: row.telefone, email: row.email, cpfCnpj: row.cpfCnpj, endereco: '', obs: '' }
  drawerOpen.value = true
}

function save() {
  if (editingId.value) {
    const idx = contacts.value.findIndex(c => c.id === editingId.value)
    const existing = contacts.value[idx]
    if (existing) contacts.value[idx] = { ...existing, nome: form.value.nome, tipo: form.value.tipo, telefone: form.value.telefone, email: form.value.email, cpfCnpj: form.value.cpfCnpj }
  } else {
    contacts.value.unshift({ id: String(Date.now()), nome: form.value.nome, tipo: form.value.tipo, telefone: form.value.telefone, email: form.value.email, cpfCnpj: form.value.cpfCnpj, status: 'Ativo' })
  }
  drawerOpen.value = false
}

function toggleStatus(row: typeof contacts.value[0]) {
  row.status = row.status === 'Ativo' ? 'Inativo' : 'Ativo'
}
</script>

<template>
  <div>
    <PageHeader title="Contatos" description="Clientes e fornecedores vinculados aos lançamentos.">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Contatos' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo contato" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <div class="col-span-12">
        <div class="mb-3 flex items-center gap-2">
          <IconField class="w-64">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar nome, e-mail, CNPJ..." size="small" />
          </IconField>
          <Select v-model="tipoFiltro" :options="tipoOptions" placeholder="Tipo" show-clear size="small" class="w-36" />
        </div>

        <DataTable
          :value="filtered"
          data-key="id"
          :loading="loading"
          paginator
          :rows="8"
          size="small"
          class="cpek-table"
          row-hover
          @row-click="(e) => navigateTo('/contatos/' + e.data.id)"
        >
          <Column field="nome" header="Nome" sortable />
          <Column field="tipo" header="Tipo" sortable style="width:9rem">
            <template #body="{ data }">
              <Tag :value="data.tipo" :severity="data.tipo === 'Cliente' ? 'info' : 'secondary'" />
            </template>
          </Column>
          <Column field="telefone" header="Telefone" style="width:11rem" />
          <Column field="email" header="E-mail" />
          <Column field="cpfCnpj" header="CPF / CNPJ" style="width:13rem" />
          <Column field="status" header="Status" sortable style="width:8rem">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="statusSeverity[data.status]" />
            </template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar" @click.stop="openEdit(data)" />
                <Button
                  :icon="data.status === 'Ativo' ? 'pi pi-ban' : 'pi pi-check-circle'"
                  text rounded size="small"
                  :severity="data.status === 'Ativo' ? 'secondary' : 'success'"
                  :aria-label="data.status === 'Ativo' ? 'Desativar' : 'Reativar'"
                  @click.stop="toggleStatus(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-users mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhum contato encontrado</p>
              <p class="mt-1 text-xs text-surface-400">Clique em "Novo contato" para adicionar.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar contato' : 'Novo contato'" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <SelectButton v-model="form.tipo" :options="tipoOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Pessoa de contato</label>
          <InputText v-model="form.contato" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Telefone</label>
            <InputMask v-model="form.telefone" mask="(99) 99999-9999" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">CPF / CNPJ</label>
            <InputText v-model="form.cpfCnpj" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
          <InputText v-model="form.email" type="email" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Observações</label>
          <Textarea v-model="form.obs" rows="3" fluid />
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

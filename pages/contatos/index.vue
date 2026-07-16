<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

interface ContactRecord {
  id: string
  companyId?: string | null
  type: 'CLIENT' | 'SUPPLIER'
  name: string
  contact?: string | null
  phone?: string | null
  email?: string | null
  taxId?: string | null
  address?: string | null
  notes?: string | null
  active?: boolean
}

interface ContactRow {
  id: string
  nome: string
  tipo: 'Cliente' | 'Fornecedor'
  telefone: string
  email: string
  cpfCnpj: string
  status: 'Ativo' | 'Inativo'
  raw: ContactRecord
}

const company = useCompanyStore()
const { api } = useApi()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const activeTab = ref<'CLIENT' | 'SUPPLIER'>('CLIENT')
const drawerOpen = ref(false)
const editingId = ref<string | null>(null)

const contacts = ref<ContactRow[]>([])
const form = ref({ nome: '', tipo: 'Cliente', contato: '', telefone: '', email: '', cpfCnpj: '', endereco: '', obs: '' })
const tipoOptions = ['Cliente', 'Fornecedor']
const statusSeverity: Record<string, string> = { Ativo: 'success', Inativo: 'secondary' }

const currentTypeLabel = computed(() => (activeTab.value === 'CLIENT' ? 'cliente' : 'fornecedor'))
const currentTypePlural = computed(() => (activeTab.value === 'CLIENT' ? 'clientes' : 'fornecedores'))
const newButtonLabel = computed(() => (activeTab.value === 'CLIENT' ? 'Novo cliente' : 'Novo fornecedor'))

const counts = computed(() => ({
  CLIENT: contacts.value.filter((contact) => contact.raw.type === 'CLIENT').length,
  SUPPLIER: contacts.value.filter((contact) => contact.raw.type === 'SUPPLIER').length,
}))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return contacts.value.filter((contact) => {
    const matchesType = contact.raw.type === activeTab.value
    const matchesSearch = !q || `${contact.nome} ${contact.email} ${contact.cpfCnpj} ${contact.telefone}`.toLowerCase().includes(q)
    return matchesType && matchesSearch
  })
})

function apiType(label: string): 'CLIENT' | 'SUPPLIER' {
  return label === 'Fornecedor' ? 'SUPPLIER' : 'CLIENT'
}

function uiType(type: 'CLIENT' | 'SUPPLIER'): 'Cliente' | 'Fornecedor' {
  return type === 'SUPPLIER' ? 'Fornecedor' : 'Cliente'
}

function normalizeContact(contact: ContactRecord): ContactRow {
  return {
    id: contact.id,
    nome: contact.name,
    tipo: uiType(contact.type),
    telefone: contact.phone ?? '-',
    email: contact.email ?? '-',
    cpfCnpj: contact.taxId ?? '-',
    status: contact.active === false ? 'Inativo' : 'Ativo',
    raw: contact,
  }
}

async function loadContacts() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const response = await api<{ items: ContactRecord[] }>('/api/contacts', {
      query: { companyId: company.activeId },
    })
    contacts.value = response.items.map(normalizeContact)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar os contatos.')
  } finally {
    loading.value = false
  }
}

function resetForm(type = activeTab.value) {
  form.value = {
    nome: '',
    tipo: uiType(type),
    contato: '',
    telefone: '',
    email: '',
    cpfCnpj: '',
    endereco: '',
    obs: '',
  }
}

function openNew() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(row: ContactRow) {
  editingId.value = row.id
  form.value = {
    nome: row.raw.name,
    tipo: uiType(row.raw.type),
    contato: row.raw.contact ?? '',
    telefone: row.raw.phone ?? '',
    email: row.raw.email ?? '',
    cpfCnpj: row.raw.taxId ?? '',
    endereco: row.raw.address ?? '',
    obs: row.raw.notes ?? '',
  }
  drawerOpen.value = true
}

async function save() {
  if (saving.value) return
  saving.value = true
  error.value = null

  try {
    const body = {
      companyId: company.activeId ?? undefined,
      type: apiType(form.value.tipo),
      name: form.value.nome,
      contact: form.value.contato || undefined,
      phone: form.value.telefone || undefined,
      email: form.value.email || undefined,
      taxId: form.value.cpfCnpj || undefined,
      address: form.value.endereco || undefined,
      notes: form.value.obs || undefined,
    }

    const response = editingId.value
      ? await api<{ item: ContactRecord }>(`/api/contacts/${editingId.value}`, { method: 'PATCH', body })
      : await api<{ item: ContactRecord }>('/api/contacts', { method: 'POST', body })

    const normalized = normalizeContact({ active: true, ...response.item })
    if (editingId.value) {
      contacts.value = contacts.value.map((contact) => (contact.id === editingId.value ? normalized : contact))
    } else {
      contacts.value = [normalized, ...contacts.value]
      activeTab.value = normalized.raw.type
    }
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível salvar o contato.')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row: ContactRow) {
  const nextActive = row.status !== 'Ativo'
  try {
    const response = await api<{ item: ContactRecord }>(`/api/contacts/${row.id}`, {
      method: 'PATCH',
      body: { active: nextActive },
    })
    contacts.value = contacts.value.map((contact) =>
      contact.id === row.id ? normalizeContact({ ...row.raw, ...response.item, active: nextActive }) : contact,
    )
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível alterar o status do contato.')
  }
}

watch(
  () => company.activeId,
  () => {
    void loadContacts()
  },
)

onMounted(() => {
  void loadContacts()
})
</script>

<template>
  <div>
    <PageHeader title="Contatos" description="Clientes e fornecedores vinculados aos lançamentos.">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Contatos' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" :label="newButtonLabel" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <Card class="col-span-12 border border-surface-200 dark:border-surface-800">
        <template #content>
          <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs v-model:value="activeTab" class="w-full md:w-auto">
              <TabList>
                <Tab value="CLIENT">
                  Clientes
                  <Badge :value="counts.CLIENT" severity="info" class="ml-2" />
                </Tab>
                <Tab value="SUPPLIER">
                  Fornecedores
                  <Badge :value="counts.SUPPLIER" severity="secondary" class="ml-2" />
                </Tab>
              </TabList>
            </Tabs>

            <IconField class="w-full md:w-80">
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" :placeholder="`Buscar ${currentTypePlural}`" size="small" fluid />
            </IconField>
          </div>

          <UiTableSkeleton v-if="loading" :rows="6" :columns="6" />

          <DataTable
            v-else
            :value="filtered"
            data-key="id"
            paginator
            :rows="8"
            size="small"
            class="cpek-table"
            row-hover
            scrollable
            scroll-height="520px"
          >
            <Column field="nome" header="Nome" sortable frozen />
            <Column field="telefone" header="Telefone" style="width:11rem" />
            <Column field="email" header="E-mail" />
            <Column field="cpfCnpj" header="CPF / CNPJ" style="width:13rem" />
            <Column field="status" header="Status" sortable style="width:8rem">
              <template #body="{ data }">
                <Tag :value="data.status" :severity="statusSeverity[data.status]" />
              </template>
            </Column>
            <Column header="" style="width:5rem" body-class="text-right" align-frozen="right" frozen>
              <template #body="{ data }">
                <div class="flex justify-end gap-1">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" aria-label="Editar contato" @click="openEdit(data)" />
                  <Button
                    :icon="data.status === 'Ativo' ? 'pi pi-ban' : 'pi pi-check-circle'"
                    text
                    rounded
                    size="small"
                    :severity="data.status === 'Ativo' ? 'secondary' : 'success'"
                    :aria-label="data.status === 'Ativo' ? 'Desativar contato' : 'Reativar contato'"
                    @click="toggleStatus(data)"
                  />
                </div>
              </template>
            </Column>
            <template #empty>
              <div class="flex flex-col items-center py-10 text-center">
                <i class="pi pi-users mb-3 text-3xl text-surface-300" />
                <p class="text-sm font-medium text-surface-500">Nenhum {{ currentTypeLabel }} encontrado</p>
                <p class="mt-1 text-xs text-surface-400">Clique em "{{ newButtonLabel }}" para cadastrar.</p>
              </div>
            </template>
          </DataTable>
        </template>
      </Card>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal :header="editingId ? 'Editar contato' : newButtonLabel" class="!w-[520px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label for="contact-type" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <SelectButton id="contact-type" v-model="form.tipo" :options="tipoOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-name" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText id="contact-name" v-model="form.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-person" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Pessoa de contato</label>
          <InputText id="contact-person" v-model="form.contato" fluid />
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label for="contact-phone" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Telefone</label>
            <InputText id="contact-phone" v-model="form.telefone" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="contact-tax-id" class="text-xs font-semibold uppercase tracking-wide text-surface-500">CPF / CNPJ</label>
            <InputText id="contact-tax-id" v-model="form.cpfCnpj" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-email" class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
          <InputText id="contact-email" v-model="form.email" type="email" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-address" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Endereço</label>
          <InputText id="contact-address" v-model="form.endereco" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contact-notes" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Observações</label>
          <Textarea id="contact-notes" v-model="form.obs" rows="3" fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button label="Salvar" :loading="saving" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

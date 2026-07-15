<script setup lang="ts">
import { computed, ref } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'

const activeTab = ref(0)
const editMode = ref(false)
const inviteDrawerOpen = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('Membro')
const editingEmpresaId = ref<string | null>(null)
const empresaDrawerOpen = ref(false)
const empresaForm = ref({ nome: '', cnpj: '' })

const roleOptions = ['Admin', 'Membro', 'Visualizador']

const conta = ref({ nome: 'Supervisão Vistorias', plano: 'Profissional', email: 'admin@supervisao.com.br' })
const contaOriginal = { ...conta.value }

function startEdit() { editMode.value = true }
function cancelEdit() { conta.value = { ...contaOriginal }; editMode.value = false }
function saveEdit() { editMode.value = false }

const empresas = ref([
  { id: '1', nome: 'Supervisão Vistorias SP', cnpj: '12.345.678/0001-99', status: 'Ativa' },
  { id: '2', nome: 'Supervisão Vistorias RJ', cnpj: '98.765.432/0001-11', status: 'Ativa' },
])

const membros = ref([
  { id: '1', nome: 'Rafael Mendonça', email: 'rafael@supervisao.com.br', papel: 'Admin', status: 'Ativo' },
  { id: '2', nome: 'Marcos Silva', email: 'marcos@supervisao.com', papel: 'Membro', status: 'Ativo' },
])

const auditoria = ref([
  { id: '1', data: '26/06/2026 14:32', autor: 'Rafael Mendonça', acao: 'CREATE', entidade: 'Entrada', detalhe: 'Cautelar · Marcos Andrade · R$ 320,00' },
  { id: '2', data: '26/06/2026 13:10', autor: 'Rafael Mendonça', acao: 'UPDATE', entidade: 'Contato', detalhe: 'Status → Inativo · Juliana Costa' },
  { id: '3', data: '25/06/2026 18:00', autor: 'Marcos Silva', acao: 'CREATE', entidade: 'Saída', detalhe: 'Folha de Pagamento · R$ 8.500,00' },
  { id: '4', data: '25/06/2026 11:45', autor: 'Rafael Mendonça', acao: 'DELETE', entidade: 'Fechamento', detalhe: 'Ana Lima · R$ 960,00' },
  { id: '5', data: '24/06/2026 09:20', autor: 'Marcos Silva', acao: 'LOGIN', entidade: 'Sessão', detalhe: 'Acesso via email/senha' },
])

const acaoSeverity: Record<string, string> = { CREATE: 'success', UPDATE: 'info', DELETE: 'danger', LOGIN: 'secondary' }

function saveInvite() { inviteDrawerOpen.value = false; inviteEmail.value = '' }

function openEditEmpresa(row: typeof empresas.value[0]) {
  editingEmpresaId.value = row.id
  empresaForm.value = { nome: row.nome, cnpj: row.cnpj }
  empresaDrawerOpen.value = true
}

function saveEmpresa() {
  const idx = empresas.value.findIndex(e => e.id === editingEmpresaId.value)
  const existing = empresas.value[idx]
  if (existing) empresas.value[idx] = { ...existing, ...empresaForm.value }
  empresaDrawerOpen.value = false
}

const deleteDialogOpen = ref(false)
const deleteConfirmText = ref('')
const canDelete = computed(() => deleteConfirmText.value === 'EXCLUIR')

const tabs = [
  { label: 'Conta', icon: 'pi pi-user' },
  { label: 'Empresas', icon: 'pi pi-building' },
  { label: 'Membros', icon: 'pi pi-users' },
  { label: 'Auditoria', icon: 'pi pi-history' },
]
</script>

<template>
  <div>
    <PageHeader title="Configurações">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Configurações' }]" />
      </template>
    </PageHeader>

    <!-- Tabs nav -->
    <div class="mb-4 flex gap-1 border-b border-surface-200 dark:border-surface-800">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.label"
        class="flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === i
          ? 'border-brand-600 text-brand-600 font-semibold'
          : 'border-transparent text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'"
        @click="activeTab = i"
      >
        <i :class="tab.icon" class="text-xs" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: Conta -->
    <PageContent v-if="activeTab === 0">
      <div class="col-span-12 md:col-span-6">
        <div class="rounded-xl border border-surface-200 bg-surface-0 p-6 dark:border-surface-800 dark:bg-surface-900">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-bold text-surface-900 dark:text-surface-0">Dados da conta</h2>
            <Button
              v-if="!editMode"
              label="Editar"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              size="small"
              @click="startEdit"
            />
            <div v-else class="flex gap-2">
              <Button label="Salvar" icon="pi pi-check" size="small" @click="saveEdit" />
              <Button label="Cancelar" severity="secondary" outlined size="small" @click="cancelEdit" />
            </div>
          </div>

          <div class="space-y-4">
            <!-- Nome -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome da empresa</span>
              <InputText v-if="editMode" v-model="conta.nome" fluid />
              <p v-else class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ conta.nome }}</p>
            </div>
            <!-- E-mail -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail de acesso</span>
              <InputText v-if="editMode" v-model="conta.email" type="email" fluid />
              <p v-else class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ conta.email }}</p>
            </div>
            <!-- Plano -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">Plano</span>
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ conta.plano }}</p>
                <Tag value="Ativo" severity="success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12">
        <Accordion>
          <AccordionPanel value="danger">
            <AccordionHeader>
              <span class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <i class="pi pi-exclamation-triangle text-xs" />
                Ações avançadas
              </span>
            </AccordionHeader>
            <AccordionContent>
              <div class="space-y-2 px-1">
                <p class="text-sm text-surface-500">Ações irreversíveis que afetam toda a conta.</p>
                <Button label="Excluir conta" severity="danger" outlined size="small" icon="pi pi-trash" @click="deleteDialogOpen = true" />
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>

      <Dialog v-model:visible="deleteDialogOpen" modal header="Excluir conta" class="!w-[440px]" :draggable="false">
        <div class="space-y-4">
          <Message severity="error" size="small">Esta ação é permanente e não pode ser desfeita.</Message>
          <p class="text-sm text-surface-600 dark:text-surface-400">
            Todos os dados, lançamentos, contatos e configurações serão excluídos permanentemente.
            Para confirmar, digite <strong class="font-mono text-surface-900 dark:text-surface-0">EXCLUIR</strong> no campo abaixo.
          </p>
          <InputText v-model="deleteConfirmText" placeholder="Digite EXCLUIR para confirmar" class="font-mono" fluid />
          <div class="flex gap-2 pt-1">
            <Button label="Cancelar" severity="secondary" outlined fluid @click="deleteDialogOpen = false; deleteConfirmText = ''" />
            <Button label="Confirmar exclusão" severity="danger" :disabled="!canDelete" fluid />
          </div>
        </div>
      </Dialog>
    </PageContent>

    <!-- Tab: Empresas -->
    <PageContent v-else-if="activeTab === 1">
      <div class="col-span-12">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm text-surface-500">{{ empresas.length }} empresa(s) cadastrada(s)</p>
          <Button label="Adicionar empresa" icon="pi pi-plus" size="small" />
        </div>
        <DataTable :value="empresas" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Empresa" sortable />
          <Column field="cnpj" header="CNPJ" style="width:14rem" />
          <Column field="status" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.status" severity="success" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                @click="openEditEmpresa(data)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </PageContent>

    <!-- Tab: Membros -->
    <PageContent v-else-if="activeTab === 2">
      <div class="col-span-12">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm text-surface-500">{{ membros.length }} membro(s)</p>
          <Button label="Convidar membro" icon="pi pi-user-plus" size="small" @click="inviteDrawerOpen = true" />
        </div>
        <DataTable :value="membros" data-key="id" size="small" class="cpek-table">
          <Column field="nome" header="Nome" sortable />
          <Column field="email" header="E-mail" />
          <Column field="papel" header="Papel" style="width:10rem">
            <template #body="{ data }">
              <Tag :value="data.papel" :severity="data.papel === 'Admin' ? 'warn' : 'secondary'" />
            </template>
          </Column>
          <Column field="status" header="Status" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.status" severity="success" /></template>
          </Column>
          <Column header="" style="width:5rem" body-class="text-right">
            <template #body>
              <Button icon="pi pi-ban" text rounded size="small" severity="danger" />
            </template>
          </Column>
        </DataTable>
      </div>
    </PageContent>

    <!-- Tab: Auditoria -->
    <PageContent v-else-if="activeTab === 3">
      <div class="col-span-12">
        <DataTable :value="auditoria" data-key="id" size="small" class="cpek-table" paginator :rows="10">
          <Column field="data" header="Data / Hora" sortable style="width:13rem" />
          <Column field="autor" header="Autor" sortable style="width:12rem" />
          <Column field="acao" header="Ação" style="width:8rem">
            <template #body="{ data }"><Tag :value="data.acao" :severity="acaoSeverity[data.acao]" /></template>
          </Column>
          <Column field="entidade" header="Entidade" style="width:9rem" />
          <Column field="detalhe" header="Detalhe" />
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-history mb-3 text-3xl text-surface-300" />
              <p class="text-sm text-surface-500">Nenhum evento registrado</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <!-- Dialog: Editar empresa -->
    <Dialog v-model:visible="empresaDrawerOpen" modal header="Editar empresa" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="saveEmpresa">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome da empresa</label>
          <InputText v-model="empresaForm.nome" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">CNPJ</label>
          <InputText v-model="empresaForm.cnpj" fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="empresaDrawerOpen = false" />
          <Button label="Salvar" fluid @click="saveEmpresa" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog: Convidar membro -->
    <Dialog v-model:visible="inviteDrawerOpen" modal header="Convidar membro" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="saveInvite">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
          <InputText v-model="inviteEmail" type="email" placeholder="colaborador@email.com" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Papel</label>
          <Select v-model="inviteRole" :options="roleOptions" fluid />
        </div>
        <Message severity="info" size="small" variant="simple">
          O convidado receberá um e-mail para criar sua senha.
        </Message>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="inviteDrawerOpen = false" />
          <Button label="Enviar convite" fluid @click="saveInvite" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

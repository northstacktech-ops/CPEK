<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, navigateTo } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const route = useRoute()

type Contato = { id: string; nome: string; tipo: string; telefone: string; email: string; cpfCnpj: string; endereco: string; obs: string; status: string }

const contactsMap = ref<Record<string, Contato>>({
  '1': { id: '1', nome: 'Marcos Andrade', tipo: 'Cliente', telefone: '(11) 98765-4321', email: 'marcos@email.com', cpfCnpj: '123.456.789-00', endereco: 'Rua das Flores, 42 — São Paulo, SP', obs: 'Cliente frequente, prefere cautelar.', status: 'Ativo' },
  '2': { id: '2', nome: 'Imobiliária ABC', tipo: 'Fornecedor', telefone: '(11) 3456-7890', email: 'contato@abc.com.br', cpfCnpj: '12.345.678/0001-99', endereco: 'Av. Paulista, 1200 — São Paulo, SP', obs: 'Aluguel sede SP.', status: 'Ativo' },
  '3': { id: '3', nome: 'Ana Lima', tipo: 'Cliente', telefone: '(21) 99123-4567', email: 'ana@email.com', cpfCnpj: '987.654.321-00', endereco: 'Rua Copacabana, 15 — Rio de Janeiro, RJ', obs: '', status: 'Ativo' },
})

const contato = computed(() => contactsMap.value[route.params.id as string] ?? null)

const tipoOptions = ['Cliente', 'Fornecedor']
const editDrawerOpen = ref(false)
const editForm = ref({ nome: '', tipo: 'Cliente', telefone: '', email: '', cpfCnpj: '', endereco: '', obs: '' })

function openEdit() {
  if (!contato.value) return
  const c = contato.value
  editForm.value = { nome: c.nome, tipo: c.tipo, telefone: c.telefone, email: c.email, cpfCnpj: c.cpfCnpj, endereco: c.endereco, obs: c.obs }
  editDrawerOpen.value = true
}

function saveEdit() {
  const id = route.params.id as string
  if (contactsMap.value[id]) {
    contactsMap.value[id] = { ...contactsMap.value[id], ...editForm.value }
  }
  editDrawerOpen.value = false
}

const entradas = [
  { id: 'e1', data: '10/06/2026', servico: 'Cautelar', valor: 320, status: 'Pago' },
  { id: 'e2', data: '15/05/2026', servico: 'Certicar', valor: 480, status: 'Pago' },
  { id: 'e3', data: '02/04/2026', servico: 'Cautelar', valor: 310, status: 'Pago' },
]

const historico = [
  { data: '10/06/2026 14:32', acao: 'Entrada criada', detalhe: 'Cautelar · R$ 320,00', icone: 'pi pi-plus-circle', cor: 'text-green-500' },
  { data: '10/06/2026 14:35', acao: 'Status atualizado', detalhe: 'Em Aberto → Pago', icone: 'pi pi-check-circle', cor: 'text-blue-500' },
  { data: '15/05/2026 09:10', acao: 'Entrada criada', detalhe: 'Certicar · R$ 480,00', icone: 'pi pi-plus-circle', cor: 'text-green-500' },
  { data: '02/04/2026 11:20', acao: 'Contato cadastrado', detalhe: 'Tipo: Cliente', icone: 'pi pi-user-plus', cor: 'text-brand-500' },
]

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const statusSeverity: Record<string, string> = { 'Pago': 'success', 'Em Aberto': 'info', 'Vencido': 'danger' }
</script>

<template>
  <div>
    <div v-if="!contato" class="flex flex-col items-center py-20 text-center">
      <i class="pi pi-user mb-3 text-4xl text-surface-300" />
      <p class="text-surface-500">Contato não encontrado.</p>
      <Button label="Voltar" text icon="pi pi-arrow-left" class="mt-3" @click="navigateTo('/contatos')" />
    </div>

    <template v-else>
      <PageHeader :title="contato.nome">
        <template #breadcrumb>
          <AppBreadcrumb :items="[{ label: 'Contatos', url: '/contatos' }, { label: contato.nome }]" />
        </template>
        <template #actions>
          <Tag :value="contato.tipo" :severity="contato.tipo === 'Cliente' ? 'info' : 'secondary'" />
          <Tag :value="contato.status" severity="success" />
          <Button icon="pi pi-pencil" label="Editar" severity="secondary" outlined size="small" @click="openEdit" />
        </template>
      </PageHeader>

      <PageContent>
        <!-- Dados cadastrais -->
        <div class="col-span-12 lg:col-span-5">
          <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
            <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-surface-400">Dados cadastrais</h3>
            <dl class="space-y-3">
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">CPF / CNPJ</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contato.cpfCnpj }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Telefone</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contato.telefone }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">E-mail</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contato.email }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Endereço</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contato.endereco || '—' }}</dd>
              </div>
              <div v-if="contato.obs" class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Observações</dt>
                <dd class="text-sm text-surface-600 dark:text-surface-400">{{ contato.obs }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Últimas entradas -->
        <div class="col-span-12 lg:col-span-7">
          <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
            <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-surface-400">Últimas entradas</h3>
            <DataTable :value="entradas" data-key="id" size="small" class="cpek-table">
              <Column field="data" header="Data" style="width:9rem" />
              <Column field="servico" header="Serviço">
                <template #body="{ data }"><Tag :value="data.servico" severity="secondary" /></template>
              </Column>
              <Column field="valor" header="Valor">
                <template #body="{ data }"><span class="font-semibold tabular-nums">{{ brl(data.valor) }}</span></template>
              </Column>
              <Column field="status" header="Status">
                <template #body="{ data }"><Tag :value="data.status" :severity="statusSeverity[data.status]" /></template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Histórico de interações -->
        <div class="col-span-12">
          <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
            <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-surface-400">Histórico de interações</h3>
            <ol class="relative border-l border-surface-200 dark:border-surface-700 ml-3">
              <li v-for="(ev, i) in historico" :key="i" class="mb-5 ml-5">
                <span class="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-surface-50 ring-4 ring-surface-0 dark:bg-surface-800 dark:ring-surface-900">
                  <i :class="[ev.icone, ev.cor, 'text-xs']" />
                </span>
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">{{ ev.acao }}</p>
                <p class="mt-0.5 text-xs text-surface-500">{{ ev.detalhe }}</p>
                <time class="mt-0.5 block text-xs text-surface-400">{{ ev.data }}</time>
              </li>
            </ol>
          </div>
        </div>
      </PageContent>
    </template>

    <Dialog v-model:visible="editDrawerOpen" modal header="Editar contato" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="saveEdit">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Tipo</label>
          <SelectButton v-model="editForm.tipo" :options="tipoOptions" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome</label>
          <InputText v-model="editForm.nome" fluid />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Telefone</label>
            <InputMask v-model="editForm.telefone" mask="(99) 99999-9999" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">CPF / CNPJ</label>
            <InputText v-model="editForm.cpfCnpj" fluid />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
          <InputText v-model="editForm.email" type="email" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Endereço</label>
          <InputText v-model="editForm.endereco" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Observações</label>
          <Textarea v-model="editForm.obs" rows="3" fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="editDrawerOpen = false" />
          <Button label="Salvar" fluid @click="saveEdit" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

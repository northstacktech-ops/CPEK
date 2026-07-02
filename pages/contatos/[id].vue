<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigateTo, useRoute } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

interface ContactRecord {
  id: string
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

const route = useRoute()
const company = useCompanyStore()
const { api } = useApi()

const loading = ref(false)
const error = ref<string | null>(null)
const contact = ref<ContactRecord | null>(null)

const typeLabel = computed(() => contact.value?.type === 'SUPPLIER' ? 'Fornecedor' : 'Cliente')
const statusLabel = computed(() => contact.value?.active === false ? 'Inativo' : 'Ativo')

async function loadContact() {
  loading.value = true
  error.value = null

  try {
    const response = await api<{ items: ContactRecord[] }>('/api/contacts', {
      query: { companyId: company.activeId ?? undefined },
    })
    contact.value = response.items.find((item) => item.id === route.params.id) ?? null
  } catch {
    error.value = 'Não foi possível carregar o contato.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadContact()
})
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-3">
      <Skeleton height="2rem" width="16rem" />
      <Skeleton height="16rem" />
    </div>

    <div v-else-if="error" class="flex flex-col items-center py-20 text-center">
      <Message severity="error">{{ error }}</Message>
      <Button label="Voltar" text icon="pi pi-arrow-left" class="mt-3" @click="navigateTo('/contatos')" />
    </div>

    <div v-else-if="!contact" class="flex flex-col items-center py-20 text-center">
      <i class="pi pi-user mb-3 text-4xl text-surface-300" />
      <p class="text-surface-500">Contato não encontrado.</p>
      <Button label="Voltar" text icon="pi pi-arrow-left" class="mt-3" @click="navigateTo('/contatos')" />
    </div>

    <template v-else>
      <PageHeader :title="contact.name">
        <template #breadcrumb>
          <AppBreadcrumb :items="[{ label: 'Contatos', url: '/contatos' }, { label: contact.name }]" />
        </template>
        <template #actions>
          <Tag :value="typeLabel" :severity="typeLabel === 'Cliente' ? 'info' : 'secondary'" />
          <Tag :value="statusLabel" :severity="statusLabel === 'Ativo' ? 'success' : 'secondary'" />
          <Button icon="pi pi-arrow-left" label="Voltar" severity="secondary" outlined size="small" @click="navigateTo('/contatos')" />
        </template>
      </PageHeader>

      <PageContent>
        <div class="col-span-12 lg:col-span-6">
          <div class="rounded-xl border border-surface-200 bg-surface-0 p-5 dark:border-surface-800 dark:bg-surface-900">
            <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-surface-400">Dados cadastrais</h3>
            <dl class="space-y-3">
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">CPF / CNPJ</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contact.taxId || '-' }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Pessoa de contato</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contact.contact || '-' }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Telefone</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contact.phone || '-' }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">E-mail</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contact.email || '-' }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Endereço</dt>
                <dd class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ contact.address || '-' }}</dd>
              </div>
              <div class="flex flex-col gap-0.5">
                <dt class="text-xs text-surface-400">Observações</dt>
                <dd class="text-sm text-surface-600 dark:text-surface-400">{{ contact.notes || '-' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-6">
          <Message severity="info">
            Histórico financeiro do contato será exibido aqui quando a API de relacionamento por contato estiver disponível.
          </Message>
        </div>
      </PageContent>
    </template>
  </div>
</template>

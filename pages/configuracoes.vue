<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'
import { useCompanyStore, type CompanyRef } from '../stores/company'

type CompanyProfile = Required<Omit<CompanyRef, 'id' | 'updatedAt' | 'royaltiesPercent' | 'impostoNfPercent'>> & {
  id: string
  updatedAt: string | null
  // Percentuais fiscais: null = não configurado (InputNumber trabalha com number|null).
  royaltiesPercent: number | null
  impostoNfPercent: number | null
}

const company = useCompanyStore()
const { load: loadCompanies } = useCompany()
const { api } = useApi()

const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const error = ref<string | null>(null)
const savedMessage = ref<string | null>(null)

const hasCompanies = computed(() => company.companies.length > 0)
const createDialogOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const createForm = reactive({ name: '', segment: 'Vistoria Cautelar' })

function openCreateCompany() {
  createForm.name = ''
  createForm.segment = 'Vistoria Cautelar'
  createError.value = null
  createDialogOpen.value = true
}

async function createCompany() {
  if (!createForm.name.trim() || creating.value) return
  creating.value = true
  createError.value = null
  try {
    const response = await api<{ company: CompanyRef }>('/api/companies', {
      method: 'POST',
      body: { name: createForm.name.trim(), segment: createForm.segment },
    })
    await loadCompanies()
    company.setActive(response.company.id)
    applyProfile(response.company)
    createDialogOpen.value = false
  } catch {
    createError.value = 'Não foi possível criar a empresa agora.'
  } finally {
    creating.value = false
  }
}

const emptyProfile: CompanyProfile = {
  id: '',
  name: '',
  legalName: '',
  taxId: '',
  segment: '',
  active: true,
  responsible: '',
  email: '',
  phone: '',
  whatsapp: '',
  zipCode: '',
  address: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: 'RS',
  municipalRegistration: '',
  stateRegistration: '',
  businessHours: '',
  notes: '',
  royaltiesPercent: null,
  impostoNfPercent: null,
  updatedAt: null,
}

const form = reactive<CompanyProfile>({ ...emptyProfile })

const stateOptions = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
].map((value) => ({ label: value, value }))

const segmentOptions = [
  { label: 'Vistoria Cautelar', value: 'Vistoria Cautelar' },
  { label: 'Perícia Veicular', value: 'Perícia Veicular' },
  { label: 'Inspeção Automotiva', value: 'Inspeção Automotiva' },
  { label: 'Administrativo', value: 'Administrativo' },
]

const activeCompany = computed(() => company.active)
const lastUpdateLabel = computed(() => {
  if (!form.updatedAt) return 'Ainda não atualizado'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(form.updatedAt))
})

const addressLine = computed(() => {
  const street = [form.address, form.number].filter(Boolean).join(', ')
  const area = [form.district, form.city, form.state].filter(Boolean).join(' - ')
  return [street, area, form.zipCode].filter(Boolean).join(' · ')
})

const sections = computed(() => [
  {
    title: 'Identificação',
    icon: 'pi pi-building',
    items: [
      { label: 'Nome fantasia', value: form.name },
      { label: 'Razão social', value: form.legalName },
      { label: 'CNPJ', value: form.taxId },
      { label: 'Segmento', value: form.segment },
    ],
  },
  {
    title: 'Contato',
    icon: 'pi pi-phone',
    items: [
      { label: 'Responsável', value: form.responsible },
      { label: 'E-mail', value: form.email },
      { label: 'Telefone', value: form.phone },
      { label: 'WhatsApp', value: form.whatsapp },
    ],
  },
  {
    title: 'Localização',
    icon: 'pi pi-map-marker',
    items: [
      { label: 'Endereço', value: addressLine.value },
      { label: 'Complemento', value: form.complement },
      { label: 'Cidade/UF', value: [form.city, form.state].filter(Boolean).join(' / ') },
      { label: 'CEP', value: form.zipCode },
    ],
  },
  {
    title: 'Fiscal e operação',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Inscrição municipal', value: form.municipalRegistration },
      { label: 'Inscrição estadual', value: form.stateRegistration },
      { label: 'Royalties (%)', value: asPercent(form.royaltiesPercent) },
      { label: 'Imposto NF (%)', value: asPercent(form.impostoNfPercent) },
      { label: 'Horário de atendimento', value: form.businessHours },
      { label: 'Observações', value: form.notes },
    ],
  },
])

function asPercent(value: number | null) {
  if (value == null) return ''
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

function asPercentNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function asText(value: unknown) {
  if (value == null || value === '') return '-'
  return String(value)
}

function normalizeProfile(current: CompanyRef | null): CompanyProfile {
  return {
    ...emptyProfile,
    ...current,
    id: current?.id ?? '',
    name: current?.name ?? '',
    segment: current?.segment ?? '',
    active: current?.active ?? true,
    updatedAt: current?.updatedAt ?? null,
    legalName: current?.legalName ?? '',
    taxId: current?.taxId ?? '',
    responsible: current?.responsible ?? '',
    email: current?.email ?? '',
    phone: current?.phone ?? '',
    whatsapp: current?.whatsapp ?? '',
    zipCode: current?.zipCode ?? '',
    address: current?.address ?? '',
    number: current?.number ?? '',
    complement: current?.complement ?? '',
    district: current?.district ?? '',
    city: current?.city ?? '',
    state: current?.state ?? 'RS',
    municipalRegistration: current?.municipalRegistration ?? '',
    stateRegistration: current?.stateRegistration ?? '',
    businessHours: current?.businessHours ?? '',
    notes: current?.notes ?? '',
    // Decimal do Prisma chega como string no JSON — converter para number.
    royaltiesPercent: asPercentNumber(current?.royaltiesPercent),
    impostoNfPercent: asPercentNumber(current?.impostoNfPercent),
  }
}

function applyProfile(current: CompanyRef | null) {
  Object.assign(form, normalizeProfile(current))
}

function syncCompanyStore(updated: CompanyRef) {
  company.setCompanies(company.companies.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
}

async function reload() {
  loading.value = true
  error.value = null

  try {
    await loadCompanies()
    applyProfile(activeCompany.value)
  } catch {
    error.value = 'Não foi possível carregar os dados da empresa.'
  } finally {
    loading.value = false
  }
}

function startEditing() {
  applyProfile(activeCompany.value)
  savedMessage.value = null
  error.value = null
  editing.value = true
}

function cancelEditing() {
  applyProfile(activeCompany.value)
  editing.value = false
  error.value = null
}

async function saveCompany() {
  if (!activeCompany.value || saving.value) return

  if (!form.name.trim()) {
    error.value = 'Informe o nome fantasia da empresa antes de salvar.'
    savedMessage.value = null
    return
  }

  saving.value = true
  error.value = null
  savedMessage.value = null

  try {
    const response = await api<{ item: CompanyRef }>('/api/companies', {
      method: 'PATCH',
      body: {
        id: form.id,
        name: form.name.trim(),
        legalName: form.legalName || null,
        taxId: form.taxId || null,
        segment: form.segment || null,
        active: form.active,
        responsible: form.responsible || null,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        zipCode: form.zipCode || null,
        address: form.address || null,
        number: form.number || null,
        complement: form.complement || null,
        district: form.district || null,
        city: form.city || null,
        state: form.state || null,
        municipalRegistration: form.municipalRegistration || null,
        stateRegistration: form.stateRegistration || null,
        businessHours: form.businessHours || null,
        notes: form.notes || null,
        // ?? null (não || null): 0% é valor válido.
        royaltiesPercent: form.royaltiesPercent ?? null,
        impostoNfPercent: form.impostoNfPercent ?? null,
      },
    })

    syncCompanyStore(response.item)
    applyProfile(response.item)
    editing.value = false
    savedMessage.value = 'Dados da empresa salvos com sucesso.'
  } catch {
    error.value = 'Não foi possível salvar os dados da empresa agora.'
  } finally {
    saving.value = false
  }
}

onMounted(reload)

watch(
  () => company.activeId,
  () => {
    if (!loading.value) applyProfile(activeCompany.value)
  },
)
</script>

<template>
  <div>
    <PageHeader
      title="Configurações da empresa"
      description="Gerencie os dados cadastrais, localização e operação da empresa ativa."
    >
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Configurações' }, { label: 'Empresa' }]" />
      </template>
      <template #actions>
        <Button
          v-if="hasCompanies && !editing"
          label="Editar"
          icon="pi pi-pencil"
          :disabled="loading || !activeCompany"
          @click="startEditing"
        />
        <div v-else-if="hasCompanies" class="flex gap-2">
          <Button label="Cancelar" severity="secondary" outlined :disabled="saving" @click="cancelEditing" />
          <Button label="Salvar" icon="pi pi-save" :loading="saving" @click="saveCompany" />
        </div>
      </template>
    </PageHeader>

    <PageContent v-if="!loading && !hasCompanies">
      <Card class="col-span-12 border border-surface-200 dark:border-surface-800">
        <template #content>
          <div class="flex flex-col items-center gap-3 py-10 text-center">
            <i class="pi pi-building text-4xl text-surface-300" />
            <h2 class="text-lg font-bold text-surface-900 dark:text-surface-0">Nenhuma empresa cadastrada</h2>
            <p class="max-w-sm text-sm text-surface-500">
              Crie a primeira empresa da sua conta para começar a lançar entradas, saídas e fechamentos.
            </p>
            <Button label="Criar empresa" icon="pi pi-plus" @click="openCreateCompany" />
          </div>
        </template>
      </Card>
    </PageContent>

    <PageContent v-else>
      <Message v-if="error" severity="error" size="small" class="col-span-12">
        {{ error }}
      </Message>
      <Message v-if="savedMessage" severity="success" size="small" class="col-span-12">
        {{ savedMessage }}
      </Message>

      <div v-if="loading" class="col-span-12 grid grid-cols-1 gap-3 xl:grid-cols-4">
        <Card v-for="index in 4" :key="index" class="border border-surface-200 dark:border-surface-800">
          <template #content>
            <Skeleton width="8rem" height="1rem" class="mb-4" />
            <div class="space-y-3">
              <Skeleton v-for="line in 4" :key="line" height="1.75rem" />
            </div>
          </template>
        </Card>
      </div>

      <template v-else>
        <Card class="col-span-12 border border-surface-200 dark:border-surface-800">
          <template #content>
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-xl font-bold text-surface-900 dark:text-surface-0">{{ form.name || 'Empresa sem nome' }}</h2>
                  <Tag :value="form.active ? 'Ativa' : 'Inativa'" :severity="form.active ? 'success' : 'secondary'" />
                </div>
                <p class="text-sm text-surface-500">{{ form.legalName || 'Razão social não informada' }}</p>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm md:w-auto">
                <div class="rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-800">
                  <span class="block text-[10px] font-bold uppercase tracking-wide text-surface-400">Cidade</span>
                  <strong class="text-surface-800 dark:text-surface-100">{{ asText(form.city) }}</strong>
                </div>
                <div class="rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-800">
                  <span class="block text-[10px] font-bold uppercase tracking-wide text-surface-400">Atualização</span>
                  <strong class="text-surface-800 dark:text-surface-100">{{ lastUpdateLabel }}</strong>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <template v-if="!editing">
          <Card
            v-for="section in sections"
            :key="section.title"
            class="col-span-12 border border-surface-200 dark:border-surface-800 lg:col-span-6"
          >
            <template #title>
              <span class="flex items-center gap-2 text-base">
                <i :class="section.icon" class="text-brand-600" />
                {{ section.title }}
              </span>
            </template>
            <template #content>
              <dl class="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2">
                <div v-for="item in section.items" :key="item.label" class="min-w-0">
                  <dt class="text-[10px] font-bold uppercase tracking-wide text-surface-400">{{ item.label }}</dt>
                  <dd class="mt-1 break-words text-sm font-medium text-surface-800 dark:text-surface-100">
                    {{ asText(item.value) }}
                  </dd>
                </div>
              </dl>
            </template>
          </Card>
        </template>

        <form v-else class="col-span-12 grid grid-cols-12 gap-3" @submit.prevent="saveCompany">
          <Card class="col-span-12 border border-surface-200 dark:border-surface-800">
            <template #title>Editar dados da empresa</template>
            <template #subtitle>Altere somente os campos necessários e salve para persistir no Supabase.</template>
            <template #content>
              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-12 md:col-span-6">
                  <label for="company-name" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Nome fantasia</label>
                  <InputText id="company-name" v-model="form.name" fluid />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <label for="company-legal-name" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Razão social</label>
                  <InputText id="company-legal-name" v-model="form.legalName" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-tax-id" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">CNPJ</label>
                  <InputMask id="company-tax-id" v-model="form.taxId" mask="99.999.999/9999-99" fluid />
                </div>
                <div class="col-span-12 md:col-span-5">
                  <label for="company-segment" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Segmento</label>
                  <Select id="company-segment" v-model="form.segment" :options="segmentOptions" option-label="label" option-value="value" editable fluid />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <label for="company-active" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Status</label>
                  <div class="flex h-10 items-center gap-3">
                    <ToggleSwitch input-id="company-active" v-model="form.active" />
                    <Tag :value="form.active ? 'Ativa' : 'Inativa'" :severity="form.active ? 'success' : 'secondary'" />
                  </div>
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-responsible" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Responsável</label>
                  <InputText id="company-responsible" v-model="form.responsible" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-email" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
                  <InputText id="company-email" v-model="form.email" type="email" fluid />
                </div>
                <div class="col-span-12 md:col-span-2">
                  <label for="company-phone" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Telefone</label>
                  <InputText id="company-phone" v-model="form.phone" fluid />
                </div>
                <div class="col-span-12 md:col-span-2">
                  <label for="company-whatsapp" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">WhatsApp</label>
                  <InputText id="company-whatsapp" v-model="form.whatsapp" fluid />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <label for="company-zip-code" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">CEP</label>
                  <InputMask id="company-zip-code" v-model="form.zipCode" mask="99999-999" fluid />
                </div>
                <div class="col-span-12 md:col-span-6">
                  <label for="company-address" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Endereço</label>
                  <InputText id="company-address" v-model="form.address" fluid />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <label for="company-number" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Número</label>
                  <InputText id="company-number" v-model="form.number" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-complement" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Complemento</label>
                  <InputText id="company-complement" v-model="form.complement" fluid />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <label for="company-district" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Bairro</label>
                  <InputText id="company-district" v-model="form.district" fluid />
                </div>
                <div class="col-span-12 md:col-span-3">
                  <label for="company-city" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Cidade</label>
                  <InputText id="company-city" v-model="form.city" fluid />
                </div>
                <div class="col-span-12 md:col-span-2">
                  <label for="company-state" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">UF</label>
                  <Select id="company-state" v-model="form.state" :options="stateOptions" option-label="label" option-value="value" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-municipal-registration" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Inscrição municipal
                  </label>
                  <InputText id="company-municipal-registration" v-model="form.municipalRegistration" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-state-registration" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Inscrição estadual
                  </label>
                  <InputText id="company-state-registration" v-model="form.stateRegistration" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-business-hours" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Horário de atendimento
                  </label>
                  <InputText id="company-business-hours" v-model="form.businessHours" fluid />
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-royalties" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Royalties (%)
                  </label>
                  <InputNumber
                    id="company-royalties"
                    v-model="form.royaltiesPercent"
                    suffix="%"
                    mode="decimal"
                    :min="0"
                    :max="100"
                    :max-fraction-digits="2"
                    locale="pt-BR"
                    placeholder="Ex.: 11%"
                    fluid
                  />
                  <p class="mt-1 text-xs text-surface-400">Percentual pago à franqueadora sobre o faturamento. Usado no dashboard.</p>
                </div>
                <div class="col-span-12 md:col-span-4">
                  <label for="company-imposto-nf" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Imposto NF (%)
                  </label>
                  <InputNumber
                    id="company-imposto-nf"
                    v-model="form.impostoNfPercent"
                    suffix="%"
                    mode="decimal"
                    :min="0"
                    :max="100"
                    :max-fraction-digits="2"
                    locale="pt-BR"
                    placeholder="Ex.: 6%"
                    fluid
                  />
                  <p class="mt-1 text-xs text-surface-400">Percentual de imposto sobre entradas com nota fiscal emitida.</p>
                </div>
                <div class="col-span-12">
                  <label for="company-notes" class="mb-1 block text-xs font-semibold uppercase tracking-wide text-surface-500">Observações internas</label>
                  <Textarea id="company-notes" v-model="form.notes" rows="3" fluid />
                </div>
              </div>
            </template>
          </Card>
        </form>
      </template>
    </PageContent>

    <Dialog v-model:visible="createDialogOpen" modal header="Criar empresa" class="!w-[440px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="createCompany">
        <Message v-if="createError" severity="error" size="small">{{ createError }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nome fantasia</label>
          <InputText v-model="createForm.name" fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Segmento</label>
          <Select v-model="createForm.segment" :options="segmentOptions" option-label="label" option-value="value" editable fluid />
        </div>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="createDialogOpen = false" />
          <Button label="Criar" :loading="creating" :disabled="!createForm.name.trim()" fluid @click="createCompany" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'
import { useCompanyStore } from '../stores/company'
import { usePeriodStore } from '../stores/period'

interface PeriodRecord {
  id: string
  companyId: string
  month: number
  year: number
  status: 'OPEN' | 'CLOSED'
  closedAt?: string | null
}

interface PeriodRow {
  id: string
  competencia: string
  inicio: string
  fim: string
  status: 'Aberto' | 'Fechado'
  raw: PeriodRecord
}

const company = useCompanyStore()
const periodStore = usePeriodStore()
const { api } = useApi()

const drawerOpen = ref(false)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const form = ref({ competencia: new Date(periodStore.year, periodStore.month - 1, 1) as Date | null })

const periodos = ref<PeriodRow[]>([])
const activePeriodId = computed(() => periodStore.periodId)

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR')
}

function monthLabel(month: number, year: number) {
  const date = new Date(year, month - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function normalizePeriod(period: PeriodRecord): PeriodRow {
  const firstDay = new Date(period.year, period.month - 1, 1)
  const lastDay = new Date(period.year, period.month, 0)
  return {
    id: period.id,
    competencia: monthLabel(period.month, period.year),
    inicio: formatDate(firstDay),
    fim: formatDate(lastDay),
    status: period.status === 'CLOSED' ? 'Fechado' : 'Aberto',
    raw: period,
  }
}

async function loadPeriods() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const response = await api<{ items: PeriodRecord[] }>('/api/periods', {
      query: { companyId: company.activeId },
    })
    periodos.value = response.items.map(normalizePeriod)
    const active = response.items.find((item) => item.month === periodStore.month && item.year === periodStore.year)
    if (active) {
      periodStore.periodId = active.id
      periodStore.status = active.status
    }
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível carregar os períodos.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (saving.value) return
  if (!company.activeId) {
    error.value = 'Selecione ou crie uma empresa em Configurações antes de criar um período.'
    return
  }
  if (!form.value.competencia) {
    error.value = 'Selecione a competência do período.'
    return
  }
  saving.value = true
  error.value = null

  try {
    const selected = form.value.competencia
    const response = await api<{ item: PeriodRecord }>('/api/periods', {
      method: 'POST',
      body: {
        companyId: company.activeId,
        month: selected.getMonth() + 1,
        year: selected.getFullYear(),
      },
    })
    const normalized = normalizePeriod(response.item)
    periodos.value = [normalized, ...periodos.value.filter((item) => item.id !== normalized.id)]
    periodStore.set(response.item.month, response.item.year)
    periodStore.periodId = response.item.id
    periodStore.status = response.item.status
    drawerOpen.value = false
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível criar o período.')
  } finally {
    saving.value = false
  }
}

function setActive(row: PeriodRow) {
  periodStore.set(row.raw.month, row.raw.year)
  periodStore.periodId = row.id
  periodStore.status = row.raw.status
}

async function closePeriod(row: PeriodRow) {
  if (!window.confirm(`Fechar ${row.competencia}? Lançamentos deste período ficarão bloqueados.`)) return
  try {
    const response = await api<{ item: PeriodRecord }>(`/api/periods/${row.id}/close`, {
      method: 'POST',
      body: { confirm: true },
    })
    periodos.value = periodos.value.map((item) => (item.id === row.id ? normalizePeriod(response.item) : item))
    if (activePeriodId.value === row.id) periodStore.status = response.item.status
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível fechar o período.')
  }
}

async function reopenPeriod(row: PeriodRow) {
  if (!window.confirm(`Reabrir ${row.competencia}? Novos lançamentos voltarão a ser permitidos.`)) return
  try {
    const response = await api<{ item: PeriodRecord }>(`/api/periods/${row.id}/reopen`, { method: 'POST' })
    periodos.value = periodos.value.map((item) => (item.id === row.id ? normalizePeriod(response.item) : item))
    if (activePeriodId.value === row.id) periodStore.status = response.item.status
  } catch (err) {
    error.value = apiErrorMessage(err, 'Não foi possível reabrir o período.')
  }
}

watch(() => company.activeId, () => {
  void loadPeriods()
})

onMounted(() => {
  void loadPeriods()
})
</script>

<template>
  <div>
    <PageHeader title="Períodos" description="Competências mensais fixas, sempre do primeiro ao último dia do mês.">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Períodos' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo período" size="small" @click="drawerOpen = true" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12">
        <UiTableSkeleton v-if="loading" :rows="6" :columns="5" />

        <DataTable v-else :value="periodos" data-key="id" size="small" class="cpek-table" scrollable>
          <Column field="competencia" header="Competência mensal" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ data.competencia }}</span>
                <Tag v-if="data.id === activePeriodId" value="Ativo" severity="info" />
              </div>
            </template>
          </Column>
          <Column field="inicio" header="Início fixo" style="width:10rem" />
          <Column field="fim" header="Fim fixo" style="width:10rem" />
          <Column field="status" header="Status" sortable style="width:9rem">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="data.status === 'Aberto' ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="" style="width:15rem" body-class="text-right">
            <template #body="{ data }">
              <div class="flex justify-end gap-1">
                <Button label="Usar" icon="pi pi-check" text size="small" severity="secondary" @click="setActive(data)" />
                <Button
                  v-if="data.status === 'Aberto'"
                  label="Fechar"
                  icon="pi pi-lock"
                  text
                  size="small"
                  severity="warn"
                  @click="closePeriod(data)"
                />
                <Button
                  v-else
                  label="Reabrir"
                  icon="pi pi-lock-open"
                  text
                  size="small"
                  severity="secondary"
                  @click="reopenPeriod(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-calendar mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhum período cadastrado</p>
              <p class="mt-1 text-xs text-surface-400">Crie a competência mensal antes de lançar movimentos.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal header="Novo período mensal" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <Message v-if="error" severity="error" size="small">{{ error }}</Message>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Competência</label>
          <DatePicker v-model="form.competencia" view="month" date-format="MM yy" show-icon fluid />
        </div>
        <Message severity="info" size="small" variant="simple">
          A competência sempre começa no dia 1 e termina no último dia do mês selecionado.
        </Message>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button label="Criar período" :loading="saving" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

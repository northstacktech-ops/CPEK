<script setup lang="ts">
import type { DashboardData } from '../types/dashboard'
import { computed, onMounted, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageContent from '../components/layout/PageContent.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import { useCompanyStore } from '../stores/company'
import { usePeriodStore } from '../stores/period'

const company = useCompanyStore()
const periodStore = usePeriodStore()
const { load } = useDashboard()

const period = ref(new Date(periodStore.year, periodStore.month - 1, 1))
const accountSearch = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const dashboard = ref<DashboardData | null>(null)
const reducedMotion = ref(false)

const emptyDashboard = computed<DashboardData>(() => ({
  cards: { faturamentoBruto: 0, despesas: 0, lucroReal: 0, ticketMedio: 0, vencidos: 0, royalties: null, impostoNf: null },
  accounts: [],
  consolidatedBalance: 0,
  cashFlow: Array.from({ length: 12 }, (_, index) => ({
    date: `${periodStore.year}-${String(index + 1).padStart(2, '0')}-01`,
    realized: 0,
    planned: 0,
  })),
}))

async function refreshDashboard() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    dashboard.value = await load()
  } catch (err) {
    dashboard.value = null
    error.value = apiErrorMessage(err, 'Não foi possível carregar o painel. Verifique sua conexão e tente novamente.')
  } finally {
    loading.value = false
  }
}

watch(period, (value) => {
  periodStore.set(value.getMonth() + 1, value.getFullYear())
  void refreshDashboard()
})

watch(() => company.activeId, () => {
  void refreshDashboard()
})

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  void refreshDashboard()
})

const currentData = computed(() => dashboard.value ?? emptyDashboard.value)

const kpis = computed(() => {
  const cards = currentData.value.cards
  const margin = cards.faturamentoBruto ? (cards.lucroReal / cards.faturamentoBruto) * 100 : 0

  return [
    { label: 'Lucro Real', value: cards.lucroReal, reference: `Margem ${margin.toFixed(1)}%`, icon: 'pi pi-chart-line', severity: 'success', featured: true },
    { label: 'Faturamento', value: cards.faturamentoBruto, reference: 'Bruto no período', icon: 'pi pi-arrow-up-right', severity: 'info' },
    { label: 'Despesas', value: cards.despesas, reference: 'Saídas registradas', icon: 'pi pi-credit-card', severity: 'danger' },
    { label: 'Ticket Médio', value: cards.ticketMedio, reference: 'por entrada', icon: 'pi pi-shopping-cart', severity: 'secondary' },
    { label: 'Vencidos', value: cards.vencidos, reference: 'Pendências abertas', icon: 'pi pi-exclamation-triangle', severity: 'warn' },
  ]
})

// 2ª linha — cards fiscais (Royalties/Imposto NF). value null = percentual não
// configurado em /configuracoes: mostra hint em vez de R$ 0,00 enganoso.
const fiscalKpis = computed(() => {
  const cards = currentData.value.cards
  return [
    {
      label: 'Royalties a Pagar',
      value: cards.royalties,
      reference: 'Percentual sobre o faturamento',
      icon: 'pi pi-building-columns',
      severity: 'warn',
    },
    {
      label: 'Imposto NF',
      value: cards.impostoNf,
      reference: 'Sobre entradas com nota emitida',
      icon: 'pi pi-file-check',
      severity: 'info',
    },
  ]
})

const accounts = computed(() =>
  currentData.value.accounts.map((account) => ({
    id: account.bankAccountId,
    name: account.name,
    type: 'Conta bancária',
    balance: account.balance,
  })),
)

const filteredAccounts = computed(() => {
  const q = accountSearch.value.trim().toLowerCase()
  if (!q) return accounts.value
  return accounts.value.filter((account) => `${account.name} ${account.type}`.toLowerCase().includes(q))
})

const chartData = computed(() => ({
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  datasets: [
    {
      label: 'Realizado',
      data: currentData.value.cashFlow.map((point, index) => (index + 1 <= periodStore.month ? point.realized : null)),
      borderColor: '#163E75',
      backgroundColor: 'rgba(22, 62, 117, 0.1)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: false,
    },
    {
      label: 'Previsto',
      data: currentData.value.cashFlow.map((point) => point.planned),
      borderColor: '#C43A34',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      borderDash: [4, 4],
    },
  ],
}))

const chartOptions = computed(() => ({
  maintainAspectRatio: false,
  responsive: true,
  resizeDelay: 120,
  animation: reducedMotion.value
    ? false
    : {
        duration: 950,
        easing: 'easeOutQuart',
      },
  animations: reducedMotion.value
    ? {}
    : {
        tension: {
          duration: 800,
          easing: 'easeOutCubic',
          from: 0.12,
          to: 0.35,
        },
        y: {
          duration: 900,
          easing: 'easeOutQuart',
          from: 0,
        },
      },
  transitions: {
    active: {
      animation: {
        duration: reducedMotion.value ? 0 : 180,
      },
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'start' as const,
      labels: { boxHeight: 2, boxWidth: 24, color: '#94A3B8', font: { size: 11, weight: '600' } },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
          `${ctx.dataset.label}: ${ctx.parsed.y == null ? '-' : brl(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148,163,184,0.15)' },
      ticks: { color: '#94A3B8', font: { size: 11 }, callback: (v: number | string) => `R$${Number(v) / 1000}k` },
    },
  },
}))

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
  <div>
    <PageHeader
      title="Painel"
      :description="`${company.active?.name ?? 'Empresa'} · ${periodStore.label}`"
    >
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Painel' }]" />
      </template>
      <template #actions>
        <DatePicker v-model="period" view="month" date-format="MM yy" show-icon aria-label="Período do painel" />
        <Button icon="pi pi-plus" label="Novo lançamento" size="small" @click="navigateTo('/lancamentos/entradas')" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">
        {{ error }}
      </Message>

      <div class="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div
          v-for="kpi in kpis"
          :key="kpi.label"
          class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-800 dark:bg-surface-900"
          :class="kpi.featured ? '!border-transparent !bg-brand-600 text-white' : ''"
        >
          <template v-if="loading">
            <Skeleton width="5rem" height="0.75rem" class="mb-3" />
            <Skeleton width="8rem" height="1.5rem" class="mb-2" />
            <Skeleton width="4rem" height="0.75rem" />
          </template>
          <template v-else>
            <div class="mb-3 flex items-center justify-between">
              <span
                class="text-[10px] font-bold uppercase tracking-widest"
                :class="kpi.featured ? 'text-white/70' : 'text-surface-400'"
              >{{ kpi.label }}</span>
              <Tag :icon="kpi.icon" :severity="kpi.featured ? 'contrast' : kpi.severity" rounded value="" :aria-label="kpi.label" size="small" />
            </div>
            <strong
              class="block text-xl font-bold tabular-nums"
              :class="kpi.featured ? 'text-white' : 'text-surface-900 dark:text-surface-0'"
            >{{ brl(kpi.value) }}</strong>
            <span
              class="mt-1 block text-xs"
              :class="kpi.featured ? 'text-white/60' : 'text-surface-400'"
            >{{ kpi.reference }}</span>
          </template>
        </div>
      </div>

      <div class="col-span-12 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="kpi in fiscalKpis"
          :key="kpi.label"
          class="rounded-xl border border-surface-200 bg-surface-0 p-4 dark:border-surface-800 dark:bg-surface-900"
        >
          <template v-if="loading">
            <Skeleton width="5rem" height="0.75rem" class="mb-3" />
            <Skeleton width="8rem" height="1.5rem" class="mb-2" />
            <Skeleton width="4rem" height="0.75rem" />
          </template>
          <template v-else>
            <div class="mb-3 flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-widest text-surface-400">{{ kpi.label }}</span>
              <Tag :icon="kpi.icon" :severity="kpi.severity" rounded value="" :aria-label="kpi.label" size="small" />
            </div>
            <template v-if="kpi.value != null">
              <strong class="block text-xl font-bold tabular-nums text-surface-900 dark:text-surface-0">{{ brl(kpi.value) }}</strong>
              <span class="mt-1 block text-xs text-surface-400">{{ kpi.reference }}</span>
            </template>
            <template v-else>
              <strong class="block text-xl font-bold text-surface-300 dark:text-surface-600">—</strong>
              <NuxtLink to="/configuracoes" class="mt-1 block text-xs text-brand-600 hover:underline">
                Configure o percentual em Configurações
              </NuxtLink>
            </template>
          </template>
        </div>
      </div>

      <Card class="col-span-12 border border-surface-200 dark:border-surface-800 xl:col-span-5">
        <template #title>
          <span>Contas bancárias</span>
        </template>
        <template #content>
          <div class="relative mb-3">
            <i class="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400" />
            <InputText v-model="accountSearch" placeholder="Buscar conta" size="small" class="w-full pl-9" />
          </div>
          <UiTableSkeleton v-if="loading" :rows="5" :columns="2" />

          <DataTable
            v-else
            :value="filteredAccounts"
            data-key="id"
            :rows="5"
            size="small"
            sort-field="balance"
            :sort-order="-1"
          >
            <Column field="name" header="Conta" sortable>
              <template #body="{ data }">
                <div>
                  <p class="text-sm font-semibold text-surface-900 dark:text-surface-0">{{ data.name }}</p>
                  <p class="text-xs text-surface-400">{{ data.type }}</p>
                </div>
              </template>
            </Column>
            <Column field="balance" header="Saldo" sortable class="text-right">
              <template #body="{ data }">
                <span class="font-semibold tabular-nums">{{ brl(data.balance) }}</span>
              </template>
            </Column>
            <template #empty>
              <div class="py-8 text-center text-sm text-surface-400">
                Nenhuma conta encontrada. Cadastre uma conta para acompanhar o saldo.
              </div>
            </template>
          </DataTable>
          <Divider class="!my-3" />
          <div class="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-600/15">
            <span class="text-sm font-semibold text-brand-700 dark:text-brand-200">Saldo Consolidado</span>
            <strong class="text-base tabular-nums text-brand-700 dark:text-brand-200">{{ brl(currentData.consolidatedBalance) }}</strong>
          </div>
        </template>
      </Card>

      <Card class="col-span-12 border border-surface-200 dark:border-surface-800 xl:col-span-7">
        <template #title>Fluxo de Caixa Acumulado</template>
        <template #subtitle>Realizado até o período selecionado · Previsto para o ano</template>
        <template #content>
          <Skeleton v-if="loading" height="14rem" />
          <ClientOnly v-else>
            <Chart type="line" :data="chartData" :options="chartOptions" class="h-64 md:h-72" />
            <template #fallback>
              <Skeleton height="14rem" />
            </template>
          </ClientOnly>
        </template>
      </Card>
    </PageContent>
  </div>
</template>

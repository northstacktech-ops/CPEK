<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#imports'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageContent from '../components/layout/PageContent.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import { useCompanyStore } from '../stores/company'

const company = useCompanyStore()
const period = ref(new Date(2026, 5, 1))
const accountSearch = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const companyData = {
  sp: {
    kpis: [
      { label: 'Lucro Real', value: 27600, reference: 'Margem 55,8%', icon: 'pi pi-chart-line', severity: 'success', featured: true },
      { label: 'Faturamento', value: 49420, reference: 'Prev. R$ 58.315', icon: 'pi pi-arrow-up-right', severity: 'info' },
      { label: 'Despesas', value: 21820, reference: 'Prev. R$ 23.129', icon: 'pi pi-credit-card', severity: 'danger' },
      { label: 'Ticket Médio', value: 3088.75, reference: 'por entrada', icon: 'pi pi-shopping-cart', severity: 'secondary' },
      { label: 'Vencidos', value: 13910, reference: '5 em atraso', icon: 'pi pi-exclamation-triangle', severity: 'warn' },
    ],
    accounts: [
      { id: 'bol-itau', name: 'Boleto Itaú', type: 'Recebimento', balance: 88067.75 },
      { id: 'cx-loja', name: 'Caixa Loja', type: 'Caixa', balance: 794.5 },
      { id: 'card', name: 'Cartão Créd./Déb.', type: 'Cartão', balance: 15376.5 },
      { id: 'cortesia', name: 'Conta Cortesia', type: 'Cortesia', balance: 10081.8 },
    ],
    chartRealizado: [15200, 32200, 51500, 71200, 89500, 114320, null, null, null, null, null, null],
    chartPrevisto: [17800, 36500, 56800, 78200, 99200, 121500, 150000, 176000, 202000, 228000, 252000, 278000],
  },
  rj: {
    kpis: [
      { label: 'Lucro Real', value: 18400, reference: 'Margem 51,2%', icon: 'pi pi-chart-line', severity: 'success', featured: true },
      { label: 'Faturamento', value: 35920, reference: 'Prev. R$ 42.000', icon: 'pi pi-arrow-up-right', severity: 'info' },
      { label: 'Despesas', value: 17520, reference: 'Prev. R$ 18.900', icon: 'pi pi-credit-card', severity: 'danger' },
      { label: 'Ticket Médio', value: 2244, reference: 'por entrada', icon: 'pi pi-shopping-cart', severity: 'secondary' },
      { label: 'Vencidos', value: 8250, reference: '3 em atraso', icon: 'pi pi-exclamation-triangle', severity: 'warn' },
    ],
    accounts: [
      { id: 'itau-rj', name: 'Conta Itaú RJ', type: 'Recebimento', balance: 52340.20 },
      { id: 'cx-rj', name: 'Caixa RJ', type: 'Caixa', balance: 1230.80 },
      { id: 'card-rj', name: 'Cartão Empresarial', type: 'Cartão', balance: 9876.0 },
    ],
    chartRealizado: [9800, 19200, 30100, 41500, 54200, 69120, null, null, null, null, null, null],
    chartPrevisto: [11000, 22000, 34000, 47000, 61000, 76000, 93000, 110000, 128000, 145000, 162000, 180000],
  },
}

const currentData = computed(() => {
  return company.active?.name?.includes('RJ') ? companyData.rj : companyData.sp
})

const kpis = computed(() => currentData.value.kpis)
const accounts = computed(() => currentData.value.accounts)

const filteredAccounts = computed(() => {
  const q = accountSearch.value.trim().toLowerCase()
  if (!q) return accounts.value
  return accounts.value.filter((a) => `${a.name} ${a.type}`.toLowerCase().includes(q))
})

const consolidatedBalance = computed(() => accounts.value.reduce((t, a) => t + a.balance, 0))

const chartData = computed(() => ({
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  datasets: [
    {
      label: 'Realizado',
      data: currentData.value.chartRealizado,
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
      data: currentData.value.chartPrevisto,
      borderColor: '#C43A34',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      borderDash: [4, 4],
    },
  ],
}))

const chartOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'start' as const,
      labels: { boxHeight: 2, boxWidth: 24, color: '#94A3B8', font: { family: 'Inter', size: 11, weight: '600' } },
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
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
</script>

<template>
  <div>
    <PageHeader
      title="Painel"
      :description="`${company.active?.name ?? 'Empresa'} · Junho de 2026`"
    >
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Painel' }]" />
      </template>
      <template #actions>
        <DatePicker v-model="period" view="month" date-format="MM yy" show-icon aria-label="Período do painel" />
        <Button icon="pi pi-plus" label="Novo lançamento" size="small" @click="navigateTo('/lancamentos/entradas')" />
      </template>
    </PageHeader>

    <Message severity="info" size="small" class="mb-4">
      Dados de demonstração — APIs em implementação.
    </Message>

    <PageContent>
      <!-- KPIs -->
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

      <!-- Contas -->
      <Card class="col-span-12 border border-surface-200 dark:border-surface-800 xl:col-span-5">
        <template #title>
          <span>Contas bancárias</span>
        </template>
        <template #content>
          <div class="relative mb-3">
            <i class="pi pi-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-surface-400" />
            <InputText v-model="accountSearch" placeholder="Buscar conta" size="small" class="w-full pl-9" />
          </div>
          <DataTable
            :value="filteredAccounts"
            data-key="id"
            :loading="loading"
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
              <div class="py-8 text-center text-sm text-surface-400">Nenhuma conta encontrada.</div>
            </template>
          </DataTable>
          <Divider class="!my-3" />
          <div class="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 dark:bg-brand-600/15">
            <span class="text-sm font-semibold text-brand-700 dark:text-brand-200">Saldo Consolidado</span>
            <strong class="text-base tabular-nums text-brand-700 dark:text-brand-200">{{ brl(consolidatedBalance) }}</strong>
          </div>
        </template>
      </Card>

      <!-- Gráfico -->
      <Card class="col-span-12 border border-surface-200 dark:border-surface-800 xl:col-span-7">
        <template #title>Fluxo de Caixa Acumulado</template>
        <template #subtitle>Realizado até jun · Previsto até dez</template>
        <template #content>
          <Message v-if="error" severity="error" size="small" class="mb-3">{{ error }}</Message>
          <Skeleton v-if="loading" height="14rem" />
          <Chart v-else type="line" :data="chartData" :options="chartOptions" class="h-56" />
        </template>
      </Card>
    </PageContent>
  </div>
</template>

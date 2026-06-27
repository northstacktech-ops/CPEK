<script setup lang="ts">
import { ref, computed } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'

const year = ref(2026)
const modoRealizado = ref(true)
const expandedRows = ref<Record<string, boolean>>({})

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const mesAtual = 5 // junho (0-indexed)

// Mock DRE data
const rows = [
  {
    id: 'receita-op',
    label: 'Receita Operacional',
    indent: 0,
    bold: true,
    sign: 1,
    valores: [15200, 17000, 19300, 18500, 19420, 19420, 0, 0, 0, 0, 0, 0],
    children: [
      { id: 'cautelar', label: 'Cautelar', indent: 1, sign: 1, valores: [6800, 7500, 8200, 8000, 8500, 8500, 0, 0, 0, 0, 0, 0] },
      { id: 'certicar', label: 'Certicar', indent: 1, sign: 1, valores: [5400, 6000, 7100, 6500, 7200, 7200, 0, 0, 0, 0, 0, 0] },
      { id: 'constatacao', label: 'Constatação', indent: 1, sign: 1, valores: [3000, 3500, 4000, 4000, 3720, 3720, 0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    id: 'custo-op',
    label: '(−) Custo Operacional',
    indent: 0,
    bold: true,
    sign: -1,
    valores: [2400, 2600, 2900, 2750, 3100, 3100, 0, 0, 0, 0, 0, 0],
    children: [
      { id: 'km', label: 'Combustível / KM', indent: 1, sign: -1, valores: [1200, 1300, 1500, 1400, 1600, 1600, 0, 0, 0, 0, 0, 0] },
      { id: 'manutencao', label: 'Manutenção veicular', indent: 1, sign: -1, valores: [1200, 1300, 1400, 1350, 1500, 1500, 0, 0, 0, 0, 0, 0] },
    ],
  },
  { id: 'margem', label: '= Margem de Contribuição', indent: 0, bold: true, separator: true, sign: 1, valores: [12800, 14400, 16400, 15750, 16320, 16320, 0, 0, 0, 0, 0, 0] },
  { id: 'margem-pct', label: 'Margem (%)', indent: 1, sign: 1, percent: true, valores: [84, 85, 85, 85, 84, 84, 0, 0, 0, 0, 0, 0] },
  {
    id: 'despesas-op',
    label: '(−) Despesas Operacionais',
    indent: 0,
    bold: true,
    sign: -1,
    valores: [10900, 11500, 12600, 12100, 12820, 12820, 0, 0, 0, 0, 0, 0],
    children: [
      { id: 'aluguel', label: 'Aluguel', indent: 1, sign: -1, valores: [3200, 3200, 3200, 3200, 3200, 3200, 0, 0, 0, 0, 0, 0] },
      { id: 'folha', label: 'Folha de Pagamento', indent: 1, sign: -1, valores: [6500, 7000, 8000, 7500, 8500, 8500, 0, 0, 0, 0, 0, 0] },
      { id: 'mkt', label: 'Marketing', indent: 1, sign: -1, valores: [1200, 1300, 1400, 1400, 1120, 1120, 0, 0, 0, 0, 0, 0] },
    ],
  },
  { id: 'resultado-op', label: '= Resultado Operacional', indent: 0, bold: true, separator: true, sign: 1, valores: [1900, 2900, 3800, 3650, 3500, 3500, 0, 0, 0, 0, 0, 0] },
  { id: 'variacao', label: '= Variação de Caixa', indent: 0, bold: true, highlight: true, sign: 1, valores: [1900, 2900, 3800, 3650, 3500, 3500, 0, 0, 0, 0, 0, 0] },
]

function toggleRow(id: string) {
  expandedRows.value[id] = !expandedRows.value[id]
}

const brl = (v: number) => {
  if (v === 0) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const total = (valores: number[]) => valores.reduce((a, b) => a + b, 0)

function isMuted(i: number) { return !modoRealizado.value ? false : i > mesAtual }
</script>

<template>
  <div>
    <PageHeader title="DRE" description="Demonstrativo de Resultado · Ano 2026">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'DRE' }]" />
      </template>
      <template #actions>
        <div class="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3 py-1.5 text-sm dark:border-surface-800 dark:bg-surface-900">
          <span class="text-surface-500">Realizado</span>
          <ToggleSwitch v-model="modoRealizado" aria-label="Mostrar somente realizado" />
        </div>
        <Button icon="pi pi-download" label="Exportar CSV" severity="secondary" outlined size="small" />
        <Button icon="pi pi-file-pdf" label="PDF" severity="secondary" outlined size="small" />
      </template>
    </PageHeader>

    <PageContent>
      <div class="col-span-12 overflow-x-auto">
        <table class="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-surface-200 dark:border-surface-800">
              <th class="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-surface-400" style="min-width:200px">Linha contábil</th>
              <th v-for="(mes, i) in meses" :key="mes" class="py-2 px-2 text-right text-xs font-bold uppercase tracking-wider" :class="i > mesAtual && modoRealizado ? 'text-surface-300 dark:text-surface-700' : 'text-surface-400'">{{ mes }}</th>
              <th class="py-2 pl-4 text-right text-xs font-bold uppercase tracking-wider text-surface-500">Total</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr
                class="border-b border-surface-100 transition-colors dark:border-surface-800/60"
                :class="[
                  row.highlight ? 'bg-brand-50 dark:bg-brand-600/10' : 'hover:bg-surface-50 dark:hover:bg-surface-800/40',
                  row.separator ? 'border-t-2 border-t-surface-200 dark:border-t-surface-700' : '',
                ]"
              >
                <td class="py-2.5 pr-4" :style="`padding-left: ${(row.indent ?? 0) * 16 + 4}px`">
                  <button
                    v-if="row.children"
                    class="flex items-center gap-1.5 font-semibold text-surface-900 dark:text-surface-0"
                    :class="row.bold ? 'font-bold' : ''"
                    @click="toggleRow(row.id)"
                  >
                    <i :class="expandedRows[row.id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-[10px] text-surface-400" />
                    {{ row.label }}
                  </button>
                  <span v-else :class="[row.bold ? 'font-bold text-surface-900 dark:text-surface-0' : 'text-surface-600 dark:text-surface-400', row.highlight ? 'font-bold text-brand-700 dark:text-brand-200' : '']">
                    {{ row.label }}
                  </span>
                </td>
                <td
                  v-for="(v, i) in row.valores"
                  :key="i"
                  class="px-2 py-2.5 text-right tabular-nums"
                  :class="[
                    isMuted(i) ? 'text-surface-300 dark:text-surface-700' : row.sign === -1 ? 'text-red-600' : row.highlight ? 'font-bold text-brand-700 dark:text-brand-200' : 'text-surface-800 dark:text-surface-100',
                    row.bold ? 'font-semibold' : '',
                  ]"
                >
                  <span v-if="row.percent">{{ v }}%</span>
                  <span v-else>{{ brl(v) }}</span>
                </td>
                <td class="py-2.5 pl-4 text-right tabular-nums font-bold" :class="row.highlight ? 'text-brand-700 dark:text-brand-200' : row.sign === -1 ? 'text-red-600' : 'text-surface-900 dark:text-surface-0'">
                  <span v-if="row.percent">{{ Math.round(row.valores.filter((_, i) => !isMuted(i)).reduce((a, b) => a + b, 0) / row.valores.filter((_, i) => !isMuted(i)).length) }}%</span>
                  <span v-else>{{ brl(total(row.valores)) }}</span>
                </td>
              </tr>
              <!-- Children rows -->
              <template v-if="row.children && expandedRows[row.id]">
                <tr
                  v-for="child in row.children"
                  :key="child.id"
                  class="border-b border-surface-100/60 bg-surface-50 dark:border-surface-800/40 dark:bg-surface-900/50"
                >
                  <td class="py-2 pr-4 text-surface-500 dark:text-surface-400" :style="`padding-left: ${child.indent * 16 + 4}px`">
                    {{ child.label }}
                  </td>
                  <td
                    v-for="(v, i) in child.valores"
                    :key="i"
                    class="px-2 py-2 text-right tabular-nums text-sm"
                    :class="isMuted(i) ? 'text-surface-200 dark:text-surface-800' : child.sign === -1 ? 'text-red-500' : 'text-surface-600 dark:text-surface-400'"
                  >{{ brl(v) }}</td>
                  <td class="py-2 pl-4 text-right tabular-nums text-sm font-semibold" :class="child.sign === -1 ? 'text-red-500' : 'text-surface-600 dark:text-surface-400'">{{ brl(total(child.valores)) }}</td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>

        <div class="mt-4 flex items-center gap-2 text-xs text-surface-400">
          <span class="inline-block h-2 w-2 rounded-full bg-brand-600" />
          <span>Realizado (Jan–Jun)</span>
          <span class="ml-3 inline-block h-2 w-2 rounded-full bg-surface-300" />
          <span>Meses sem dados (Jul–Dez)</span>
        </div>
      </div>
    </PageContent>
  </div>
</template>

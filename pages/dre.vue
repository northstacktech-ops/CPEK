<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'
import { useCompanyStore } from '../stores/company'
import type { DreRow } from '../types/dre'

const company = useCompanyStore()
const { load } = useDre()

const year = new Date().getFullYear()
const modoRealizado = ref(true)
const expandedRows = ref<Record<string, boolean>>({})
const loading = ref(false)
const error = ref<string | null>(null)
const rows = ref<DreRow[]>([])

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const mesAtual = new Date().getMonth() // mês corrente (0-indexed) — usado só pra "esmaecer" meses futuros no modo Realizado

async function refreshDre() {
  if (!company.activeId) return
  loading.value = true
  error.value = null

  try {
    const report = await load(year, modoRealizado.value ? 'realizado' : 'agendado')
    rows.value = report.rows
  } catch (err) {
    rows.value = []
    error.value = apiErrorMessage(err, 'Não foi possível carregar o DRE. Tente novamente em instantes.')
  } finally {
    loading.value = false
  }
}

function toggleRow(id: string) {
  expandedRows.value[id] = !expandedRows.value[id]
}

const brl = (v: number) => {
  if (v === 0) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const total = (valores: number[]) => valores.reduce((a, b) => a + b, 0)

function isMuted(i: number) { return modoRealizado.value ? i > mesAtual : false }

function exportCSV() {
  const header = ['Linha contábil', ...meses, 'Total']
  const lines: string[][] = [header]
  const pushRow = (row: DreRow, prefix = '') => {
    const values = row.valores.map((v) => (row.percent ? `${v}%` : String(v)))
    const totalCell = row.percent ? '' : String(total(row.valores))
    lines.push([prefix + row.label, ...values, totalCell])
    row.children?.forEach((child) => pushRow(child, '  '))
  }
  rows.value.forEach((row) => pushRow(row))
  // Excel pt-BR: separador ';', BOM UTF-8 e CRLF (senão abre tudo numa coluna).
  const csv = '﻿' + lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  anchor.download = 'dre.csv'
  anchor.click()
}

function exportPdf() {
  error.value = 'Exportação em PDF ainda não está disponível. Use "Exportar CSV".'
}

watch(modoRealizado, () => void refreshDre())
watch(() => company.activeId, () => void refreshDre())

onMounted(() => {
  void refreshDre()
})
</script>

<template>
  <div>
    <PageHeader title="DRE" :description="`Demonstrativo de Resultado · Ano ${year}`">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'DRE' }]" />
      </template>
      <template #actions>
        <div class="flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-0 px-3 py-1.5 text-sm dark:border-surface-800 dark:bg-surface-900">
          <span class="text-surface-500">Realizado</span>
          <ToggleSwitch v-model="modoRealizado" aria-label="Mostrar somente realizado" />
        </div>
        <Button icon="pi pi-download" label="Exportar CSV" severity="secondary" outlined size="small" :disabled="loading || !rows.length" @click="exportCSV" />
        <Button icon="pi pi-file-pdf" label="PDF" severity="secondary" outlined size="small" @click="exportPdf" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12 overflow-x-auto">
        <Skeleton v-if="loading" height="20rem" />

        <table v-else class="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-surface-200 dark:border-surface-800">
              <th class="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-surface-400" style="min-width:200px">Linha contábil</th>
              <th v-for="(mes, i) in meses" :key="mes" class="py-2 px-2 text-right text-xs font-bold uppercase tracking-wider" :class="isMuted(i) ? 'text-surface-300 dark:text-surface-700' : 'text-surface-400'">{{ mes }}</th>
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
                    v-if="row.children?.length"
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
              <template v-if="row.children?.length && expandedRows[row.id]">
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
            <tr v-if="!loading && !rows.length">
              <td :colspan="meses.length + 2" class="py-8 text-center text-sm text-surface-400">
                Nenhum lançamento encontrado para {{ year }}.
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 flex items-center gap-2 text-xs text-surface-400">
          <span class="inline-block h-2 w-2 rounded-full bg-brand-600" />
          <span>Realizado (liquidado)</span>
          <span class="ml-3 inline-block h-2 w-2 rounded-full bg-surface-300" />
          <span>Meses futuros sem liquidação</span>
        </div>
      </div>
    </PageContent>
  </div>
</template>

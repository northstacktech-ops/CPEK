<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'
import { useCompanyStore } from '../../stores/company'

const company = useCompanyStore()
const { api } = useApi()
const error = ref<string | null>(null)

const sections = reactive([
  { key: 'categorias', label: 'Categorias', icon: 'pi pi-tag', desc: 'Grupos de DRE para cada despesa e receita', count: 0, route: '/cadastros/categorias' },
  { key: 'servicos', label: 'Serviços', icon: 'pi pi-briefcase', desc: 'Cautelar, Certicar e Constatação', count: 0, route: '/cadastros/servicos' },
  { key: 'status', label: 'Status', icon: 'pi pi-circle', desc: 'Em Aberto, Pago, Vencido, Cancelado', count: 0, route: '/cadastros/status' },
  { key: 'formas-pagamento', label: 'Formas de Pgto.', icon: 'pi pi-credit-card', desc: 'Dinheiro, PIX, Cartão, Boleto', count: 0, route: '/cadastros/formas-pagamento' },
  { key: 'centros-custo', label: 'Centros de Custo', icon: 'pi pi-objects-column', desc: 'Fixo e Variável', count: 0, route: '/cadastros/centros-custo' },
  { key: 'taxas', label: 'Taxas e Juros', icon: 'pi pi-percentage', desc: 'Perfis reutilizáveis de taxas', count: 0, route: '/cadastros/taxas' },
  { key: 'contas', label: 'Contas Bancárias', icon: 'pi pi-building-columns', desc: 'Boleto, Caixa, Cartão, Cortesia', count: 0, route: '/cadastros/contas' },
  { key: 'campos-custom', label: 'Campos Personalizados', icon: 'pi pi-sliders-h', desc: 'Placa, Modelo, RENAVAM e outros', count: 0, route: '/cadastros/campos-custom' },
])

async function loadCounts() {
  if (!company.activeId) return
  error.value = null
  const companyId = company.activeId
  const results = await Promise.allSettled([
    api<{ items: unknown[] }>('/api/catalogs', { query: { companyId, kind: 'CATEGORY' } }),
    api<{ items: unknown[] }>('/api/catalogs', { query: { companyId, kind: 'SERVICE' } }),
    api<{ items: unknown[] }>('/api/catalogs', { query: { companyId, kind: 'STATUS' } }),
    api<{ items: unknown[] }>('/api/catalogs', { query: { companyId, kind: 'PAYMENT_METHOD' } }),
    api<{ items: unknown[] }>('/api/cost-centers', { query: { companyId } }),
    api<{ items: unknown[] }>('/api/fee-profiles', { query: { companyId } }),
    api<{ items: unknown[] }>('/api/bank-accounts', { query: { companyId } }),
    api<{ items: unknown[] }>('/api/custom-fields', { query: { companyId } }),
  ])
  const [categorias, servicos, status, formas, centros, taxas, contas, campos] = results
  const count = (r: PromiseSettledResult<{ items: unknown[] }>) => (r.status === 'fulfilled' ? r.value.items.length : 0)
  sections[0].count = count(categorias)
  sections[1].count = count(servicos)
  sections[2].count = count(status)
  sections[3].count = count(formas)
  sections[4].count = count(centros)
  sections[5].count = count(taxas)
  sections[6].count = count(contas)
  sections[7].count = count(campos)

  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (failed) error.value = apiErrorMessage(failed.reason, 'Não foi possível carregar todos os contadores de cadastros.')
}

onMounted(loadCounts)
watch(() => company.activeId, loadCounts)
</script>

<template>
  <div>
    <PageHeader
      title="Cadastros"
      description="Gerencie os catálogos, centros de custo, contas bancárias e campos personalizados."
    >
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Cadastros' }]" />
      </template>
    </PageHeader>

    <PageContent>
      <Message v-if="error" severity="error" size="small" class="col-span-12">{{ error }}</Message>

      <div class="col-span-12 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div
          v-for="s in sections"
          :key="s.label"
          class="group rounded-xl border border-surface-200 bg-surface-0 p-4 transition-shadow hover:shadow-sm dark:border-surface-800 dark:bg-surface-900"
        >
          <div class="mb-3 flex items-start justify-between">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-600/15">
              <i :class="[s.icon, 'text-brand-600 dark:text-brand-300']" />
            </div>
            <Badge :value="s.count" severity="secondary" />
          </div>
          <h3 class="text-sm font-bold text-surface-900 dark:text-surface-0">{{ s.label }}</h3>
          <p class="mt-0.5 text-xs text-surface-400">{{ s.desc }}</p>
          <Button
            label="Gerenciar"
            text
            size="small"
            class="mt-3 !px-0 text-brand-600 dark:text-brand-300"
            icon="pi pi-arrow-right"
            icon-pos="right"
            @click="navigateTo(s.route)"
          />
        </div>
      </div>
    </PageContent>
  </div>
</template>

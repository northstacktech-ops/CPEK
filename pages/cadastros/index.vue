<script setup lang="ts">
import { navigateTo } from '#imports'
import AppBreadcrumb from '../../components/layout/AppBreadcrumb.vue'
import PageHeader from '../../components/layout/PageHeader.vue'
import PageContent from '../../components/layout/PageContent.vue'

const sections = [
  { label: 'Categorias', icon: 'pi pi-tag', desc: 'Grupos de DRE para cada despesa e receita', count: 8, route: '/cadastros/categorias' },
  { label: 'Serviços', icon: 'pi pi-briefcase', desc: 'Cautelar, Certicar e Constatação', count: 3, route: '/cadastros/servicos' },
  { label: 'Status', icon: 'pi pi-circle', desc: 'Em Aberto, Pago, Vencido, Cancelado', count: 4, route: '/cadastros/status' },
  { label: 'Formas de Pgto.', icon: 'pi pi-credit-card', desc: 'Dinheiro, PIX, Cartão, Boleto', count: 5, route: '/cadastros/formas-pagamento' },
  { label: 'Centros de Custo', icon: 'pi pi-objects-column', desc: 'Fixo e Variável', count: 2, route: '/cadastros/centros-custo' },
  { label: 'Taxas e Juros', icon: 'pi pi-percentage', desc: 'Perfis reutilizáveis de taxas', count: 2, route: '/cadastros/taxas' },
  { label: 'Contas Bancárias', icon: 'pi pi-building-columns', desc: 'Boleto, Caixa, Cartão, Cortesia', count: 4, route: '/cadastros/contas' },
  { label: 'Campos Personalizados', icon: 'pi pi-sliders-h', desc: 'Placa, Modelo, RENAVAM e outros', count: 3, route: '/cadastros/campos-custom' },
]
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

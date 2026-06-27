<script setup lang="ts">
import { ref } from 'vue'
import AppBreadcrumb from '../components/layout/AppBreadcrumb.vue'
import PageHeader from '../components/layout/PageHeader.vue'
import PageContent from '../components/layout/PageContent.vue'

const drawerOpen = ref(false)
const form = ref({ competencia: null as Date | null, status: 'Aberto' })
const statusOptions = ['Aberto', 'Fechado']

const periodos = ref([
  { id: '1', competencia: 'Janeiro / 2026', inicio: '01/01/2026', fim: '31/01/2026', status: 'Fechado' },
  { id: '2', competencia: 'Fevereiro / 2026', inicio: '01/02/2026', fim: '28/02/2026', status: 'Fechado' },
  { id: '3', competencia: 'Março / 2026', inicio: '01/03/2026', fim: '31/03/2026', status: 'Fechado' },
  { id: '4', competencia: 'Abril / 2026', inicio: '01/04/2026', fim: '30/04/2026', status: 'Fechado' },
  { id: '5', competencia: 'Maio / 2026', inicio: '01/05/2026', fim: '31/05/2026', status: 'Fechado' },
  { id: '6', competencia: 'Junho / 2026', inicio: '01/06/2026', fim: '30/06/2026', status: 'Aberto' },
])

function save() { drawerOpen.value = false }
</script>

<template>
  <div>
    <PageHeader title="Períodos" description="Gerencie os períodos fiscais e controle de competência.">
      <template #breadcrumb>
        <AppBreadcrumb :items="[{ label: 'Períodos' }]" />
      </template>
      <template #actions>
        <Button icon="pi pi-plus" label="Novo período" size="small" @click="drawerOpen = true" />
      </template>
    </PageHeader>

    <PageContent>
      <div class="col-span-12">
        <DataTable :value="periodos" data-key="id" size="small" class="cpek-table">
          <Column field="competencia" header="Competência" sortable />
          <Column field="inicio" header="Data início" style="width:10rem" />
          <Column field="fim" header="Data fim" style="width:10rem" />
          <Column field="status" header="Status" sortable style="width:9rem">
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="data.status === 'Aberto' ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="" style="width:8rem" body-class="text-right">
            <template #body="{ data }">
              <Button
                v-if="data.status === 'Aberto'"
                label="Fechar"
                icon="pi pi-lock"
                text
                size="small"
                severity="warn"
              />
            </template>
          </Column>
          <template #empty>
            <div class="flex flex-col items-center py-10 text-center">
              <i class="pi pi-calendar mb-3 text-3xl text-surface-300" />
              <p class="text-sm font-medium text-surface-500">Nenhum período cadastrado</p>
            </div>
          </template>
        </DataTable>
      </div>
    </PageContent>

    <Dialog v-model:visible="drawerOpen" modal header="Novo período" class="!w-[480px] !max-w-[96vw]" :draggable="false">
      <form class="space-y-4" @submit.prevent="save">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Competência</label>
          <DatePicker v-model="form.competencia" view="month" date-format="MM yy" show-icon fluid />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">Status inicial</label>
          <Select v-model="form.status" :options="statusOptions" fluid />
        </div>
        <Message severity="warn" size="small" variant="simple">
          Fechar um período é irreversível. Apenas abra novos períodos quando necessário.
        </Message>
      </form>
      <template #footer>
        <div class="flex gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" outlined fluid @click="drawerOpen = false" />
          <Button label="Criar período" fluid @click="save" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

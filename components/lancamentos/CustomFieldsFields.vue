<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

type Kind = 'ENTRY' | 'EXIT' | 'CLOSING'
type DataType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'SELECT'

interface CustomFieldDef {
  id: string
  fieldKey: string
  label: string
  dataType: DataType
  required: boolean
  options?: string[] | null
  order: number
  active?: boolean
}

const props = defineProps<{
  companyId: string | null | undefined
  kind: Kind
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{ 'update:modelValue': [value: Record<string, unknown>] }>()

const { api } = useApi()
const fields = ref<CustomFieldDef[]>([])

function toDate(value: unknown): Date | null {
  return value ? new Date(value as string) : null
}

function setValue(fieldKey: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [fieldKey]: value })
}

async function loadFields() {
  if (!props.companyId) {
    fields.value = []
    return
  }
  try {
    const response = await api<{ items: CustomFieldDef[] }>('/api/custom-fields', {
      query: { companyId: props.companyId, kind: props.kind },
    })
    fields.value = response.items.filter((f) => f.active !== false).sort((a, b) => a.order - b.order)
  } catch {
    fields.value = []
  }
}

watch(() => [props.companyId, props.kind], () => void loadFields())
onMounted(() => void loadFields())
</script>

<template>
  <template v-for="field in fields" :key="field.id">
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-semibold uppercase tracking-wide text-surface-500">
        {{ field.label }}<span v-if="field.required" class="text-red-500"> *</span>
      </label>
      <InputText
        v-if="field.dataType === 'TEXT'"
        :model-value="(modelValue[field.fieldKey] as string) ?? ''"
        fluid
        @update:model-value="(v) => setValue(field.fieldKey, v)"
      />
      <InputNumber
        v-else-if="field.dataType === 'NUMBER'"
        :model-value="(modelValue[field.fieldKey] as number) ?? null"
        fluid
        @update:model-value="(v) => setValue(field.fieldKey, v)"
      />
      <InputNumber
        v-else-if="field.dataType === 'CURRENCY'"
        :model-value="(modelValue[field.fieldKey] as number) ?? null"
        mode="currency"
        currency="BRL"
        locale="pt-BR"
        fluid
        @update:model-value="(v) => setValue(field.fieldKey, v)"
      />
      <DatePicker
        v-else-if="field.dataType === 'DATE'"
        :model-value="toDate(modelValue[field.fieldKey])"
        date-format="dd/mm/yy"
        show-icon
        fluid
        @update:model-value="(v) => setValue(field.fieldKey, v instanceof Date ? v.toISOString() : null)"
      />
      <Select
        v-else-if="field.dataType === 'SELECT'"
        :model-value="(modelValue[field.fieldKey] as string) ?? null"
        :options="field.options ?? []"
        show-clear
        fluid
        @update:model-value="(v) => setValue(field.fieldKey, v)"
      />
    </div>
  </template>
</template>

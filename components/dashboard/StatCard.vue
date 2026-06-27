<script setup lang="ts">
// Card de métrica do dashboard (ARCHITECTURE §12). Estado vazio mostra R$ 0,00.
defineProps<{ label: string; value: number; colored?: boolean }>()
</script>

<template>
  <div class="rounded-lg border bg-white p-4">
    <div class="text-sm text-gray-500">{{ label }}</div>
    <div class="mt-2 text-xl font-semibold">
      <MoneyValue :value="value" :colored="colored" />
    </div>
  </div>
</template>


<script setup lang="ts">
// Exibe dinheiro em BRL (ARCHITECTURE §4: Decimal no banco; no client formatamos).
// Vermelho quando negativo (§12: Despesas em vermelho).
const props = defineProps<{ value: number; colored?: boolean }>()
const formatted = computed(() =>
  props.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
)
</script>

<template>
  <span :class="colored && value < 0 ? 'text-danger' : ''">{{ formatted }}</span>
</template>


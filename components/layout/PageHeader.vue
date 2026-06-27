<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mb-4 flex items-start justify-between gap-4 max-md:flex-col">
    <div class="min-w-0">
      <slot name="breadcrumb" />
      <h1 class="mt-1 text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-0">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-1 text-sm text-surface-400">
        {{ description }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>


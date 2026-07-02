<script setup lang="ts">
withDefaults(
  defineProps<{
    rows?: number
    columns?: number
  }>(),
  {
    rows: 6,
    columns: 5,
  },
)
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
    <div class="grid gap-3 border-b border-surface-100 px-4 py-3 dark:border-surface-800" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
      <Skeleton v-for="column in columns" :key="`head-${column}`" height="0.875rem" />
    </div>
    <div class="divide-y divide-surface-100 dark:divide-surface-800">
      <div
        v-for="row in rows"
        :key="`row-${row}`"
        class="grid gap-3 px-4 py-3"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
      >
        <Skeleton v-for="column in columns" :key="`cell-${row}-${column}`" height="1rem" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<template>
  <div class="min-h-screen bg-surface-50 text-slate-900 transition-colors dark:bg-surface-950 dark:text-slate-100">
    <div class="flex min-h-screen">
      <AppSidebar class="sticky top-0 shrink-0 max-lg:hidden" />
      <div class="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main class="flex-1 px-6 py-5 max-md:px-4">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

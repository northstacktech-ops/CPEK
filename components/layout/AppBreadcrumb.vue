<script setup lang="ts">
defineProps<{
  items?: Array<{ label: string; to?: string; url?: string }>
}>()

const home = { icon: 'pi pi-home', route: '/' }
</script>

<template>
  <Breadcrumb :home="home" :model="items ?? []" class="cpek-breadcrumb">
    <template #item="{ item, props }">
      <NuxtLink v-if="item.url || item.to || item.route" v-bind="props.action" :to="item.url ?? item.to ?? item.route">
        <span v-if="item.icon" :class="item.icon" />
        <span>{{ item.label }}</span>
      </NuxtLink>
      <span v-else v-bind="props.action">{{ item.label }}</span>
    </template>
  </Breadcrumb>
</template>


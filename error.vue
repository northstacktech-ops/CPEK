<script setup lang="ts">
import type { NuxtError } from '#app'
import { clearError } from '#imports'

defineProps<{ error: NuxtError }>()

const handleClear = () => clearError({ redirect: '/' })
</script>

<template>
  <main class="auth-page">
    <section class="login-panel">
      <div class="login-brand">CPEK</div>
      <p class="login-kicker">{{ error.statusCode }} - {{ error.statusMessage || 'Erro inesperado' }}</p>
      <Button label="Voltar ao inicio" fluid @click="handleClear" />
    </section>
  </main>
</template>

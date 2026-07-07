<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta, navigateTo } from '#imports'
import { useAuth } from '../composables/useAuth'

definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const loadingDemo = ref(false)
const { signIn, signInDemo } = useAuth()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await navigateTo('/')
  } catch (e) {
    error.value = (e as Error).message ?? 'Falha no login'
  } finally {
    loading.value = false
  }
}

async function onDemoAccess() {
  error.value = null
  loadingDemo.value = true
  try {
    await signInDemo()
    await navigateTo('/')
  } catch (e) {
    error.value = (e as Error).message ?? 'Falha ao acessar demo'
  } finally {
    loadingDemo.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Painel esquerdo — foto de escritório -->
    <div class="relative hidden lg:block overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1707157281599-d155d1da5b4c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-brand-900/30" />
    </div>

    <!-- Painel direito — formulário -->
    <div class="flex items-center justify-center p-8">
      <div class="w-full max-w-sm">
        <!-- Mobile brand -->
        <div class="mb-8 lg:hidden">
          <strong class="text-xl font-black text-brand-600">CPEK</strong>
        </div>

        <div class="mb-7">
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Bem-vindo de volta</h1>
          <p class="mt-1 text-sm text-surface-400">Acesse sua conta para continuar.</p>
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-xs font-semibold uppercase tracking-wide text-surface-500">E-mail</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="seu@email.com"
              required
              fluid
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Senha</label>
            <Password
              id="password"
              v-model="password"
              autocomplete="current-password"
              :feedback="false"
              toggle-mask
              placeholder="••••••••"
              fluid
            />
          </div>

          <Message v-if="error" severity="error" size="small" variant="simple" class="mt-1">{{ error }}</Message>

          <Button type="submit" label="Entrar" :loading="loading" class="mt-2" fluid />
        </form>

        <Divider align="center" class="my-4">
          <span class="text-xs text-surface-400">ou</span>
        </Divider>

        <Button
          type="button"
          label="Acesso teste"
          icon="pi pi-play"
          severity="success"
          :loading="loadingDemo"
          fluid
          @click="onDemoAccess"
        />

        <p class="mt-6 text-center text-xs text-surface-400">
          Acesso restrito a franqueados da rede Supervisão.
        </p>
      </div>
    </div>
  </div>
</template>

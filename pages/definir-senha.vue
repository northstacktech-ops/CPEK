<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { definePageMeta, navigateTo } from '#imports'
import { useSupabase } from '../composables/useAuth'

definePageMeta({ layout: 'auth' })

const password = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const success = ref(false)
const loading = ref(false)
const checkingLink = ref(true)
const linkValid = ref(false)

onMounted(async () => {
  // O cliente Supabase detecta o token de recuperação/convite direto na URL
  // (hash) e já abre uma sessão temporária — só pra permitir updateUser().
  const { data } = await useSupabase().auth.getSession()
  linkValid.value = !!data.session
  checkingLink.value = false
})

async function onSubmit() {
  error.value = null

  if (password.value.length < 8) {
    error.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'As senhas não coincidem.'
    return
  }

  loading.value = true
  try {
    const { error: updateError } = await useSupabase().auth.updateUser({ password: password.value })
    if (updateError) throw updateError
    success.value = true
    await useSupabase().auth.signOut()
  } catch (e) {
    error.value = (e as Error).message ?? 'Não foi possível definir a senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <div class="relative hidden lg:block overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1707157281599-d155d1da5b4c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-brand-900/30" />
    </div>

    <div class="flex items-center justify-center p-8">
      <div class="w-full max-w-sm">
        <div class="mb-8 lg:hidden">
          <strong class="text-xl font-black text-brand-600">CPEK</strong>
        </div>

        <template v-if="checkingLink">
          <p class="text-sm text-surface-400">Verificando o link de acesso...</p>
        </template>

        <template v-else-if="success">
          <div class="mb-7">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Senha definida</h1>
            <p class="mt-1 text-sm text-surface-400">Sua senha foi criada com sucesso. Entre com seu e-mail e a nova senha.</p>
          </div>
          <Button label="Ir para o login" class="mt-2" fluid @click="navigateTo('/login')" />
        </template>

        <template v-else-if="!linkValid">
          <div class="mb-7">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Link inválido ou expirado</h1>
            <p class="mt-1 text-sm text-surface-400">
              Peça um novo link de acesso ou entre em contato com quem administra o sistema.
            </p>
          </div>
          <Button label="Ir para o login" severity="secondary" class="mt-2" fluid @click="navigateTo('/login')" />
        </template>

        <template v-else>
          <div class="mb-7">
            <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">Defina sua senha</h1>
            <p class="mt-1 text-sm text-surface-400">Escolha uma senha só sua para acessar o CPEK.</p>
          </div>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <div class="flex flex-col gap-1.5">
              <label for="password" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Nova senha</label>
              <Password
                id="password"
                v-model="password"
                autocomplete="new-password"
                :feedback="true"
                toggle-mask
                placeholder="••••••••"
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="confirmPassword" class="text-xs font-semibold uppercase tracking-wide text-surface-500">Confirme a senha</label>
              <Password
                id="confirmPassword"
                v-model="confirmPassword"
                autocomplete="new-password"
                :feedback="false"
                toggle-mask
                placeholder="••••••••"
                fluid
              />
            </div>

            <Message v-if="error" severity="error" size="small" variant="simple" class="mt-1">{{ error }}</Message>

            <Button type="submit" label="Salvar senha" :loading="loading" class="mt-2" fluid />
          </form>
        </template>
      </div>
    </div>
  </div>
</template>

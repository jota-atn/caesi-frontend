<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin } from '../../stores/auth.js'

const router = useRouter()
const senha  = ref('')
const erro   = ref(false)
const loading = ref(false)

function entrar() {
  erro.value = false
  loading.value = true
  setTimeout(() => {
    loading.value = false
    if (!loginAdmin(senha.value)) {
      erro.value = true
      senha.value = ''
    } else {
      router.push('/admin/painel')
    }
  }, 400)
}
</script>

<template>
  <div class="admin-login-page">
    <form class="admin-login-box" @submit.prevent="entrar">
      <div class="admin-login-logo">
        <img src="/logo_caesi.png" alt="CAESI" />
      </div>
      <h2 class="admin-login-title">Acesso restrito</h2>

      <div v-if="erro" class="alert-erro">Código incorreto.</div>

      <div class="field-group">
        <label for="senha" class="label-sm">Código de acesso</label>
        <input
          id="senha"
          v-model="senha"
          type="password"
          class="admin-login-input"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          autofocus
        />
      </div>

      <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
        {{ loading ? 'Verificando...' : 'Entrar' }}
      </button>

      <RouterLink to="/" class="admin-login-voltar">← Voltar ao site</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.admin-login-box {
  background: var(--creme);
  border-radius: 2px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 360px;
  box-shadow: 6px 6px 0 var(--roxo-escuro);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.admin-login-logo {
  display: flex;
  justify-content: center;
}
.admin-login-logo img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.admin-login-title {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 400;
  font-size: 1.3rem;
  color: var(--roxo-escuro);
  text-align: center;
  margin: 0;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-login-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 1rem;
  color: var(--preto);
  outline: none;
  transition: border-color 0.2s;
  letter-spacing: 0.15em;
}
.admin-login-input:focus { border-color: var(--roxo); }

.admin-login-voltar {
  display: block;
  text-align: center;
  font-size: 0.84rem;
  color: var(--cinza);
  text-decoration: none;
  transition: color 0.15s;
}
.admin-login-voltar:hover { color: var(--roxo-escuro); }
</style>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin, loginComGoogle } from '../../stores/auth.js'
import googleIcon from '../../assets/icons/google.svg?raw'

const router = useRouter()
const email  = ref('')
const senha  = ref('')
const erro   = ref(false)
const loading = ref(false)
const loadingGoogle = ref(false)

function entrar() {
  erro.value = false
  loading.value = true
  setTimeout(() => {
    loading.value = false
    if (!loginAdmin(email.value, senha.value)) {
      erro.value = true
      senha.value = ''
    } else {
      router.push('/admin/painel')
    }
  }, 400)
}

function entrarComGoogle() {
  loadingGoogle.value = true
  setTimeout(() => {
    loginComGoogle()
    router.push('/admin/painel')
  }, 700)
}
</script>

<template>
  <div class="admin-login-page">
    <RouterLink to="/" class="admin-login-voltar">← Voltar ao site</RouterLink>
    <form class="admin-login-box" @submit.prevent="entrar">
      <div class="admin-login-logo">
        <img src="/logo_caesi.png" alt="CAESI" />
      </div>
      <h2 class="admin-login-title">Acesso restrito</h2>

      <div v-if="erro" class="alert-erro">E-mail ou senha incorretos.</div>

      <div class="field-group">
        <label for="email" class="label-sm">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="admin-login-input"
          placeholder="seu@ccc.ufcg.edu.br"
          autocomplete="username"
          required
          autofocus
        />
      </div>

      <div class="field-group">
        <label for="senha" class="label-sm">Senha</label>
        <input
          id="senha"
          v-model="senha"
          type="password"
          class="admin-login-input"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
        {{ loading ? 'Verificando...' : 'Entrar' }}
      </button>

      <div class="admin-login-divisor"><span>ou</span></div>

      <button type="button" class="btn-google" :disabled="loadingGoogle" @click="entrarComGoogle">
        <span class="btn-google-icon" v-html="googleIcon"></span>
        {{ loadingGoogle ? 'Entrando...' : 'Entrar com Google' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.admin-login-page {
  position: relative;
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

.admin-login-divisor {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.admin-login-divisor::before,
.admin-login-divisor::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--creme-escuro);
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.95rem;
  color: var(--preto);
  cursor: pointer;
  transition: border-color 0.15s, opacity 0.15s;
}
.btn-google:hover:not(:disabled) { border-color: var(--roxo); }
.btn-google:disabled { opacity: 0.7; cursor: default; }
.btn-google-icon { display: flex; }
.btn-google-icon :deep(svg) { width: 18px; height: 18px; }

.admin-login-voltar {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.88rem;
  color: var(--creme);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.admin-login-voltar:hover { opacity: 1; }
</style>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../stores/auth.js'
import { registerUser } from '../stores/usuarios.js'

const router = useRouter()
const form = ref({ nome: '', matricula: '', email: '', senha: '', confirma: '' })
const errors = ref({})
const registerError = ref('')
const senhaVisivel = ref(false)
const confirmaVisivel = ref(false)

function submit() {
  const e = {}
  if (!form.value.nome.trim())            e.nome = true
  if (!form.value.matricula.trim())       e.matricula = true
  if (!form.value.email.includes('@'))    e.email = true
  if (form.value.senha.length < 6)        e.senha = true
  if (form.value.confirma !== form.value.senha) e.confirma = true
  errors.value = e
  registerError.value = ''
  if (Object.keys(e).length === 0) {
    const result = registerUser({
      nome: form.value.nome,
      matricula: form.value.matricula,
      email: form.value.email,
      senha: form.value.senha,
    })
    if (result.error) { registerError.value = result.error; return }
    login(result.user)
    router.push('/')
  }
}
</script>

<template>
  <div class="login-page" style="padding-top:3rem;padding-bottom:3rem;">
    <div class="deco-star" style="top:6%;left:5%;font-size:2rem;">✦</div>
    <div class="deco-star" style="bottom:8%;right:5%;font-size:2rem;opacity:0.8;">✦</div>

    <RouterLink to="/" class="back-link" style="position:absolute;top:1.5rem;left:2rem;">
      ← Página inicial
    </RouterLink>

    <div class="login-logo-area" style="margin-bottom:1.5rem;">
      <div class="login-logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <div class="login-title">CAESI</div>
      <div class="login-subtitle">Crie sua conta para acessar a ouvidoria</div>
    </div>

    <div class="login-card" style="max-width:460px;">
      <div class="paper">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:1.5rem;">
          Criar conta
        </h2>

        <form @submit.prevent="submit" novalidate>
          <div class="field">
            <label>Nome completo *</label>
            <input v-model="form.nome" type="text" placeholder="Ex: João da Silva" :class="{ invalid: errors.nome }">
            <span class="error-msg" role="alert">Preencha seu nome completo.</span>
          </div>
          <div class="field">
            <label>Matrícula *</label>
            <input v-model="form.matricula" type="text" placeholder="Ex: 123456789"
              :class="{ invalid: errors.matricula }"
              @input="form.matricula = form.matricula.replace(/\D/g, '')">
            <span class="error-msg" role="alert">Preencha sua matrícula.</span>
          </div>
          <div class="field">
            <label>E-mail institucional *</label>
            <input v-model="form.email" type="email" placeholder="nome@ccc.ufcg.edu.br" :class="{ invalid: errors.email }">
            <span class="error-msg" role="alert">Preencha um e-mail válido.</span>
          </div>
          <div class="field-grid">
            <div class="field" style="position:relative;">
              <label>Senha *</label>
              <input v-model="form.senha" :type="senhaVisivel ? 'text' : 'password'"
                placeholder="••••••••" :class="{ invalid: errors.senha }">
              <button type="button" @click="senhaVisivel = !senhaVisivel" class="toggle-vis" aria-label="Mostrar/ocultar senha"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <span class="error-msg" role="alert">Mínimo 6 caracteres.</span>
            </div>
            <div class="field" style="position:relative;">
              <label>Confirmar *</label>
              <input v-model="form.confirma" :type="confirmaVisivel ? 'text' : 'password'"
                placeholder="••••••••" :class="{ invalid: errors.confirma }">
              <button type="button" @click="confirmaVisivel = !confirmaVisivel" class="toggle-vis" aria-label="Mostrar/ocultar senha"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <span class="error-msg" role="alert">As senhas não coincidem.</span>
            </div>
          </div>

          <div v-if="registerError" class="alert-erro">{{ registerError }}</div>

          <button type="submit" class="btn btn-primary btn-full" style="margin-top:0.4rem;">
            Criar conta →
          </button>
        </form>
      </div>
    </div>

    <div class="login-footer-link" style="margin-top:1.2rem;">
      Já tem conta? <RouterLink to="/login">Entrar</RouterLink>
    </div>
  </div>
</template>

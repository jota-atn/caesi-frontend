<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../stores/auth.js'
import { findUser } from '../stores/usuarios.js'

const router = useRouter()
const email = ref('')
const senha = ref('')
const senhaVisivel = ref(false)
const errors = ref({ email: false, senha: false })
const authError = ref(false)

function submit() {
  errors.value.email = !email.value.trim()
  errors.value.senha = !senha.value.trim()
  authError.value = false
  if (!errors.value.email && !errors.value.senha) {
    const found = findUser(email.value, senha.value)
    if (!found) { authError.value = true; return }
    login(found)
    router.push('/')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="deco-star" style="top:7%;left:5%;font-size:2rem;">✦</div>
    <div class="deco-star" style="top:11%;right:7%;font-size:1rem;opacity:0.45;">✦</div>
    <div class="deco-star" style="bottom:22%;left:8%;font-size:1rem;opacity:0.45;">✦</div>
    <div class="deco-star" style="bottom:10%;right:5%;font-size:2.2rem;">✦</div>

    <RouterLink to="/" class="back-link" style="position:absolute;top:1.5rem;left:2rem;">
      ← Página inicial
    </RouterLink>

    <div class="login-logo-area">
      <div class="login-logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <div class="login-title">CAESI</div>
      <div class="login-subtitle">Centro Acadêmico de Ciência da Computação · UFCG</div>
      <span class="login-badge">Ouvidoria</span>
    </div>

    <div class="login-card">
      <div class="paper">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:1.5rem;">
          Entrar na sua conta
        </h2>

        <form @submit.prevent="submit" novalidate>
          <div class="field">
            <label for="email">Matrícula ou e-mail</label>
            <input
              id="email"
              v-model="email"
              type="text"
              placeholder="Ex: 123456789 ou nome@ccc.ufcg.edu.br"
              :class="{ invalid: errors.email }"
            >
            <span class="error-msg">Preencha sua matrícula ou e-mail.</span>
          </div>

          <div class="field" style="position:relative;">
            <label for="senha">Senha</label>
            <input
              id="senha"
              v-model="senha"
              :type="senhaVisivel ? 'text' : 'password'"
              placeholder="••••••••"
              :class="{ invalid: errors.senha }"
            >
            <button type="button" @click="senhaVisivel = !senhaVisivel" class="toggle-vis">👁</button>
            <span class="error-msg">Preencha sua senha.</span>
          </div>

          <div v-if="authError" class="alert-erro">
            Credenciais inválidas. Verifique e tente novamente.
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="margin-top:0.5rem;">
            Entrar →
          </button>
        </form>

        <hr class="divider" style="margin:1.2rem 0;">
        <div style="text-align:center;">
          <RouterLink to="/esqueci-senha" style="font-size:0.85rem;color:var(--roxo-escuro);font-weight:600;text-decoration:none;">
            Esqueci minha senha
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="login-footer-link" style="margin-top:1.2rem;">
      Ainda não tem conta? <RouterLink to="/cadastro">Cadastre-se</RouterLink>
    </div>
  </div>
</template>

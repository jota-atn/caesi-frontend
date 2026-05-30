<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { findUserByIdentificador, updateUser } from '../stores/usuarios.js'

const router = useRouter()

// step: 'identificar' | 'redefinir' | 'sucesso'
const step = ref('identificar')

const identificador   = ref('')
const identificadorErr = ref(false)
const naoEncontrado   = ref(false)

const novaSenha      = ref('')
const confirmar      = ref('')
const novaSenhaErr   = ref(false)
const confirmarErr   = ref(false)
const novaSenhaVis   = ref(false)
const confirmarVis   = ref(false)
const apiErr         = ref('')

let usuarioAlvo = null

function verificar() {
  identificadorErr.value = !identificador.value.trim()
  naoEncontrado.value = false
  if (identificadorErr.value) return

  const encontrado = findUserByIdentificador(identificador.value.trim())
  if (!encontrado) { naoEncontrado.value = true; return }

  usuarioAlvo = encontrado
  step.value = 'redefinir'
}

function redefinir() {
  novaSenhaErr.value  = novaSenha.value.length < 6
  confirmarErr.value  = novaSenha.value !== confirmar.value
  apiErr.value = ''
  if (novaSenhaErr.value || confirmarErr.value) return

  const result = updateUser(usuarioAlvo.email, { senha: novaSenha.value })
  if (result.error) { apiErr.value = result.error; return }

  step.value = 'sucesso'
  setTimeout(() => router.push('/login'), 2500)
}
</script>

<template>
  <div class="login-page">
    <div class="deco-star" style="top:7%;left:5%;font-size:2rem;">✦</div>
    <div class="deco-star" style="top:11%;right:7%;font-size:1rem;opacity:0.45;">✦</div>
    <div class="deco-star" style="bottom:22%;left:8%;font-size:1rem;opacity:0.45;">✦</div>
    <div class="deco-star" style="bottom:10%;right:5%;font-size:2.2rem;">✦</div>

    <RouterLink to="/login" class="back-link" style="position:absolute;top:1.5rem;left:2rem;">
      ← Voltar ao login
    </RouterLink>

    <div class="login-logo-area">
      <div class="login-logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
      </div>
      <div class="login-title">CAESI</div>
      <div class="login-subtitle">Recuperação de acesso</div>
    </div>

    <div class="login-card">

      <!-- Step 1: identificar -->
      <div v-if="step === 'identificar'" class="paper">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
          Esqueceu sua senha?
        </h2>
        <p style="font-size:0.87rem;color:var(--cinza);margin-bottom:1.5rem;line-height:1.6;">
          Informe seu e-mail ou matrícula cadastrado. Se encontrarmos sua conta, você poderá redefinir a senha.
        </p>

        <form @submit.prevent="verificar" novalidate>
          <div class="field">
            <label for="identificador">E-mail ou matrícula</label>
            <input
              id="identificador"
              v-model="identificador"
              type="text"
              placeholder="Ex: 123456789 ou nome@ccc.ufcg.edu.br"
              :class="{ invalid: identificadorErr || naoEncontrado }"
            >
            <span class="error-msg" v-if="identificadorErr">Preencha seu e-mail ou matrícula.</span>
            <span class="error-msg" v-else-if="naoEncontrado">Nenhuma conta encontrada com esse identificador.</span>
          </div>

          <button type="submit" class="btn btn-primary btn-full" style="margin-top:0.5rem;">
            Continuar →
          </button>
        </form>
      </div>

      <!-- Step 2: redefinir senha -->
      <div v-else-if="step === 'redefinir'" class="paper">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
          Redefinir senha
        </h2>
        <p style="font-size:0.87rem;color:var(--cinza);margin-bottom:1.5rem;line-height:1.6;">
          Conta encontrada: <strong style="color:var(--roxo-escuro);">{{ usuarioAlvo?.nome }}</strong>.
          Escolha uma nova senha.
        </p>

        <form @submit.prevent="redefinir" novalidate>
          <div class="field" style="position:relative;">
            <label for="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              v-model="novaSenha"
              :type="novaSenhaVis ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              :class="{ invalid: novaSenhaErr }"
            >
            <button type="button" @click="novaSenhaVis = !novaSenhaVis" class="toggle-vis">👁</button>
            <span class="error-msg">A senha deve ter pelo menos 6 caracteres.</span>
          </div>

          <div class="field" style="position:relative;">
            <label for="confirmar">Confirmar nova senha</label>
            <input
              id="confirmar"
              v-model="confirmar"
              :type="confirmarVis ? 'text' : 'password'"
              placeholder="Repita a nova senha"
              :class="{ invalid: confirmarErr }"
            >
            <button type="button" @click="confirmarVis = !confirmarVis" class="toggle-vis">👁</button>
            <span class="error-msg">As senhas não coincidem.</span>
          </div>

          <div v-if="apiErr" class="alert-erro">{{ apiErr }}</div>

          <button type="submit" class="btn btn-primary btn-full" style="margin-top:0.5rem;">
            Salvar nova senha →
          </button>
        </form>
      </div>

      <!-- Step 3: sucesso -->
      <div v-else class="paper">
        <div class="anon-success">
          <div class="check-circle">✓</div>
          <h3 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
            Senha redefinida!
          </h3>
          <p style="font-size:0.9rem;color:var(--cinza);line-height:1.6;">
            Sua senha foi atualizada com sucesso. Redirecionando para o login…
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

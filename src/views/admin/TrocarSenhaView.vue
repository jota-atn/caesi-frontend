<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { trocarSenha } from '../../stores/auth.js'

const router = useRouter()
const novaSenha     = ref('')
const confirmaSenha = ref('')
const erro = ref('')

function confirmar() {
  if (novaSenha.value.length < 6) {
    erro.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }
  if (novaSenha.value !== confirmaSenha.value) {
    erro.value = 'As senhas não coincidem.'
    return
  }
  erro.value = ''
  trocarSenha(novaSenha.value)
  router.push('/admin/painel')
}
</script>

<template>
  <div class="admin-login-page">
    <form class="admin-login-box" @submit.prevent="confirmar">
      <div class="admin-login-logo">
        <img src="/logo_caesi.png" alt="CAESI" />
      </div>
      <h2 class="admin-login-title">Defina uma nova senha</h2>
      <p style="font-size:0.85rem;color:var(--cinza);text-align:center;margin:-0.5rem 0 0;line-height:1.6;">
        Este é seu primeiro acesso. Por segurança, troque a senha padrão antes de continuar.
      </p>

      <div v-if="erro" class="alert-erro">{{ erro }}</div>

      <div class="field-group">
        <label for="nova" class="label-sm">Nova senha</label>
        <input id="nova" v-model="novaSenha" type="password" class="admin-login-input"
          placeholder="••••••••" autocomplete="new-password" required autofocus>
      </div>

      <div class="field-group">
        <label for="confirma" class="label-sm">Confirme a nova senha</label>
        <input id="confirma" v-model="confirmaSenha" type="password" class="admin-login-input"
          placeholder="••••••••" autocomplete="new-password" required>
      </div>

      <button type="submit" class="btn btn-primary btn-full">Salvar e continuar</button>
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
</style>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import { user, login, isAdmin } from '../stores/auth.js'
import { updateUser } from '../stores/usuarios.js'

const router = useRouter()
if (!user.value) router.replace('/login')

const nome    = ref(user.value?.nome ?? '')
const perfilMsg   = ref({ tipo: '', texto: '' })

const senhaAtual    = ref('')
const novaSenha     = ref('')
const confirmarSenha = ref('')
const senhaAtualVis  = ref(false)
const novaSenhaVis   = ref(false)
const confirmarVis   = ref(false)
const senhaMsg      = ref({ tipo: '', texto: '' })

const avatar = computed(() => (user.value?.nome ?? 'U').charAt(0).toUpperCase())
const isOriginalAdmin = computed(() => user.value?.email === 'admin')

function salvarPerfil() {
  perfilMsg.value = { tipo: '', texto: '' }
  if (!nome.value.trim()) {
    perfilMsg.value = { tipo: 'erro', texto: 'O nome não pode estar vazio.' }
    return
  }
  const result = updateUser(user.value.email, { nome: nome.value.trim() })
  if (result.error) { perfilMsg.value = { tipo: 'erro', texto: result.error }; return }
  login({ ...user.value, nome: nome.value.trim() })
  perfilMsg.value = { tipo: 'ok', texto: 'Nome atualizado com sucesso!' }
}

function alterarSenha() {
  senhaMsg.value = { tipo: '', texto: '' }
  if (!senhaAtual.value || !novaSenha.value || !confirmarSenha.value) {
    senhaMsg.value = { tipo: 'erro', texto: 'Preencha todos os campos.' }
    return
  }
  if (senhaAtual.value !== user.value.senha) {
    senhaMsg.value = { tipo: 'erro', texto: 'Senha atual incorreta.' }
    return
  }
  if (novaSenha.value.length < 6) {
    senhaMsg.value = { tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' }
    return
  }
  if (novaSenha.value !== confirmarSenha.value) {
    senhaMsg.value = { tipo: 'erro', texto: 'As senhas não coincidem.' }
    return
  }
  const result = updateUser(user.value.email, { senha: novaSenha.value })
  if (result.error) { senhaMsg.value = { tipo: 'erro', texto: result.error }; return }
  login({ ...user.value, senha: novaSenha.value })
  senhaAtual.value = ''
  novaSenha.value  = ''
  confirmarSenha.value = ''
  senhaMsg.value = { tipo: 'ok', texto: 'Senha alterada com sucesso!' }
}

function voltar() {
  router.back()
}
</script>

<template>
  <div class="page" v-if="user">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar :admin="isAdmin" />

    <div class="page-content" style="max-width:640px;">
      <button class="back-link" @click="voltar" style="background:none;border:none;cursor:pointer;">← Voltar</button>

      <!-- Card de identidade -->
      <div class="paper paper-mb-lg">
        <div style="display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;">
          <div class="perfil-avatar-grande">{{ avatar }}</div>
          <div>
            <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.4rem;color:var(--roxo-escuro);margin-bottom:4px;">
              {{ user.nome }}
            </h2>
            <span class="perfil-role-badge" :class="isAdmin ? 'admin' : 'aluno'">
              {{ isAdmin ? '🛡 Administrador' : '🎓 Aluno' }}
            </span>
          </div>
        </div>

        <hr class="divider" style="margin:1.2rem 0;">

        <div class="perfil-info-grid">
          <div class="perfil-info-item" v-if="user.email && user.email !== 'admin'">
            <span class="perfil-info-label">E-mail</span>
            <span class="perfil-info-value">{{ user.email }}</span>
          </div>
          <div class="perfil-info-item" v-if="user.matricula">
            <span class="perfil-info-label">Matrícula</span>
            <span class="perfil-info-value">{{ user.matricula }}</span>
          </div>
          <div class="perfil-info-item">
            <span class="perfil-info-label">Perfil</span>
            <span class="perfil-info-value">{{ isAdmin ? 'Administrador CAESI' : 'Aluno' }}</span>
          </div>
        </div>
      </div>

      <!-- Editar nome -->
      <div class="paper paper-mb-lg">
        <h3 class="paper-subtitle">Editar nome</h3>

        <template v-if="isOriginalAdmin">
          <p style="font-size:0.88rem;color:var(--cinza);line-height:1.6;">
            O nome do administrador original não pode ser alterado.
          </p>
        </template>

        <template v-else>
          <div class="field">
            <label for="nome">Nome completo</label>
            <input id="nome" v-model="nome" type="text" placeholder="Seu nome">
          </div>

          <div v-if="perfilMsg.texto" class="feedback-msg" :class="perfilMsg.tipo">
            {{ perfilMsg.texto }}
          </div>

          <button class="btn btn-primary btn-sm" @click="salvarPerfil" style="margin-top:0.5rem;">
            Salvar nome →
          </button>
        </template>
      </div>

      <!-- Alterar senha -->
      <div class="paper">
        <h3 class="paper-subtitle">Alterar senha</h3>

        <div class="field" style="position:relative;">
          <label for="senhaAtual">Senha atual</label>
          <input id="senhaAtual" v-model="senhaAtual" :type="senhaAtualVis ? 'text' : 'password'" placeholder="••••••••">
          <button type="button" @click="senhaAtualVis = !senhaAtualVis" class="toggle-vis">👁</button>
        </div>

        <div class="field" style="position:relative;">
          <label for="novaSenha">Nova senha</label>
          <input id="novaSenha" v-model="novaSenha" :type="novaSenhaVis ? 'text' : 'password'" placeholder="Mínimo 6 caracteres">
          <button type="button" @click="novaSenhaVis = !novaSenhaVis" class="toggle-vis">👁</button>
        </div>

        <div class="field" style="position:relative;">
          <label for="confirmarSenha">Confirmar nova senha</label>
          <input id="confirmarSenha" v-model="confirmarSenha" :type="confirmarVis ? 'text' : 'password'" placeholder="••••••••">
          <button type="button" @click="confirmarVis = !confirmarVis" class="toggle-vis">👁</button>
        </div>

        <div v-if="senhaMsg.texto" class="feedback-msg" :class="senhaMsg.tipo">
          {{ senhaMsg.texto }}
        </div>

        <button class="btn btn-primary btn-sm" @click="alterarSenha" style="margin-top:0.5rem;">
          Alterar senha →
        </button>
      </div>
    </div>
  </div>
</template>

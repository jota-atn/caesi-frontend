<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { usuarios, setUserAtivo, createAdmin } from '../../stores/usuarios.js'
import { user as currentUser } from '../../stores/auth.js'

const filtro = ref('todos')
const busca = ref('')
const showNewAdmin = ref(false)
const senhaVisivel = ref(false)
const newAdmin = ref({ nome: '', email: '', senha: '' })
const newAdminErrors = ref({})
const newAdminApiError = ref('')
const newAdminSuccess = ref(false)

const usuariosFiltrados = computed(() =>
  usuarios.value.filter(u => {
    if (filtro.value === 'alunos' && u.role !== 'user') return false
    if (filtro.value === 'admins' && u.role !== 'admin') return false
    const t = busca.value.toLowerCase()
    if (!t) return true
    return (
      u.nome.toLowerCase().includes(t) ||
      (u.email && u.email.toLowerCase().includes(t)) ||
      (u.matricula && u.matricula.includes(t))
    )
  })
)

const totalAlunos  = computed(() => usuarios.value.filter(u => u.role === 'user').length)
const totalAtivos  = computed(() => usuarios.value.filter(u => u.role === 'user' && u.ativo !== false).length)
const totalInativos = computed(() => usuarios.value.filter(u => u.role === 'user' && u.ativo === false).length)

function isProtected(u) {
  return u.email === 'admin' || u.email === currentUser.value?.email
}

function toggleAtivo(u) {
  setUserAtivo(u.email, u.ativo === false)
}

function cancelNewAdmin() {
  showNewAdmin.value = false
  senhaVisivel.value = false
  newAdmin.value = { nome: '', email: '', senha: '' }
  newAdminErrors.value = {}
  newAdminApiError.value = ''
  newAdminSuccess.value = false
}

function submitNewAdmin() {
  const e = {}
  if (!newAdmin.value.nome.trim())          e.nome = true
  if (!newAdmin.value.email.includes('@'))  e.email = true
  if (newAdmin.value.senha.length < 6)      e.senha = true
  newAdminErrors.value = e
  newAdminApiError.value = ''
  if (Object.keys(e).length === 0) {
    const result = createAdmin({ ...newAdmin.value })
    if (result.error) { newAdminApiError.value = result.error; return }
    newAdminSuccess.value = true
    setTimeout(() => cancelNewAdmin(), 1800)
  }
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>
    <div class="deco-star" style="bottom:25%;left:1%;font-size:1.4rem;opacity:0.28;">✦</div>

    <Navbar :admin="true" />

    <div class="page-content" style="padding-top:2rem;">
      <div class="page-heading">
        <h2>Gestão de <span>Usuários</span></h2>
        <button class="btn btn-amarelo btn-sm" @click="showNewAdmin ? cancelNewAdmin() : (showNewAdmin = true)">
          {{ showNewAdmin ? '✕ Cancelar' : '+ Novo admin' }}
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ totalAlunos }}</div>
          <div class="stat-label">Alunos cadastrados</div>
        </div>
        <div class="stat-card" style="border-top:3px solid var(--verde);">
          <div class="stat-number" style="color:var(--verde);">{{ totalAtivos }}</div>
          <div class="stat-label">Ativos</div>
        </div>
        <div class="stat-card" style="border-top:3px solid var(--vermelho);">
          <div class="stat-number" style="color:var(--vermelho);">{{ totalInativos }}</div>
          <div class="stat-label">Inativos</div>
        </div>
      </div>

      <!-- Formulário novo admin -->
      <div v-if="showNewAdmin" class="paper" style="margin-bottom:1.5rem;">
        <h3 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;color:var(--roxo-escuro);margin-bottom:1.2rem;">
          Criar conta de administrador
        </h3>

        <div v-if="newAdminSuccess" style="text-align:center;padding:1.2rem 0;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">✓</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--verde);">Admin criado com sucesso!</div>
        </div>

        <form v-else @submit.prevent="submitNewAdmin" novalidate>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div class="field">
              <label>Nome *</label>
              <input v-model="newAdmin.nome" type="text" placeholder="Nome completo"
                :class="{ invalid: newAdminErrors.nome }">
              <span class="error-msg">Preencha o nome.</span>
            </div>
            <div class="field">
              <label>E-mail *</label>
              <input v-model="newAdmin.email" type="email" placeholder="admin@caesi.ufcg.edu.br"
                :class="{ invalid: newAdminErrors.email }">
              <span class="error-msg">E-mail inválido.</span>
            </div>
          </div>
          <div class="field" style="max-width:260px;position:relative;">
            <label>Senha * <span style="font-weight:400;text-transform:none;letter-spacing:0;font-size:0.78rem;color:var(--cinza);">(mín. 6 caracteres)</span></label>
            <input v-model="newAdmin.senha" :type="senhaVisivel ? 'text' : 'password'"
              placeholder="••••••••" :class="{ invalid: newAdminErrors.senha }">
            <button type="button" @click="senhaVisivel = !senhaVisivel"
              style="position:absolute;right:12px;bottom:10px;background:none;border:none;cursor:pointer;font-size:0.9rem;color:var(--cinza);">👁</button>
            <span class="error-msg">Mínimo 6 caracteres.</span>
          </div>

          <div v-if="newAdminApiError" style="
            background:rgba(217,85,85,0.1);border:2px solid var(--vermelho);border-radius:2px;
            padding:9px 13px;font-size:0.85rem;color:var(--vermelho);font-weight:600;margin-bottom:1rem;
          ">{{ newAdminApiError }}</div>

          <div style="display:flex;gap:10px;">
            <button type="submit" class="btn btn-primary btn-sm">Criar admin</button>
            <button type="button" class="btn btn-outline btn-sm" @click="cancelNewAdmin">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Busca + filtros -->
      <div class="filter-bar">
        <input v-model="busca" type="search" placeholder="🔍  Buscar por nome, e-mail ou matrícula…">
        <button class="filter-btn" :class="{ active: filtro === 'todos' }"   @click="filtro = 'todos'">Todos</button>
        <button class="filter-btn" :class="{ active: filtro === 'alunos' }"  @click="filtro = 'alunos'">Alunos</button>
        <button class="filter-btn" :class="{ active: filtro === 'admins' }"  @click="filtro = 'admins'">Admins</button>
      </div>

      <!-- Lista -->
      <div class="paper" style="padding:0;overflow:hidden;">
        <div
          v-for="(u, i) in usuariosFiltrados"
          :key="u.email"
          class="user-row"
          :style="i === usuariosFiltrados.length - 1 ? 'border-bottom:none' : ''"
        >
          <div class="user-avatar" :style="u.role === 'admin' ? 'background:var(--roxo-escuro);' : ''">
            {{ u.nome[0].toUpperCase() }}
          </div>

          <div class="user-info">
            <div class="user-name">{{ u.nome }}</div>
            <div class="user-meta">
              {{ u.email }}
              <span v-if="u.matricula"> · {{ u.matricula }}</span>
            </div>
          </div>

          <div class="user-badges">
            <span class="badge" :class="u.role === 'admin' ? 'badge-role-admin' : 'badge-role-aluno'">
              {{ u.role === 'admin' ? 'Admin' : 'Aluno' }}
            </span>
            <span class="badge" :class="u.ativo !== false ? 'badge-atendida' : 'badge-inativo'">
              {{ u.ativo !== false ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div style="flex-shrink:0;">
            <template v-if="!isProtected(u)">
              <button
                class="btn btn-sm"
                :class="u.ativo !== false ? 'btn-danger' : 'btn-outline'"
                @click="toggleAtivo(u)"
              >
                {{ u.ativo !== false ? 'Desativar' : 'Reativar' }}
              </button>
            </template>
            <span v-else style="font-size:0.76rem;color:var(--cinza);font-style:italic;">
              {{ u.email === currentUser?.email ? 'você' : 'protegido' }}
            </span>
          </div>
        </div>

        <div v-if="usuariosFiltrados.length === 0" class="empty-state">
          <p>Nenhum usuário encontrado.</p>
        </div>
      </div>

    </div>
  </div>
</template>

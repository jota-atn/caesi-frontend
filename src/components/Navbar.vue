<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, logout } from '../stores/auth.js'
import { mensagens } from '../stores/mensagens.js'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const router = useRouter()
const menuOpen    = ref(false)
const dropdownOpen = ref(false)
const dropdownRef  = ref(null)

const avatar = computed(() => (user.value?.nome ?? 'U').charAt(0).toUpperCase())

const badgeCount = computed(() => {
  if (!user.value) return 0
  if (props.admin) {
    return mensagens.value.filter(m => m.status === 'pendente').length
  }
  return mensagens.value.filter(m =>
    (m.email === user.value?.email || m.matricula === user.value?.matricula) &&
    m.resposta &&
    !m.respostaVista
  ).length
})

function handleLogout() {
  logout()
  router.push('/')
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
  if (menuOpen.value) menuOpen.value = false
}

function closeDropdown(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))
</script>

<template>
  <nav class="navbar" :style="admin ? 'background:#3B2F88' : ''">
    <RouterLink to="/" class="navbar-brand">
      <div class="logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <span class="navbar-title">
        CAESI <span>{{ admin ? 'Admin' : 'Ouvidoria' }}</span>
      </span>
    </RouterLink>

    <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" :class="{ open: menuOpen }">
      <template v-if="admin">
        <RouterLink to="/admin/painel"    class="nav-link">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios"  class="nav-link">Usuários</RouterLink>
      </template>

      <!-- User dropdown -->
      <div class="user-menu" ref="dropdownRef">
        <button class="user-menu-trigger" @click.stop="toggleDropdown">
          <div class="user-avatar-wrap">
            <div class="nav-avatar">{{ avatar }}</div>
            <span v-if="badgeCount > 0" class="user-badge">{{ badgeCount > 9 ? '9+' : badgeCount }}</span>
          </div>
          <span class="user-trigger-name">{{ user?.nome ?? 'Usuário' }}</span>
          <span class="user-chevron" :class="{ rotated: dropdownOpen }">▾</span>
        </button>

        <Transition name="dropdown">
          <div v-if="dropdownOpen" class="user-dropdown" @click="dropdownOpen = false">
            <!-- Cabeçalho -->
            <div class="user-dropdown-header">
              <div class="user-dropdown-avatar">{{ avatar }}</div>
              <div>
                <div class="user-dropdown-name">{{ user?.nome ?? 'Usuário' }}</div>
                <div class="user-dropdown-role">{{ admin ? '🛡 Administrador' : '🎓 Aluno' }}</div>
              </div>
            </div>
            <hr class="user-dropdown-divider">

            <!-- Itens comuns -->
            <RouterLink to="/perfil" class="user-dropdown-item">
              <span>👤</span> Ver perfil
            </RouterLink>

            <!-- Itens do admin -->
            <template v-if="admin">
              <RouterLink to="/admin/painel" class="user-dropdown-item">
                <span>📋</span> Painel de mensagens
                <span v-if="badgeCount > 0" class="dropdown-notif">{{ badgeCount }}</span>
              </RouterLink>
              <RouterLink to="/admin/usuarios" class="user-dropdown-item">
                <span>👥</span> Gerenciar usuários
              </RouterLink>
            </template>

            <!-- Itens do aluno -->
            <template v-else>
              <RouterLink to="/aluno/mensagens" class="user-dropdown-item">
                <span>📬</span> Minhas mensagens
                <span v-if="badgeCount > 0" class="dropdown-notif">{{ badgeCount }}</span>
              </RouterLink>
              <RouterLink to="/aluno/nova-mensagem" class="user-dropdown-item">
                <span>✏️</span> Nova mensagem
              </RouterLink>
            </template>

            <hr class="user-dropdown-divider">
            <button class="user-dropdown-item user-dropdown-sair" @click.stop="handleLogout">
              <span>🚪</span> Sair
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

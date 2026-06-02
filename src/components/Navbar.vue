<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isLoggedIn, isAdmin, user, logout } from '../stores/auth.js'
import { notificacoes } from '../stores/notificacoes.js'
import UserDropdown from './UserDropdown.vue'
import NotifBell from './NotifBell.vue'

const menuOpen = ref(false)
const route    = useRoute()
const router   = useRouter()

const avatar = computed(() => (user.value?.nome ?? 'U').charAt(0).toUpperCase())

const unreadCount = computed(() => {
  if (!user.value || isAdmin.value) return 0
  return notificacoes.value.filter(n => n.userEmail === user.value?.email && !n.lida).length
})

function handleLogout() {
  menuOpen.value = false
  logout()
  router.push('/')
}

function ariaCurrent(path) {
  return route.path === path || route.path.startsWith(path + '/') ? 'page' : undefined
}

function ariaCurrentFormularios() {
  return route.path.startsWith('/aluno/formularios') || route.path.startsWith('/admin/formularios')
    ? 'page' : undefined
}
</script>

<template>
  <nav class="navbar" :style="isAdmin ? 'background:#3B2F88' : ''">
    <RouterLink to="/" class="navbar-brand">
      <div class="logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
      </div>
      <span class="navbar-title">
        CAESI <span v-if="isAdmin">Admin</span>
      </span>
    </RouterLink>

    <button class="hamburger" @click="menuOpen = !menuOpen"
      aria-label="Menu" :aria-expanded="menuOpen" aria-controls="navbar-menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" id="navbar-menu" :class="{ open: menuOpen }">
      <RouterLink to="/sobre"    class="nav-link" :aria-current="ariaCurrent('/sobre')"    @click="menuOpen = false">Sobre</RouterLink>
      <RouterLink to="/estatuto" class="nav-link" :aria-current="ariaCurrent('/estatuto')" @click="menuOpen = false">Estatuto</RouterLink>
      <RouterLink to="/contato"  class="nav-link" :aria-current="ariaCurrent('/contato')"  @click="menuOpen = false">Contato</RouterLink>

      <!-- Visitante -->
      <template v-if="!isLoggedIn">
        <RouterLink to="/aluno/formularios" class="nav-link" :aria-current="ariaCurrentFormularios()" @click="menuOpen = false">Formulários</RouterLink>
        <RouterLink to="/login" class="btn btn-amarelo btn-sm" @click="menuOpen = false">Fazer login</RouterLink>
      </template>

      <!-- Admin -->
      <template v-else-if="isAdmin">
        <span class="nav-separator" />
        <RouterLink to="/admin/painel"      class="nav-link" :aria-current="ariaCurrent('/admin/painel')"      @click="menuOpen = false">Painel</RouterLink>
        <RouterLink to="/admin/mensagens"   class="nav-link" :aria-current="ariaCurrent('/admin/mensagens')"   @click="menuOpen = false">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios"    class="nav-link" :aria-current="ariaCurrent('/admin/usuarios')"    @click="menuOpen = false">Usuários</RouterLink>
        <RouterLink to="/admin/equipe"      class="nav-link" :aria-current="ariaCurrent('/admin/equipe')"      @click="menuOpen = false">Equipe</RouterLink>
        <RouterLink to="/admin/formularios" class="nav-link" :aria-current="ariaCurrentFormularios()"         @click="menuOpen = false">Formulários</RouterLink>
        <div class="navbar-desktop-user">
          <UserDropdown :admin="true" />
        </div>
      </template>

      <!-- Aluno -->
      <template v-else>
        <RouterLink to="/aluno/formularios" class="nav-link" :aria-current="ariaCurrentFormularios()" @click="menuOpen = false">Formulários</RouterLink>
        <span class="nav-separator" />
        <RouterLink to="/aluno/mensagens"  class="nav-link" :aria-current="ariaCurrent('/aluno/mensagens')"  @click="menuOpen = false">Mensagens</RouterLink>
        <RouterLink to="/aluno/inscricoes" class="nav-link" :aria-current="ariaCurrent('/aluno/inscricoes')" @click="menuOpen = false">Inscrições</RouterLink>
        <div class="navbar-desktop-user">
          <NotifBell />
          <UserDropdown :admin="false" />
        </div>
      </template>

      <!-- Seção do usuário — só aparece no mobile via CSS -->
      <template v-if="isLoggedIn">
        <span class="nav-separator nav-separator--mobile" />
        <div class="mobile-user-header">
          <div class="mobile-user-avatar">{{ avatar }}</div>
          <div class="mobile-user-info">
            <div class="mobile-user-name">
              {{ user?.nome }}
              <span v-if="unreadCount > 0" class="mobile-notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </div>
            <div class="mobile-user-role">{{ isAdmin ? 'Administrador' : 'Aluno' }}</div>
          </div>
        </div>
        <RouterLink to="/perfil" class="mobile-action-link" @click="menuOpen = false">Ver perfil</RouterLink>
        <button class="mobile-action-link mobile-action-sair" @click="handleLogout">Sair</button>
      </template>
    </div>
  </nav>
</template>

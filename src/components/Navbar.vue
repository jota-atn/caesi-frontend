<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdmin, logout } from '../stores/auth.js'

const menuOpen = ref(false)
const route    = useRoute()
const router   = useRouter()

function handleLogout() {
  menuOpen.value = false
  logout()
  router.push('/')
}

function ariaCurrent(path) {
  return route.path === path || route.path.startsWith(path + '/') ? 'page' : undefined
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

      <!-- Admin -->
      <template v-if="isAdmin">
        <RouterLink to="/admin/painel"      class="nav-link" :aria-current="ariaCurrent('/admin/painel')"      @click="menuOpen = false">Painel</RouterLink>
        <RouterLink to="/admin/mensagens"   class="nav-link" :aria-current="ariaCurrent('/admin/mensagens')"   @click="menuOpen = false">Mensagens</RouterLink>
        <RouterLink to="/admin/equipe"      class="nav-link" :aria-current="ariaCurrent('/admin/equipe')"      @click="menuOpen = false">Equipe</RouterLink>
        <RouterLink to="/admin/formularios" class="nav-link" :aria-current="ariaCurrent('/admin/formularios')" @click="menuOpen = false">Formulários</RouterLink>
        <RouterLink to="/admin/tasks"       class="nav-link" :aria-current="ariaCurrent('/admin/tasks')"       @click="menuOpen = false">Tasks</RouterLink>
        <RouterLink to="/admin/mural"      class="nav-link" :aria-current="ariaCurrent('/admin/mural')"      @click="menuOpen = false">Mural</RouterLink>
        <RouterLink to="/admin/calendario" class="nav-link" :aria-current="ariaCurrent('/admin/calendario')" @click="menuOpen = false">Calendário</RouterLink>
        <span class="nav-separator" />
        <RouterLink to="/sobre"    class="nav-link nav-link--pub" :aria-current="ariaCurrent('/sobre')"    @click="menuOpen = false">Sobre</RouterLink>
        <RouterLink to="/estatuto" class="nav-link nav-link--pub" :aria-current="ariaCurrent('/estatuto')" @click="menuOpen = false">Estatuto</RouterLink>
        <RouterLink to="/contato"  class="nav-link nav-link--pub" :aria-current="ariaCurrent('/contato')"  @click="menuOpen = false">Contato</RouterLink>
        <span class="nav-separator" />
        <button class="nav-link nav-link-btn" @click="handleLogout">Sair</button>
      </template>

      <!-- Público -->
      <template v-else>
        <RouterLink to="/sobre"       class="nav-link" :aria-current="ariaCurrent('/sobre')"       @click="menuOpen = false">Sobre</RouterLink>
        <RouterLink to="/estatuto"    class="nav-link" :aria-current="ariaCurrent('/estatuto')"    @click="menuOpen = false">Estatuto</RouterLink>
        <RouterLink to="/contato"     class="nav-link" :aria-current="ariaCurrent('/contato')"     @click="menuOpen = false">Contato</RouterLink>
        <RouterLink to="/mural"       class="nav-link" :aria-current="ariaCurrent('/mural')"       @click="menuOpen = false">Mural</RouterLink>
        <RouterLink to="/calendario"  class="nav-link" :aria-current="ariaCurrent('/calendario')"  @click="menuOpen = false">Calendário</RouterLink>
        <RouterLink to="/formularios" class="nav-link" :aria-current="ariaCurrent('/formularios')" @click="menuOpen = false">Formulários</RouterLink>
      </template>

    </div>
  </nav>
</template>

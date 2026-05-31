<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { isLoggedIn, isAdmin } from '../stores/auth.js'
import UserDropdown from './UserDropdown.vue'
import NotifBell from './NotifBell.vue'

const menuOpen = ref(false)
const route = useRoute()
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="navbar-brand">
      <div class="logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
      </div>
      <span class="navbar-title">CAESI <span>Ouvidoria</span></span>
    </RouterLink>

    <button class="hamburger" @click="menuOpen = !menuOpen"
      aria-label="Menu" :aria-expanded="menuOpen" aria-controls="pub-navbar-menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" id="pub-navbar-menu" :class="{ open: menuOpen }">
      <RouterLink to="/sobre"    class="nav-link" :aria-current="route.path === '/sobre'    ? 'page' : undefined">Sobre</RouterLink>
      <RouterLink to="/estatuto" class="nav-link" :aria-current="route.path === '/estatuto' ? 'page' : undefined">Estatuto</RouterLink>
      <RouterLink to="/contato"  class="nav-link" :aria-current="route.path === '/contato'  ? 'page' : undefined">Contato</RouterLink>
      <RouterLink
        :to="isAdmin ? '/admin/formularios' : '/aluno/formularios'"
        class="nav-link"
        :aria-current="route.path.startsWith('/aluno/formularios') || route.path.startsWith('/admin/formularios') ? 'page' : undefined"
      >Formulários</RouterLink>

      <template v-if="isLoggedIn">
        <NotifBell v-if="!isAdmin" />
        <UserDropdown :admin="isAdmin" />
      </template>
      <template v-else>
        <RouterLink to="/login" class="btn btn-amarelo btn-sm">Fazer login</RouterLink>
      </template>
    </div>
  </nav>
</template>

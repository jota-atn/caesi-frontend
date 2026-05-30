<script setup>
import { ref } from 'vue'
import { isLoggedIn, isAdmin } from '../stores/auth.js'
import UserDropdown from './UserDropdown.vue'
import NotifBell from './NotifBell.vue'

const menuOpen = ref(false)
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="navbar-brand">
      <div class="logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
      </div>
      <span class="navbar-title">CAESI <span>Ouvidoria</span></span>
    </RouterLink>

    <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" :class="{ open: menuOpen }">
      <RouterLink to="/sobre"    class="nav-link">Sobre</RouterLink>
      <RouterLink to="/estatuto" class="nav-link">Estatuto</RouterLink>
      <RouterLink to="/contato"  class="nav-link">Contato</RouterLink>

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

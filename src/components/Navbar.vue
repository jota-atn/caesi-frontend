<script setup>
import { ref } from 'vue'
import UserDropdown from './UserDropdown.vue'
import NotifBell from './NotifBell.vue'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const menuOpen = ref(false)
</script>

<template>
  <nav class="navbar" :style="admin ? 'background:#3B2F88' : ''">
    <RouterLink to="/" class="navbar-brand">
      <div class="logo-circle">
        <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
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
        <RouterLink to="/sobre"    class="nav-link nav-link-sec">Sobre</RouterLink>
        <RouterLink to="/estatuto" class="nav-link nav-link-sec">Estatuto</RouterLink>
        <RouterLink to="/contato"  class="nav-link nav-link-sec">Contato</RouterLink>
        <span class="nav-separator" />
        <RouterLink to="/admin/painel"    class="nav-link">Painel</RouterLink>
        <RouterLink to="/admin/mensagens" class="nav-link">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios"  class="nav-link">Usuários</RouterLink>
        <RouterLink to="/admin/equipe"    class="nav-link">Equipe</RouterLink>
      </template>

      <NotifBell v-if="!admin" />
      <UserDropdown :admin="admin" />
    </div>
  </nav>
</template>

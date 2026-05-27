<script setup>
import { ref } from 'vue'
import UserDropdown from './UserDropdown.vue'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const menuOpen = ref(false)
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
        <RouterLink to="/admin/painel"   class="nav-link">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios" class="nav-link">Usuários</RouterLink>
        <RouterLink to="/admin/equipe"   class="nav-link">Equipe</RouterLink>
      </template>

      <UserDropdown :admin="admin" />
    </div>
  </nav>
</template>

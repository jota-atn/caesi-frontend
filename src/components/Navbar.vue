<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { user, logout } from '../stores/auth.js'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const router = useRouter()
const menuOpen = ref(false)

function handleLogout() {
  logout()
  router.push('/')
}
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
        <RouterLink to="/admin/painel" class="nav-link">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios" class="nav-link">Usuários</RouterLink>
      </template>
      <span class="navbar-user" style="pointer-events:none;opacity:0.85;">
        {{ user?.nome ?? 'Usuário' }}
      </span>
      <button @click="handleLogout" class="navbar-user" style="cursor:pointer;background:none;border:1px solid rgba(255,255,255,0.2);color:var(--creme);">
        Sair →
      </button>
    </div>
  </nav>
</template>

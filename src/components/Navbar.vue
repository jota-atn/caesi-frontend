<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import UserDropdown from './UserDropdown.vue'
import NotifBell from './NotifBell.vue'

const props = defineProps({
  admin: { type: Boolean, default: false },
})

const menuOpen = ref(false)
const route = useRoute()

function ariaCurrent(path) {
  return route.path === path || route.path.startsWith(path + '/') ? 'page' : undefined
}
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

    <button class="hamburger" @click="menuOpen = !menuOpen"
      aria-label="Menu" :aria-expanded="menuOpen" aria-controls="navbar-menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" id="navbar-menu" :class="{ open: menuOpen }">
      <template v-if="admin">
        <RouterLink to="/sobre"    class="nav-link" :aria-current="ariaCurrent('/sobre')">Sobre</RouterLink>
        <RouterLink to="/estatuto" class="nav-link" :aria-current="ariaCurrent('/estatuto')">Estatuto</RouterLink>
        <RouterLink to="/contato"  class="nav-link" :aria-current="ariaCurrent('/contato')">Contato</RouterLink>
        <span class="nav-separator" />
        <RouterLink to="/admin/painel"    class="nav-link" :aria-current="ariaCurrent('/admin/painel')">Painel</RouterLink>
        <RouterLink to="/admin/mensagens" class="nav-link" :aria-current="ariaCurrent('/admin/mensagens')">Mensagens</RouterLink>
        <RouterLink to="/admin/usuarios"  class="nav-link" :aria-current="ariaCurrent('/admin/usuarios')">Usuários</RouterLink>
        <RouterLink to="/admin/equipe"       class="nav-link" :aria-current="ariaCurrent('/admin/equipe')">Equipe</RouterLink>
        <RouterLink to="/admin/formularios" class="nav-link" :aria-current="ariaCurrent('/admin/formularios')">Formulários</RouterLink>
      </template>

      <template v-else>
        <RouterLink to="/sobre"    class="nav-link" :aria-current="ariaCurrent('/sobre')">Sobre</RouterLink>
        <RouterLink to="/estatuto" class="nav-link" :aria-current="ariaCurrent('/estatuto')">Estatuto</RouterLink>
        <RouterLink to="/contato"  class="nav-link" :aria-current="ariaCurrent('/contato')">Contato</RouterLink>
        <RouterLink to="/aluno/formularios" class="nav-link" :aria-current="ariaCurrent('/aluno/formularios')">Formulários</RouterLink>
        <span class="nav-separator" />
        <RouterLink to="/aluno/mensagens"  class="nav-link" :aria-current="ariaCurrent('/aluno/mensagens')">Mensagens</RouterLink>
        <RouterLink to="/aluno/inscricoes" class="nav-link" :aria-current="ariaCurrent('/aluno/inscricoes')">Inscrições</RouterLink>
      </template>

      <NotifBell v-if="!admin" />
      <UserDropdown :admin="admin" />
    </div>
  </nav>
</template>

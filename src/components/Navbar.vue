<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdmin, logout } from '../stores/auth.js'
import { cobrinhaZerada } from '../stores/conquistas.js'
import AdminSidebar from './AdminSidebar.vue'
import awardIcon from '../assets/icons/award.svg?raw'

const menuOpen = ref(false)

const CORES_CONFETE = ['roxo', 'roxo-escuro', 'vermelho', 'verde', 'creme']
const confetes = ref([])
let proximoIdConfete = 1

function explodirConfete() {
  const novos = Array.from({ length: 14 }, () => {
    const angulo = Math.random() * 360
    const distancia = 30 + Math.random() * 26
    return {
      id: proximoIdConfete++,
      cor: CORES_CONFETE[Math.floor(Math.random() * CORES_CONFETE.length)],
      dx: Math.round(Math.cos(angulo * Math.PI / 180) * distancia),
      dy: Math.round(Math.sin(angulo * Math.PI / 180) * distancia - 10),
      rot: Math.round(Math.random() * 360 - 180),
      atraso: Math.round(Math.random() * 60),
    }
  })
  confetes.value = [...confetes.value, ...novos]
  setTimeout(() => {
    const idsNovos = new Set(novos.map(c => c.id))
    confetes.value = confetes.value.filter(c => !idsNovos.has(c.id))
  }, 750)
}
const route  = useRoute()
const router = useRouter()

const sidebarAberta = ref(false)

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
  <nav class="navbar">
    <div class="navbar-left">
      <button
        v-if="isAdmin" type="button" class="sidebar-toggle-btn"
        :aria-expanded="sidebarAberta" aria-controls="admin-sidebar" aria-label="Menu admin"
        @click="sidebarAberta = !sidebarAberta"
      >
        <span /><span /><span />
      </button>

      <RouterLink to="/" class="navbar-brand">
        <div class="logo-circle">
          <img src="/logo_caesi.png" alt="CAESI" class="logo-img">
        </div>
        <span class="navbar-title">
          CAESI <span>{{ isAdmin ? 'Admin' : 'Home' }}</span>
        </span>
        <span
          v-if="!isAdmin && cobrinhaZerada"
          class="navbar-badge"
          title="Você zerou o Easter Egg da cobrinha!"
          @click.stop.prevent="explodirConfete"
        >
          <span v-html="awardIcon"></span>
          <span
            v-for="c in confetes"
            :key="c.id"
            class="navbar-confete"
            :class="'navbar-confete--' + c.cor"
            :style="{ '--dx': c.dx + 'px', '--dy': c.dy + 'px', '--rot': c.rot + 'deg', animationDelay: c.atraso + 'ms' }"
          ></span>
        </span>
      </RouterLink>
    </div>

    <button class="hamburger" @click="menuOpen = !menuOpen"
      aria-label="Menu" :aria-expanded="menuOpen" aria-controls="navbar-menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" id="navbar-menu" :class="{ open: menuOpen }">
      <RouterLink v-if="isAdmin" to="/admin/painel" class="nav-link" :aria-current="ariaCurrent('/admin/painel')" @click="menuOpen = false">Painel</RouterLink>
      <RouterLink to="/sobre"       class="nav-link" :aria-current="ariaCurrent('/sobre')"       @click="menuOpen = false">Sobre</RouterLink>
      <RouterLink to="/ouvidoria"   class="nav-link" :aria-current="ariaCurrent('/ouvidoria')"   @click="menuOpen = false">Ouvidoria</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/ouvidoria" class="nav-link" :aria-current="ariaCurrent('/admin/ouvidoria')" @click="menuOpen = false">Gerenciar tickets</RouterLink>
      <RouterLink to="/mural"       class="nav-link" :aria-current="ariaCurrent('/mural')"       @click="menuOpen = false">Mural</RouterLink>
      <RouterLink to="/mapa"        class="nav-link" :aria-current="ariaCurrent('/mapa')"        @click="menuOpen = false">Mapa</RouterLink>
      <RouterLink to="/informacoes" class="nav-link" :aria-current="ariaCurrent('/informacoes')" @click="menuOpen = false">Informações</RouterLink>
      <RouterLink :to="isAdmin ? '/admin/formularios' : '/formularios'" class="nav-link" :aria-current="ariaCurrent(isAdmin ? '/admin/formularios' : '/formularios')" @click="menuOpen = false">Formulários</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/tasks" class="nav-link" :aria-current="ariaCurrent('/admin/tasks')" @click="menuOpen = false">Tasks</RouterLink>

      <template v-if="isAdmin">
        <span class="nav-separator" />
        <button class="nav-link nav-link-btn" @click="handleLogout">Sair</button>
      </template>
    </div>
  </nav>

  <AdminSidebar v-if="isAdmin" :aberta="sidebarAberta" @close="sidebarAberta = false" />
</template>

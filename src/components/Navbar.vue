<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
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

const mostrarSidebar = computed(() => isAdmin.value && route.path.startsWith('/admin'))
watch(mostrarSidebar, v => document.body.classList.toggle('admin-sidebar-ativa', v), { immediate: true })
onUnmounted(() => document.body.classList.remove('admin-sidebar-ativa'))

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
    <RouterLink :to="isAdmin ? '/admin/painel' : '/'" class="navbar-brand">
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

    <button class="hamburger" @click="menuOpen = !menuOpen"
      aria-label="Menu" :aria-expanded="menuOpen" aria-controls="navbar-menu">
      <span /><span /><span />
    </button>

    <div class="navbar-actions" id="navbar-menu" :class="{ open: menuOpen }">
      <RouterLink to="/sobre"       class="nav-link" :aria-current="ariaCurrent('/sobre')"       @click="menuOpen = false">Sobre</RouterLink>
      <RouterLink to="/ouvidoria"   class="nav-link" :aria-current="ariaCurrent('/ouvidoria')"   @click="menuOpen = false">Ouvidoria</RouterLink>
      <RouterLink to="/mural"       class="nav-link" :aria-current="ariaCurrent('/mural')"       @click="menuOpen = false">Mural</RouterLink>
      <RouterLink to="/mapa"        class="nav-link" :aria-current="ariaCurrent('/mapa')"        @click="menuOpen = false">Mapa</RouterLink>
      <RouterLink to="/informacoes" class="nav-link" :aria-current="ariaCurrent('/informacoes')" @click="menuOpen = false">Informações</RouterLink>
      <RouterLink to="/formularios" class="nav-link" :aria-current="ariaCurrent('/formularios')" @click="menuOpen = false">Formulários</RouterLink>

      <template v-if="isAdmin">
        <span class="nav-separator" />
        <button class="nav-link nav-link-btn" @click="handleLogout">Sair</button>
      </template>
    </div>
  </nav>

  <AdminSidebar v-if="mostrarSidebar" />
</template>

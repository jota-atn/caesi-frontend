<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAdmin, logout } from '../stores/auth.js'
import { cobrinhaZerada } from '../stores/conquistas.js'
import awardIcon from '../assets/icons/award.svg?raw'

const menuOpen     = ref(false)
const conteudoOpen = ref(false)
const dropdownRef  = ref(null)

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
const triggerRef   = ref(null)
const route        = useRoute()
const router       = useRouter()

const CONTEUDO_ROTAS = ['/admin/mural', '/admin/calendario', '/admin/mapa', '/admin/informacoes']
const conteudoAtivo = computed(() => CONTEUDO_ROTAS.some(p => route.path.startsWith(p)))

function handleLogout() {
  fecharTudo()
  logout()
  router.push('/')
}

function ariaCurrent(path) {
  return route.path === path || route.path.startsWith(path + '/') ? 'page' : undefined
}

function fecharTudo() {
  menuOpen.value = false
  conteudoOpen.value = false
}

function onClickFora(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    conteudoOpen.value = false
  }
}

function itensDropdown() {
  return [...(dropdownRef.value?.querySelectorAll('.nav-dropdown-item') ?? [])]
}

async function onDropdownKeydown(e) {
  if (e.key === 'Escape') {
    conteudoOpen.value = false
    triggerRef.value?.focus()
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  e.preventDefault()
  if (!conteudoOpen.value) {
    conteudoOpen.value = true
    await nextTick()
    const itens = itensDropdown()
    itens[e.key === 'ArrowDown' ? 0 : itens.length - 1]?.focus()
    return
  }
  const itens = itensDropdown()
  if (!itens.length) return
  const atual = itens.indexOf(document.activeElement)
  const prox  = e.key === 'ArrowDown' ? (atual + 1) % itens.length : (atual - 1 + itens.length) % itens.length
  itens[prox].focus()
}

onMounted(() => document.addEventListener('click', onClickFora))
onUnmounted(() => document.removeEventListener('click', onClickFora))
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

      <!-- Admin -->
      <template v-if="isAdmin">
        <RouterLink to="/admin/painel"      class="nav-link" :aria-current="ariaCurrent('/admin/painel')"      @click="fecharTudo">Painel</RouterLink>
        <RouterLink to="/admin/mensagens"   class="nav-link" :aria-current="ariaCurrent('/admin/mensagens')"   @click="fecharTudo">Mensagens</RouterLink>
        <RouterLink to="/admin/formularios" class="nav-link" :aria-current="ariaCurrent('/admin/formularios')" @click="fecharTudo">Formulários</RouterLink>
        <RouterLink to="/admin/tasks"       class="nav-link" :aria-current="ariaCurrent('/admin/tasks')"       @click="fecharTudo">Tasks</RouterLink>
        <RouterLink to="/admin/equipe"      class="nav-link" :aria-current="ariaCurrent('/admin/equipe')"      @click="fecharTudo">Equipe</RouterLink>

        <div class="nav-dropdown" :class="{ open: conteudoOpen }" ref="dropdownRef" @keydown="onDropdownKeydown">
          <button type="button" ref="triggerRef" class="nav-link nav-dropdown-trigger" :class="{ 'router-link-active': conteudoAtivo }"
            :aria-expanded="conteudoOpen" @click="conteudoOpen = !conteudoOpen">
            Conteúdo
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          <div class="nav-dropdown-menu">
            <RouterLink to="/admin/mural"       class="nav-dropdown-item" :aria-current="ariaCurrent('/admin/mural')"       @click="fecharTudo">Mural</RouterLink>
            <RouterLink to="/admin/calendario"  class="nav-dropdown-item" :aria-current="ariaCurrent('/admin/calendario')"  @click="fecharTudo">Calendário</RouterLink>
            <RouterLink to="/admin/mapa"        class="nav-dropdown-item" :aria-current="ariaCurrent('/admin/mapa')"        @click="fecharTudo">Mapa</RouterLink>
            <RouterLink to="/admin/informacoes" class="nav-dropdown-item" :aria-current="ariaCurrent('/admin/informacoes')" @click="fecharTudo">Informações</RouterLink>
          </div>
        </div>

        <span class="nav-separator" />
        <button class="nav-link nav-link-btn" @click="handleLogout">Sair</button>
      </template>

      <!-- Público -->
      <template v-else>
        <RouterLink to="/mural"       class="nav-link" :aria-current="ariaCurrent('/mural')"       @click="menuOpen = false">Mural</RouterLink>
        <RouterLink to="/informacoes" class="nav-link" :aria-current="ariaCurrent('/informacoes')" @click="menuOpen = false">Informações</RouterLink>
        <RouterLink to="/formularios" class="nav-link" :aria-current="ariaCurrent('/formularios')" @click="menuOpen = false">Formulários</RouterLink>
      </template>

    </div>
  </nav>
</template>

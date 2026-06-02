<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { user } from '../stores/auth.js'
import { notificacoes, marcarLida, marcarTodasLidas } from '../stores/notificacoes.js'

const router = useRouter()
const aberto = ref(false)
const bellRef = ref(null)

const minhas = computed(() =>
  notificacoes.value
    .filter(n => n.userEmail === user.value?.email)
    .slice()
    .sort((a, b) => b.id - a.id)
)

const naoLidas = computed(() => minhas.value.filter(n => !n.lida).length)

function toggle() { aberto.value = !aberto.value }

function fechar(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) aberto.value = false
}

function clicarNotif(notif) {
  marcarLida(notif.id)
  aberto.value = false
  if (notif.link) {
    router.push(notif.link)
  } else if (notif.mensagemId) {
    router.push(`/aluno/mensagem/${notif.mensagemId}`)
  }
}

function marcarTodas() {
  marcarTodasLidas(user.value?.email)
}

function textoNotif(n) {
  if (n.titulo) return n.titulo
  if (n.tipo === 'resposta') return 'O CAESI respondeu sua mensagem'
  if (n.tipo === 'atendida') return 'Sua mensagem foi marcada como atendida'
  return 'Nova atualização'
}

function subtituloNotif(n) {
  return n.subtitulo ?? n.mensagemAssunto ?? null
}

function metaNotif(n) {
  const partes = []
  if (n.mensagemProtocolo) partes.push(n.mensagemProtocolo)
  partes.push(relativo(n.criadaEm))
  return partes.join(' · ')
}

function relativo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.floor(h / 24)
  return `há ${d}d`
}

// ── Navegação por teclado ─────────────────────────────────
function _items() {
  return [...(bellRef.value?.querySelectorAll('.notif-item') ?? [])]
}

function handleKeydown(e) {
  if (!aberto.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      aberto.value = true
      nextTick(() => _items()[0]?.focus())
    }
    return
  }

  const items = _items()
  const idx   = items.indexOf(document.activeElement)

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    items[idx < items.length - 1 ? idx + 1 : 0]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    items[idx > 0 ? idx - 1 : items.length - 1]?.focus()
  } else if (e.key === 'Home') {
    e.preventDefault()
    items[0]?.focus()
  } else if (e.key === 'End') {
    e.preventDefault()
    items[items.length - 1]?.focus()
  } else if (e.key === 'Escape') {
    e.stopPropagation()
    aberto.value = false
    bellRef.value?.querySelector('.notif-bell-btn')?.focus()
  } else if (e.key === 'Tab') {
    aberto.value = false
  }
}

onMounted(() => document.addEventListener('click', fechar))
onUnmounted(() => document.removeEventListener('click', fechar))
</script>

<template>
  <div class="notif-bell-wrap" ref="bellRef" @keydown="handleKeydown">
    <button class="notif-bell-btn" @click.stop="toggle" :class="{ active: aberto }"
      aria-label="Notificações" aria-haspopup="menu" :aria-expanded="aberto">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="naoLidas > 0" class="notif-bell-badge">{{ naoLidas > 9 ? '9+' : naoLidas }}</span>
    </button>

    <Transition name="dropdown">
      <div v-if="aberto" class="notif-dropdown">
        <div class="notif-dropdown-header">
          <span class="notif-dropdown-title">Notificações</span>
          <button v-if="naoLidas > 0" class="notif-marcar-todas" @click="marcarTodas">
            Marcar todas como lidas
          </button>
        </div>

        <div v-if="minhas.length === 0" class="notif-vazio">
          Nenhuma notificação ainda.
        </div>

        <div v-else class="notif-lista">
          <button
            v-for="n in minhas"
            :key="n.id"
            class="notif-item"
            :class="{ nao_lida: !n.lida }"
            @click="clicarNotif(n)"
          >
            <div class="notif-item-dot" v-if="!n.lida" />
            <div class="notif-item-body">
              <div class="notif-item-texto">{{ textoNotif(n) }}</div>
              <div v-if="subtituloNotif(n)" class="notif-item-assunto">{{ subtituloNotif(n) }}</div>
              <div class="notif-item-meta">{{ metaNotif(n) }}</div>
            </div>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

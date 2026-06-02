<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes } from '../../stores/formularios.js'
import { user } from '../../stores/auth.js'
import { usePersistedFilter } from '../../composables/usePersistedFilter.js'

const filtro = usePersistedFilter('caesi-aluno-forms-filtro', 'todos')
const busca  = usePersistedFilter('caesi-aluno-forms-busca', '')

const TIPO_LABEL = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

function prazoExpirado(prazo) {
  if (!prazo) return false
  return new Date(prazo + 'T23:59:59') < new Date()
}

function estaInscrito(formularioId) {
  return inscricoes.value.some(i => i.formularioId === formularioId && i.userEmail === user.value?.email)
}

function inscricoesCount(formularioId) {
  return inscricoes.value.filter(i => i.formularioId === formularioId).length
}

function vagasEsgotadas(f) {
  return f.limiteVagas != null && inscricoesCount(f.id) >= f.limiteVagas
}

function disponivel(f) {
  return f.status === 'aberto' && !prazoExpirado(f.prazoInscricao) && !vagasEsgotadas(f)
}

function badgeIndisponivel(f) {
  if (f.status !== 'aberto') return 'Encerrado'
  if (prazoExpirado(f.prazoInscricao)) return 'Prazo esgotado'
  if (vagasEsgotadas(f)) return 'Vagas esgotadas'
  return null
}

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function diasParaFechamento(prazo) {
  if (!prazo) return null
  return Math.ceil((new Date(prazo + 'T23:59:59') - new Date()) / 86400000)
}

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const formulariosFiltrados = computed(() =>
  formularios.value
    .filter(f => {
      if (filtro.value === 'gratuitos' && f.pago)  return false
      if (filtro.value === 'pagos'     && !f.pago) return false
      const t = busca.value.toLowerCase().trim()
      if (t && !f.titulo.toLowerCase().includes(t) && !(f.descricao ?? '').toLowerCase().includes(t)) return false
      return true
    })
    .sort((a, b) => (a.status === 'aberto' ? -1 : 1) - (b.status === 'aberto' ? -1 : 1))
)

const totalInscritos = computed(() =>
  formularios.value.filter(f => estaInscrito(f.id)).length
)
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Formulários <span>e Eventos</span></h2>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ formularios.length }}</div>
          <div class="stat-label">Disponíveis</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--verde">{{ totalInscritos }}</div>
          <div class="stat-label">Inscrito em</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ formularios.filter(f => f.pago).length }}</div>
          <div class="stat-label">Com pagamento</div>
        </div>
      </div>

      <div class="filter-bar" role="group" aria-label="Filtrar formulários">
        <input v-model="busca" type="search" placeholder="Buscar formulário…">
        <button class="filter-btn" :class="{ active: filtro === 'todos' }"     :aria-pressed="filtro === 'todos'"     @click="filtro = 'todos'">Todos</button>
        <button class="filter-btn" :class="{ active: filtro === 'gratuitos' }" :aria-pressed="filtro === 'gratuitos'" @click="filtro = 'gratuitos'">Gratuitos</button>
        <button class="filter-btn" :class="{ active: filtro === 'pagos' }"     :aria-pressed="filtro === 'pagos'"     @click="filtro = 'pagos'">Pagos</button>
      </div>

      <RouterLink
        v-for="f in formulariosFiltrados"
        :key="f.id"
        :to="`/aluno/formularios/${f.id}`"
        class="form-card"
        :class="disponivel(f) ? 'aberto' : 'encerrado'"
      >
        <div class="form-card-info">
          <div class="form-card-tags">
            <span class="tipo-tag" :class="`tipo-${f.tipo}`">{{ TIPO_LABEL[f.tipo] }}</span>
            <span v-if="badgeIndisponivel(f)" class="form-status-badge form-status-encerrado">
              {{ badgeIndisponivel(f) }}
            </span>
            <span v-if="estaInscrito(f.id)" class="comp-badge comp-validado">Inscrito</span>
            <span
              v-if="disponivel(f) && diasParaFechamento(f.prazoInscricao) !== null && diasParaFechamento(f.prazoInscricao) <= 3"
              class="prazo-urgente-badge"
            >Fecha em {{ diasParaFechamento(f.prazoInscricao) === 1 ? '1 dia' : diasParaFechamento(f.prazoInscricao) + ' dias' }}</span>
          </div>
          <div class="form-card-title">{{ f.titulo }}</div>
          <div class="form-card-desc">{{ f.descricao }}</div>
          <div class="form-card-meta">
            <span>{{ f.pago ? formatValor(f.valor) + (f.tipo === 'venda' ? ' / unid.' : ' / pessoa') : 'Gratuito' }}</span>
            <template v-if="f.limiteVagas">
              <span>·</span>
              <span :style="vagasEsgotadas(f) ? 'color:var(--vermelho);font-weight:600;' : ''">
                {{ inscricoesCount(f.id) }}/{{ f.limiteVagas }} vagas
              </span>
            </template>
            <template v-if="f.prazoInscricao">
              <span>·</span>
              <span>Prazo: {{ formatData(f.prazoInscricao) }}</span>
            </template>
          </div>
        </div>
        <div class="form-card-right">
          <span class="msg-card-arrow">→</span>
        </div>
      </RouterLink>

      <div v-if="formulariosFiltrados.length === 0" class="empty-state">
        <p>{{ formularios.length === 0 ? 'Nenhum formulário disponível ainda.' : 'Nenhum resultado para este filtro.' }}</p>
      </div>
    </div>
  </div>
</template>

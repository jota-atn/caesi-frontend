<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import MsgCard from '../../components/MsgCard.vue'
import Pagination from '../../components/Pagination.vue'
import { usePagination } from '../../composables/usePagination.js'
import { usePersistedFilter } from '../../composables/usePersistedFilter.js'
import { mensagens } from '../../stores/mensagens.js'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const filtro = usePersistedFilter('caesi-admin-painel-filtro', 'todas')
const busca  = usePersistedFilter('caesi-admin-painel-busca', '')

const TIPO_LABEL = {
  disciplina:     'Disciplina',
  professores:    'Professores',
  colegas:        'Colegas de curso',
  infraestrutura: 'Infraestrutura',
  ofertas:        'Ofertas e horários',
  grupos:         'Grupos estudantis',
  outros:         'Outros',
}

const mensagensFiltradas = computed(() => {
  return mensagens.value.filter(m => {
    const matchFiltro = filtro.value === 'todas' || m.status === filtro.value
    const termo = busca.value.toLowerCase()
    const matchBusca = !termo ||
      (m.preview ?? '').toLowerCase().includes(termo) ||
      (m.nome ?? '').toLowerCase().includes(termo) ||
      (TIPO_LABEL[m.tipo] ?? '').toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })
})

const totalPendente = computed(() => mensagens.value.filter(m => m.status === 'pendente').length)
const totalAtendida = computed(() => mensagens.value.filter(m => m.status === 'atendida').length)

const { page, totalPages, paginated: mensagensPaginadas, next, prev, goTo } = usePagination(mensagensFiltradas, 15)

function exportarCSV() {
  const cols = ['Protocolo', 'Data', 'Tipo de relato', 'Período', 'Nome', 'E-mail', 'Status', 'Anotação interna', 'Resposta']
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const linhas = mensagens.value.map(m => [
    m.protocolo,
    m.data,
    TIPO_LABEL[m.tipo] ?? m.tipo ?? '',
    m.periodo ?? '',
    m.nome ?? 'Anônimo',
    m.email ?? '',
    m.status,
    m.nota ?? '',
    m.resposta ?? '',
  ].map(esc).join(','))

  const csv = [cols.map(esc).join(','), ...linhas].join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mensagens-caesi-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const TIPO_COR = {
  disciplina:     '#2050A0',
  professores:    '#1A5A50',
  colegas:        '#1A6040',
  infraestrutura: '#904010',
  ofertas:        '#4B3591',
  grupos:         '#701860',
  outros:         '#404060',
}

const donutData = computed(() => {
  const contagem = {}
  for (const m of mensagens.value) {
    contagem[m.tipo] = (contagem[m.tipo] ?? 0) + 1
  }
  const tipos = Object.keys(contagem)
  return {
    labels: tipos.map(t => TIPO_LABEL[t] ?? t),
    datasets: [{
      data: tipos.map(t => contagem[t]),
      backgroundColor: tipos.map(t => TIPO_COR[t] ?? '#A0A0A0'),
      borderWidth: 2,
      borderColor: '#FEFAF4',
    }],
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { font: { family: 'Archivo', size: 12 }, padding: 16 } },
  },
}

const barData = computed(() => {
  const meses = {}
  const agora = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses[chave] = 0
  }
  for (const m of mensagens.value) {
    const d = new Date(m.id)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (chave in meses) meses[chave]++
  }
  const labels = Object.keys(meses).map(k => {
    const [ano, mes] = k.split('-')
    return new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  })
  return {
    labels,
    datasets: [{
      label: 'Tickets',
      data: Object.values(meses),
      backgroundColor: 'rgba(107,79,187,0.75)',
      borderRadius: 4,
    }],
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Archivo' } }, grid: { color: 'rgba(0,0,0,0.06)' } },
    x: { ticks: { font: { family: 'Archivo' } }, grid: { display: false } },
  },
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>
    <div class="deco-star" style="bottom:25%;left:1%;font-size:1.4rem;opacity:0.28;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/painel" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Painel da <span>Ouvidoria</span></h2>
        <button class="btn btn-outline btn-sm" :disabled="mensagens.length === 0" @click="exportarCSV">
          ↓ Exportar CSV
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ mensagens.length }}</div>
          <div class="stat-label">Total recebidas</div>
        </div>
        <div class="stat-card stat-card--amarelo">
          <div class="stat-number stat-number--roxo">{{ totalPendente }}</div>
          <div class="stat-label">Pendentes</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--verde">{{ totalAtendida }}</div>
          <div class="stat-label">Atendidas</div>
        </div>
      </div>

      <div v-if="mensagens.length > 0" class="charts-grid">
        <div class="paper paper-sm">
          <p class="label-sm" style="margin-bottom:1rem;">Por categoria</p>
          <div class="chart-wrap">
            <Doughnut :data="donutData" :options="donutOptions" />
          </div>
        </div>
        <div class="paper paper-sm">
          <p class="label-sm" style="margin-bottom:1rem;">Tickets por mês</p>
          <div class="chart-wrap">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </div>
      </div>

      <div class="filter-bar">
        <input v-model="busca" type="search" placeholder="Buscar por tipo, nome ou mensagem…">
        <button class="filter-btn" :class="{ active: filtro === 'todas' }"    :aria-pressed="filtro === 'todas'"    @click="filtro = 'todas'">Todas</button>
        <button class="filter-btn" :class="{ active: filtro === 'pendente' }" :aria-pressed="filtro === 'pendente'" @click="filtro = 'pendente'">Pendentes</button>
        <button class="filter-btn" :class="{ active: filtro === 'atendida' }" :aria-pressed="filtro === 'atendida'" @click="filtro = 'atendida'">Atendidas</button>
      </div>

      <MsgCard
        v-for="m in mensagensPaginadas"
        :key="m.id"
        :mensagem="m"
        :to="`/admin/ouvidoria/${m.id}`"
      />

      <div v-if="mensagensFiltradas.length === 0" class="empty-state">
        <p>{{ mensagens.length === 0 ? 'Nenhuma mensagem recebida ainda.' : 'Nenhuma mensagem encontrada.' }}</p>
        <span v-if="mensagens.length > 0" style="font-size:0.85rem;">Tente outro filtro ou termo de busca.</span>
      </div>

      <Pagination :page="page" :totalPages="totalPages" @prev="prev" @next="next" @goto="goTo" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  margin-top: 14px;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p {
  font-size: 1rem;
  font-weight: 600;
  color: var(--preto);
  margin-bottom: 0.4rem;
}
.empty-state span {
  font-size: 0.85rem;
  color: var(--cinza);
}
</style>

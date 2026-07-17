<script setup>
import { computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js'
import { mensagens } from '../../stores/mensagens.js'
import { membros } from '../../stores/equipe.js'
import { formularios, inscricoes } from '../../stores/formularios.js'
import { tasks } from '../../stores/tasks.js'
import { publicacoes } from '../../stores/mural.js'
import { eventos, proximosEventos } from '../../stores/calendario.js'
import { estruturas } from '../../stores/mapa.js'
import { editais, professores, laboratorios } from '../../stores/informacoes.js'
import { artefatos } from '../../stores/portal.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const totalMensagens = computed(() => mensagens.value.length)
const pendentes      = computed(() => mensagens.value.filter(m => m.status === 'pendente').length)
const atendidas      = computed(() => mensagens.value.filter(m => m.status === 'atendida').length)

const formsAbertos    = computed(() => formularios.value.filter(f => f.status === 'aberto').length)
const formsEncerrados = computed(() => formularios.value.filter(f => f.status === 'encerrado').length)
const compPendentes   = computed(() => inscricoes.value.filter(i => i.comprovante?.status === 'pendente').length)
const cancelamentosPendentes = computed(() => inscricoes.value.filter(i => i.cancelamento?.solicitado).length)

function formatValorCompacto(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 10_000)    return `R$ ${(valor / 1_000).toFixed(1).replace('.', ',')}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const tasksPendentes  = computed(() => tasks.value.filter(t => t.status === 'pendente').length)
const tasksAndamento  = computed(() => tasks.value.filter(t => t.status === 'em-andamento').length)
const tasksConcluidas = computed(() => tasks.value.filter(t => t.status === 'concluida').length)

const totalInformacoes = computed(() => editais.value.length + professores.value.length + laboratorios.value.length + artefatos.value.length)

const receitaTotal = computed(() => {
  return formularios.value
    .filter(f => f.pago)
    .reduce((soma, f) => {
      const confirmadas = inscricoes.value.filter(
        i => i.formularioId === f.id && ['validado', 'arquivado'].includes(i.comprovante?.status)
      )
      return soma + confirmadas.reduce((s, i) => {
        const qtd = f.tipo === 'venda' ? (Number(i.respostas?.__quantidade) || 1) : 1
        return s + f.valor * qtd
      }, 0)
    }, 0)
})

function chaveDoMes(timestamp) {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildMesesLabels() {
  const agora = new Date()
  const meses = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    meses[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
  }
  return meses
}

function mesToLabel(chave) {
  const [ano, mes] = chave.split('-')
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function calcTendencia(lista, getTimestamp) {
  const agora = new Date()
  const atual   = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  const prev    = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  const anterior = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  const contAtual    = lista.filter(x => chaveDoMes(getTimestamp(x)) === atual).length
  const contAnterior = lista.filter(x => chaveDoMes(getTimestamp(x)) === anterior).length
  if (contAnterior === 0) return null
  const pct = Math.round(((contAtual - contAnterior) / contAnterior) * 100)
  return { pct: Math.abs(pct), sobe: pct >= 0 }
}

const tendenciaMensagens  = computed(() => calcTendencia(mensagens.value, m => m.id))
const tendenciaInscricoes = computed(() => calcTendencia(inscricoes.value, i => i.id))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Archivo' } }, grid: { color: 'rgba(0,0,0,0.06)' } },
    x: { ticks: { font: { family: 'Archivo' } }, grid: { display: false } },
  },
}

const barMensagens = computed(() => {
  const meses = buildMesesLabels()
  for (const m of mensagens.value) {
    const c = chaveDoMes(m.id)
    if (c in meses) meses[c]++
  }
  return {
    labels: Object.keys(meses).map(mesToLabel),
    datasets: [{ data: Object.values(meses), backgroundColor: 'rgba(107,79,187,0.75)', borderRadius: 4 }],
  }
})

const barInscricoes = computed(() => {
  const meses = buildMesesLabels()
  for (const i of inscricoes.value) {
    const c = chaveDoMes(i.id)
    if (c in meses) meses[c]++
  }
  return {
    labels: Object.keys(meses).map(mesToLabel),
    datasets: [{ data: Object.values(meses), backgroundColor: 'rgba(78,170,119,0.75)', borderRadius: 4 }],
  }
})

const donutInscricoes = computed(() => {
  const confirmadas   = inscricoes.value.filter(i => !i.cancelamento?.solicitado && (i.comprovante === null || ['validado', 'arquivado'].includes(i.comprovante?.status))).length
  const pagPendente   = inscricoes.value.filter(i => !i.cancelamento?.solicitado && i.comprovante?.status === 'pendente').length
  const cancelamento  = inscricoes.value.filter(i => i.cancelamento?.solicitado).length
  return {
    labels: ['Confirmadas', 'Pag. pendente', 'Cancel. solicit.'],
    datasets: [{
      data: [confirmadas, pagPendente, cancelamento],
      backgroundColor: ['rgba(78,170,119,0.8)', 'rgba(240,192,64,0.8)', 'rgba(217,85,85,0.8)'],
      borderWidth: 2,
      borderColor: '#FEFAF4',
    }],
  }
})

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { family: 'Archivo', size: 11 }, padding: 10 } },
  },
}

const temDados = computed(() => mensagens.value.length > 0 || inscricoes.value.length > 0)
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar />

    <div class="page-content page-content--wide">
      <div class="page-heading">
        <h2>Painel <span>Geral</span></h2>
      </div>

      <!-- Gráficos de atividade -->
      <div v-if="temDados" class="painel-charts-grid">
        <div v-if="mensagens.length > 0" class="paper paper-sm">
          <p class="label-sm">Tickets por mês</p>
          <p v-if="tendenciaMensagens" class="painel-tendencia">
            {{ tendenciaMensagens.sobe ? '↑' : '↓' }} {{ tendenciaMensagens.pct }}% vs. mês ant.
          </p>
          <div class="painel-chart-wrap">
            <Bar :data="barMensagens" :options="barOptions" />
          </div>
        </div>
        <div v-if="inscricoes.length > 0" class="paper paper-sm">
          <p class="label-sm">Inscrições por mês</p>
          <p v-if="tendenciaInscricoes" class="painel-tendencia">
            {{ tendenciaInscricoes.sobe ? '↑' : '↓' }} {{ tendenciaInscricoes.pct }}% vs. mês ant.
          </p>
          <div class="painel-chart-wrap">
            <Bar :data="barInscricoes" :options="barOptions" />
          </div>
        </div>
        <div v-if="inscricoes.length > 0" class="paper paper-sm">
          <p class="label-sm" style="margin-bottom:0.75rem;">Inscrições por status</p>
          <div class="painel-chart-wrap">
            <Doughnut :data="donutInscricoes" :options="donutOptions" />
          </div>
        </div>
      </div>

      <div class="paper paper-flush">

        <!-- Ouvidoria -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Ouvidoria</span>
            <span class="geral-row-badge" :class="pendentes > 0 ? 'alerta' : 'ok'">
              {{ pendentes > 0 ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Em dia' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ totalMensagens }}</span>
              <span class="geral-mini-label">Total</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--roxo);">{{ pendentes }}</span>
              <span class="geral-mini-label">Pendentes</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ atendidas }}</span>
              <span class="geral-mini-label">Atendidas</span>
            </div>
          </div>
          <RouterLink to="/admin/ouvidoria" class="geral-row-link">Ver painel →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Formulários -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Formulários</span>
            <span class="geral-row-badge" :class="cancelamentosPendentes > 0 || compPendentes > 0 ? 'alerta' : 'ok'">
              <template v-if="cancelamentosPendentes > 0">
                {{ cancelamentosPendentes }} cancel. pendente{{ cancelamentosPendentes > 1 ? 's' : '' }}
              </template>
              <template v-else-if="compPendentes > 0">
                {{ compPendentes }} comp. pendente{{ compPendentes > 1 ? 's' : '' }}
              </template>
              <template v-else>Em dia</template>
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ formsAbertos }}</span>
              <span class="geral-mini-label">Abertos</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--cinza);">{{ formsEncerrados }}</span>
              <span class="geral-mini-label">Encerrados</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);font-size:1.1rem;line-height:1.2;">
                {{ formatValorCompacto(receitaTotal) }}
              </span>
              <span class="geral-mini-label">Receita confirmada</span>
            </div>
          </div>
          <RouterLink to="/admin/formularios" class="geral-row-link">Ver formulários →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Tasks -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Tasks</span>
            <span class="geral-row-badge" :class="tasksAndamento > 0 ? 'ok' : 'ok'">
              {{ tasksAndamento > 0 ? `${tasksAndamento} em andamento` : 'Nenhuma em andamento' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--cinza);">{{ tasksPendentes }}</span>
              <span class="geral-mini-label">Pendentes</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--roxo);">{{ tasksAndamento }}</span>
              <span class="geral-mini-label">Em andamento</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ tasksConcluidas }}</span>
              <span class="geral-mini-label">Concluídas</span>
            </div>
          </div>
          <RouterLink to="/admin/tasks" class="geral-row-link">Ver tasks →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Mural -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Mural</span>
            <span class="geral-row-badge neutro">
              {{ publicacoes.length }} publicaç{{ publicacoes.length === 1 ? 'ão' : 'ões' }}
            </span>
          </div>
          <RouterLink to="/admin/mural" class="geral-row-link">Ver mural →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Calendário -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Calendário</span>
            <span class="geral-row-badge" :class="proximosEventos.length > 0 ? 'ok' : 'neutro'">
              {{ proximosEventos.length > 0 ? `${proximosEventos.length} próximo${proximosEventos.length > 1 ? 's' : ''}` : 'Nenhum evento futuro' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ eventos.length }}</span>
              <span class="geral-mini-label">Total</span>
            </div>
          </div>
          <RouterLink to="/admin/calendario" class="geral-row-link">Ver calendário →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Mapa -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Mapa</span>
            <span class="geral-row-badge neutro">
              {{ estruturas.length }} estrutura{{ estruturas.length === 1 ? '' : 's' }}
            </span>
          </div>
          <RouterLink to="/admin/mapa" class="geral-row-link">Ver mapa →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Informações -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Informações</span>
            <span class="geral-row-badge neutro">{{ totalInformacoes }} itens</span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ editais.length }}</span>
              <span class="geral-mini-label">Editais</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ professores.length }}</span>
              <span class="geral-mini-label">Professores</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ laboratorios.length }}</span>
              <span class="geral-mini-label">Laboratórios</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ artefatos.length }}</span>
              <span class="geral-mini-label">Portal</span>
            </div>
          </div>
          <RouterLink to="/admin/informacoes" class="geral-row-link">Ver informações →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Equipe -->
        <div class="geral-row geral-row--equipe">
          <div class="geral-row-left">
            <span class="geral-row-title">Equipe</span>
          </div>
          <div class="geral-equipe-grid">
            <div v-for="a in membros" :key="a.id" class="geral-equipe-chip">
              <span class="geral-chip-dir">{{ a.periodo || '—' }}</span>
              <span class="geral-chip-nome" :class="{ vazio: !a.nome }">{{ a.nome || '—' }}</span>
            </div>
            <div v-if="membros.length === 0" style="font-size:0.82rem;color:var(--cinza);">
              Nenhum membro cadastrado.
            </div>
          </div>
          <RouterLink to="/sobre?editar=1" class="geral-row-link">Editar →</RouterLink>
        </div>

      </div>
    </div>
  </div>
</template>

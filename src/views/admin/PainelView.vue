<script setup>
import { computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import { mensagens } from '../../stores/mensagens.js'
import { usuarios } from '../../stores/usuarios.js'
import { equipe } from '../../stores/equipe.js'
import { formularios, inscricoes } from '../../stores/formularios.js'
import { tasks } from '../../stores/tasks.js'
import { user } from '../../stores/auth.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const totalMensagens = computed(() => mensagens.value.length)
const pendentes      = computed(() => mensagens.value.filter(m => m.status === 'pendente').length)
const atendidas      = computed(() => mensagens.value.filter(m => m.status === 'atendida').length)

const totalUsuarios  = computed(() => usuarios.value.filter(u => u.role !== 'admin').length)
const ativos         = computed(() => usuarios.value.filter(u => u.role !== 'admin' && u.ativo !== false).length)
const inativos       = computed(() => usuarios.value.filter(u => u.role !== 'admin' && u.ativo === false).length)

const formsAbertos    = computed(() => formularios.value.filter(f => f.status === 'aberto').length)
const formsEncerrados = computed(() => formularios.value.filter(f => f.status === 'encerrado').length)
const compPendentes   = computed(() => inscricoes.value.filter(i => i.comprovante?.status === 'pendente').length)

function formatValorCompacto(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 10_000)    return `R$ ${(valor / 1_000).toFixed(1).replace('.', ',')}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

const isRootAdmin     = computed(() => user.value?.email === 'admin')
const tasksPendentes  = computed(() => tasks.value.filter(t => t.status === 'pendente').length)
const tasksAndamento  = computed(() => tasks.value.filter(t => t.status === 'em-andamento').length)
const tasksConcluidas = computed(() => tasks.value.filter(t => t.status === 'concluida').length)
const solicitacoesPendentes = computed(() =>
  tasks.value.reduce((acc, t) => acc + t.solicitacoes.length, 0)
)

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

function buildMesesLabels() {
  const agora = new Date()
  const meses = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses[chave] = 0
  }
  return meses
}

function chaveDoMes(timestamp) {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function mesToLabel(chave) {
  const [ano, mes] = chave.split('-')
  return new Date(Number(ano), Number(mes) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.06)' } },
    x: { ticks: { font: { family: 'Inter' } }, grid: { display: false } },
  },
}

const barMensagens = computed(() => {
  const meses = buildMesesLabels()
  for (const m of mensagens.value) {
    const chave = chaveDoMes(m.id)
    if (chave in meses) meses[chave]++
  }
  return {
    labels: Object.keys(meses).map(mesToLabel),
    datasets: [{ label: 'Mensagens', data: Object.values(meses), backgroundColor: 'rgba(107,79,187,0.75)', borderRadius: 4 }],
  }
})

const barInscricoes = computed(() => {
  const meses = buildMesesLabels()
  for (const i of inscricoes.value) {
    const chave = chaveDoMes(i.id)
    if (chave in meses) meses[chave]++
  }
  return {
    labels: Object.keys(meses).map(mesToLabel),
    datasets: [{ label: 'Inscrições', data: Object.values(meses), backgroundColor: 'rgba(78,170,119,0.75)', borderRadius: 4 }],
  }
})

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
        <div class="paper paper-sm">
          <p class="label-sm" style="margin-bottom:1rem;">Mensagens por mês</p>
          <div class="painel-chart-wrap">
            <Bar :data="barMensagens" :options="barOptions" />
          </div>
        </div>
        <div class="paper paper-sm">
          <p class="label-sm" style="margin-bottom:1rem;">Inscrições por mês</p>
          <div class="painel-chart-wrap">
            <Bar :data="barInscricoes" :options="barOptions" />
          </div>
        </div>
      </div>

      <div class="paper paper-flush">

        <!-- Mensagens -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Mensagens</span>
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
          <RouterLink to="/admin/mensagens" class="geral-row-link">Ver painel →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Usuários -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Usuários</span>
            <span class="geral-row-badge" :class="inativos > 0 ? 'alerta' : 'ok'">
              {{ inativos > 0 ? `${inativos} inativo${inativos > 1 ? 's' : ''}` : 'Todos ativos' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ totalUsuarios }}</span>
              <span class="geral-mini-label">Cadastrados</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ ativos }}</span>
              <span class="geral-mini-label">Ativos</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--cinza);">{{ inativos }}</span>
              <span class="geral-mini-label">Inativos</span>
            </div>
          </div>
          <RouterLink to="/admin/usuarios" class="geral-row-link">Gerenciar →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Formulários -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Formulários</span>
            <span class="geral-row-badge" :class="compPendentes > 0 ? 'alerta' : 'ok'">
              {{ compPendentes > 0 ? `${compPendentes} comp. pendente${compPendentes > 1 ? 's' : ''}` : 'Em dia' }}
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
            <span class="geral-row-badge" :class="solicitacoesPendentes > 0 && isRootAdmin ? 'alerta' : 'ok'">
              <template v-if="isRootAdmin && solicitacoesPendentes > 0">
                {{ solicitacoesPendentes }} solicitação{{ solicitacoesPendentes > 1 ? 'ões' : '' }}
              </template>
              <template v-else>
                {{ tasksAndamento > 0 ? `${tasksAndamento} em andamento` : 'Nenhuma em andamento' }}
              </template>
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

        <!-- Equipe -->
        <div class="geral-row geral-row--equipe">
          <div class="geral-row-left">
            <span class="geral-row-title">Equipe</span>
          </div>
          <div class="geral-equipe-grid">
            <div v-for="d in equipe" :key="d.diretoria" class="geral-equipe-chip">
              <span class="geral-chip-dir">{{ d.diretoria }}</span>
              <span class="geral-chip-nome" :class="{ vazio: !d.presidente }">
                {{ d.presidente || '—' }}
              </span>
            </div>
          </div>
          <RouterLink to="/admin/equipe" class="geral-row-link">Editar →</RouterLink>
        </div>

      </div>
    </div>
  </div>
</template>

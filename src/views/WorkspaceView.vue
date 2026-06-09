<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { tasks, membros, atualizarStatus, salvarAnotacao, autoAlocar } from '../stores/tasks.js'
import { showToast } from '../stores/toast.js'
import lockIcon      from '../assets/icons/lock.svg?raw'
import clipboardIcon from '../assets/icons/clipboard.svg?raw'
import pencilIcon    from '../assets/icons/pencil.svg?raw'
import warningIcon   from '../assets/icons/warning.svg?raw'
import zapIcon       from '../assets/icons/zap.svg?raw'
import calendarIcon  from '../assets/icons/calendar.svg?raw'

const route  = useRoute()
const membro = computed(() => membros.value.find(m => m.token === route.params.token) || null)

const minhasTasks = computed(() => {
  if (!membro.value) return []
  return tasks.value.filter(t => t.alocados.includes(membro.value.id))
})

const primeiroNome = computed(() => membro.value?.nome.split(' ')[0] ?? '')
const iniciais     = computed(() => membro.value?.nome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) ?? '')

const concluidas = computed(() => minhasTasks.value.filter(t => t.status === 'concluida').length)
const progresso  = computed(() => {
  const total = minhasTasks.value.length
  return total === 0 ? 0 : Math.round((concluidas.value / total) * 100)
})

const contagem = computed(() => ({
  pendente:       minhasTasks.value.filter(t => t.status === 'pendente').length,
  'em-andamento': minhasTasks.value.filter(t => t.status === 'em-andamento').length,
  concluida:      concluidas.value,
}))

// ── Tasks disponíveis para seleção ───────────────────────
const tasksDisponiveis = computed(() => {
  if (!membro.value) return []
  return tasks.value.filter(t =>
    t.selecionavel &&
    t.status !== 'concluida' &&
    !t.alocados.includes(membro.value.id)
  )
})

function pegarTask(taskId) {
  autoAlocar(taskId, membro.value.id)
  showToast('Task adicionada ao seu workspace!', 'success')
}

// ── Anotações ─────────────────────────────────────────────
const notasEdit = ref({}) // taskId → texto em edição

function getAnotacao(taskId) {
  const task = tasks.value.find(t => t.id === taskId)
  return task?.anotacoes?.[membro.value?.id]?.texto ?? ''
}

function editarNota(taskId) {
  notasEdit.value = { ...notasEdit.value, [taskId]: getAnotacao(taskId) }
}

function cancelarNota(taskId) {
  const copia = { ...notasEdit.value }
  delete copia[taskId]
  notasEdit.value = copia
}

function salvarNota(taskId) {
  salvarAnotacao(taskId, membro.value.id, notasEdit.value[taskId] ?? '')
  cancelarNota(taskId)
  showToast('Nota salva.', 'success')
}

function estaEditandoNota(taskId) {
  return taskId in notasEdit.value
}

// ── Helpers visuais ───────────────────────────────────────
const labelPrioridade = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }
const labelCategoria  = { gestao: 'Gestão', formularios: 'Formulários', ouvidoria: 'Ouvidoria' }
const labelStatus     = { pendente: 'Pendente', 'em-andamento': 'Em andamento', concluida: 'Concluída' }

function prazoFormatado(prazo) {
  const [ano, mes, dia] = prazo.split('-')
  return `${dia}/${mes}/${ano}`
}

function prazoAlerta(prazo) {
  if (!prazo) return null
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const d    = new Date(prazo + 'T00:00:00')
  const diff = (d - hoje) / 86400000
  return diff < 0 ? 'vencida' : diff <= 3 ? 'proxima' : null
}

function diasRestantes(prazo) {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const d    = new Date(prazo + 'T00:00:00')
  return Math.ceil((d - hoje) / 86400000)
}
</script>

<template>
  <!-- ── Link inválido ──────────────────────────────────── -->
  <div v-if="!membro" class="ws-invalido-page">
    <div class="ws-inv-content">
      <div class="ws-inv-logo">
        <img src="/logo_caesi.png" alt="CAESI" />
      </div>
      <div class="ws-inv-icon" v-html="lockIcon"></div>
      <h2 class="ws-inv-title">Link inválido ou expirado</h2>
      <p class="ws-inv-desc">Este link não é mais válido. Solicite um novo ao administrador do CAESI.</p>
      <RouterLink to="/" class="btn btn-outline" style="margin-top:1.5rem;">← Voltar ao site</RouterLink>
    </div>
  </div>

  <!-- ── Workspace válido ───────────────────────────────── -->
  <div v-else class="ws-page">

    <!-- Header -->
    <header class="ws-header">
      <RouterLink to="/" class="ws-brand">
        <img src="/logo_caesi.png" alt="CAESI" class="ws-brand-logo" />
        <span class="ws-brand-nome">CAESI</span>
      </RouterLink>
      <div class="ws-header-right">
        <div class="ws-chip-status">
          <span class="ws-chip-dot"></span>
          Workspace ativo
        </div>
        <div class="ws-member-pill">
          <span class="ws-member-avatar">{{ iniciais }}</span>
          <span class="ws-member-nome">{{ membro.nome }}</span>
        </div>
      </div>
    </header>

    <!-- Progress bar -->
    <div class="ws-progress-track">
      <div class="ws-progress-fill" :style="{ width: progresso + '%' }"></div>
    </div>

    <!-- Hero / summary -->
    <div class="ws-hero">
      <div class="ws-hero-inner">
        <div class="ws-hero-text">
          <h1 class="ws-hero-title">
            Olá, <span>{{ primeiroNome }}</span>
          </h1>
          <p class="ws-hero-sub">
            <template v-if="minhasTasks.length === 0">Nenhuma task alocada ainda.</template>
            <template v-else-if="concluidas === minhasTasks.length">Todas as tasks concluídas!</template>
            <template v-else>{{ concluidas }} de {{ minhasTasks.length }} tasks concluídas · {{ progresso }}%</template>
          </p>
        </div>
        <div class="ws-hero-stats">
          <div class="ws-stat">
            <span class="ws-stat-n">{{ minhasTasks.length }}</span>
            <span class="ws-stat-l">Total</span>
          </div>
          <div class="ws-stat ws-stat--pendente">
            <span class="ws-stat-n">{{ contagem.pendente }}</span>
            <span class="ws-stat-l">Pendentes</span>
          </div>
          <div class="ws-stat ws-stat--andamento">
            <span class="ws-stat-n">{{ contagem['em-andamento'] }}</span>
            <span class="ws-stat-l">Em andamento</span>
          </div>
          <div class="ws-stat ws-stat--concluida">
            <span class="ws-stat-n">{{ concluidas }}</span>
            <span class="ws-stat-l">Concluídas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tasks -->
    <main class="ws-main">

      <!-- Empty -->
      <div v-if="minhasTasks.length === 0" class="ws-empty">
        <div class="ws-empty-icon" v-html="clipboardIcon"></div>
        <p class="ws-empty-title">Sem tasks alocadas</p>
        <p class="ws-empty-desc">O administrador irá alocar tasks para você em breve.</p>
      </div>

      <!-- Grid -->
      <div v-else class="ws-grid">
        <div
          v-for="t in minhasTasks"
          :key="t.id"
          class="ws-card"
          :class="['prio-' + t.prioridade, t.status === 'concluida' ? 'ws-card--done' : '']"
        >
          <!-- Top badges -->
          <div class="ws-card-top">
            <span class="ws-badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
            <span class="ws-badge-cat"  :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
            <span class="ws-badge-status" :class="t.status" style="margin-left:auto;">{{ labelStatus[t.status] }}</span>
          </div>

          <!-- Body -->
          <div class="ws-card-body">
            <h3 class="ws-card-titulo">{{ t.titulo }}</h3>
            <p v-if="t.descricao" class="ws-card-desc">{{ t.descricao }}</p>
          </div>

          <!-- Prazo -->
          <div class="ws-card-prazo" :class="prazoAlerta(t.prazo) ?? ''">
            <span class="ws-prazo-icon" v-html="prazoAlerta(t.prazo) === 'vencida' ? warningIcon : prazoAlerta(t.prazo) === 'proxima' ? zapIcon : calendarIcon"></span>
            <span>
              {{ prazoAlerta(t.prazo) === 'vencida' ? 'Vencida em ' : '' }}
              {{ prazoFormatado(t.prazo) }}
              <template v-if="t.status !== 'concluida' && diasRestantes(t.prazo) >= 0">
                · {{ diasRestantes(t.prazo) === 0 ? 'hoje' : diasRestantes(t.prazo) + 'd restantes' }}
              </template>
            </span>
          </div>

          <!-- Status select -->
          <div class="ws-card-actions">
            <select
              class="ws-status-select"
              :value="t.status"
              @change="atualizarStatus(t.id, $event.target.value)"
            >
              <option value="pendente">Pendente</option>
              <option value="em-andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>

          <!-- Anotação -->
          <div class="ws-nota">
            <div class="ws-nota-header">
              <span class="ws-nota-label"><span class="ws-nota-label-icon" v-html="pencilIcon"></span>Sua nota</span>
              <button
                v-if="!estaEditandoNota(t.id)"
                class="ws-nota-edit-btn"
                @click="editarNota(t.id)"
              >{{ getAnotacao(t.id) ? 'Editar' : 'Adicionar' }}</button>
            </div>

            <!-- Preview -->
            <template v-if="!estaEditandoNota(t.id)">
              <p v-if="getAnotacao(t.id)" class="ws-nota-preview" @click="editarNota(t.id)">
                {{ getAnotacao(t.id) }}
              </p>
              <p v-else class="ws-nota-vazia">Nenhuma nota adicionada.</p>
            </template>

            <!-- Editor -->
            <template v-else>
              <textarea
                v-model="notasEdit[t.id]"
                class="ws-nota-textarea"
                rows="3"
                placeholder="Escreva um comentário, observação ou atualização…"
                autofocus
              ></textarea>
              <div class="ws-nota-btns">
                <button class="ws-btn-salvar" @click="salvarNota(t.id)">Salvar nota</button>
                <button class="ws-btn-cancel" @click="cancelarNota(t.id)">Cancelar</button>
              </div>
            </template>
          </div>
        </div>
      </div>
      <!-- Tasks disponíveis para seleção -->
      <div v-if="tasksDisponiveis.length" class="ws-disponiveis">
        <div class="ws-disp-header">
          <h2 class="ws-disp-title">Tasks disponíveis</h2>
          <p class="ws-disp-sub">O administrador abriu essas tasks para seleção — clique em "Pegar task" para adicioná-la ao seu workspace.</p>
        </div>
        <div class="ws-disp-grid">
          <div v-for="t in tasksDisponiveis" :key="t.id" class="ws-disp-card">
            <div class="ws-card-top">
              <span class="ws-badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
              <span class="ws-badge-cat"  :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
            </div>
            <h3 class="ws-card-titulo">{{ t.titulo }}</h3>
            <p v-if="t.descricao" class="ws-card-desc">{{ t.descricao }}</p>
            <div class="ws-card-prazo" :class="prazoAlerta(t.prazo) ?? ''">
              <span class="ws-prazo-icon" v-html="calendarIcon"></span>
              <span>Prazo: {{ prazoFormatado(t.prazo) }}</span>
            </div>
            <button class="ws-btn-pegar" @click="pegarTask(t.id)">
              + Pegar task
            </button>
          </div>
        </div>
      </div>
    </main>

    <footer class="ws-footer">
      <RouterLink to="/" class="ws-footer-link">← Voltar ao site do CAESI</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
/* ── Inválido ────────────────────────────────────────────── */
.ws-invalido-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.ws-inv-content {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  box-shadow: 6px 6px 0 var(--roxo-escuro);
  padding: 3rem 2.5rem;
  max-width: 420px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.ws-inv-logo img { width: 52px; height: 52px; object-fit: contain; }
.ws-inv-icon { display: flex; align-items: center; justify-content: center; margin: 0.5rem 0; color: var(--roxo-escuro); }
.ws-inv-icon svg { width: 40px; height: 40px; }
.ws-inv-title { font-family: 'Archivo Black', sans-serif; font-size: 1.3rem; color: var(--roxo-escuro); margin: 0; }
.ws-inv-desc  { font-size: 0.9rem; color: var(--cinza); margin: 0; line-height: 1.5; }

/* ── Page ────────────────────────────────────────────────── */
.ws-page { min-height: 100vh; display: flex; flex-direction: column; }

/* ── Header ──────────────────────────────────────────────── */
.ws-header {
  background: #3B2F88;
  padding: 0 2rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.ws-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.ws-brand-logo { width: 32px; height: 32px; object-fit: contain; }
.ws-brand-nome {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1rem;
  color: #F2E6C4;
  letter-spacing: 0.06em;
}

.ws-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ws-chip-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(242,230,196,0.55);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ws-chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4EAA77;
  box-shadow: 0 0 5px #4EAA77;
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ws-member-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 999px;
  padding: 4px 12px 4px 4px;
}
.ws-member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--amarelo);
  color: var(--preto);
  font-size: 0.62rem;
  font-weight: 800;
  font-family: 'Archivo Black', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ws-member-nome {
  font-size: 0.82rem;
  font-weight: 600;
  color: #F2E6C4;
}

/* ── Progress bar ────────────────────────────────────────── */
.ws-progress-track {
  height: 4px;
  background: rgba(0,0,0,0.25);
  flex-shrink: 0;
}
.ws-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--amarelo), #4EAA77);
  transition: width 0.6s ease;
  min-width: 0;
}

/* ── Hero ────────────────────────────────────────────────── */
.ws-hero {
  background: rgba(0,0,0,0.18);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 1.5rem 2rem;
  flex-shrink: 0;
}
.ws-hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.ws-hero-title {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.6rem;
  color: var(--creme);
  margin-bottom: 0.25rem;
}
.ws-hero-title span { color: var(--amarelo); }
.ws-hero-sub { font-size: 0.85rem; color: rgba(242,230,196,0.6); }

.ws-hero-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.ws-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  min-width: 72px;
}
.ws-stat-n {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--creme);
}
.ws-stat-l {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(242,230,196,0.5);
}
.ws-stat--pendente  .ws-stat-n { color: rgba(242,230,196,0.55); }
.ws-stat--andamento .ws-stat-n { color: var(--amarelo); }
.ws-stat--concluida .ws-stat-n { color: #4EAA77; }

/* ── Main ────────────────────────────────────────────────── */
.ws-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* ── Empty ───────────────────────────────────────────────── */
.ws-empty {
  text-align: center;
  padding: 5rem 2rem;
}
.ws-empty-icon { display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
.ws-empty-icon svg { width: 48px; height: 48px; color: rgba(242,230,196,0.3); }
.ws-empty-title { font-family: 'Archivo Black', sans-serif; font-size: 1.1rem; color: var(--creme); margin-bottom: 0.5rem; }
.ws-empty-desc  { font-size: 0.88rem; color: rgba(242,230,196,0.5); }

/* ── Grid ────────────────────────────────────────────────── */
.ws-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.2rem;
}

/* ── Card ────────────────────────────────────────────────── */
.ws-card {
  background: var(--creme);
  border-radius: 2px;
  border: 2px solid var(--creme-escuro);
  border-left: 4px solid var(--cinza);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem;
  transition: box-shadow 0.15s, transform 0.15s;
}
.ws-card:hover {
  box-shadow: 6px 6px 0 rgba(0,0,0,0.35);
  transform: translate(-1px, -1px);
}
.ws-card.ws-card--done { opacity: 0.72; }

/* Border color by priority */
.ws-card.prio-alta  { border-left-color: var(--vermelho); }
.ws-card.prio-media { border-left-color: var(--amarelo); }
.ws-card.prio-baixa { border-left-color: var(--verde); }

/* ── Badges ──────────────────────────────────────────────── */
.ws-card-top { display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; }

.ws-badge-prio, .ws-badge-cat, .ws-badge-status {
  font-size: 0.64rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ws-badge-prio.alta   { background: rgba(217,85,85,0.15);   color: var(--vermelho); }
.ws-badge-prio.media  { background: rgba(245,197,66,0.2);   color: #8a6a00; }
.ws-badge-prio.baixa  { background: rgba(78,170,119,0.15);  color: #1a6640; }
.ws-badge-cat.gestao      { background: rgba(80,64,160,0.12);   color: var(--roxo-escuro); }
.ws-badge-cat.formularios { background: rgba(128,112,192,0.12); color: var(--roxo-escuro); }
.ws-badge-cat.ouvidoria   { background: rgba(200,176,120,0.25); color: #6b5200; }
.ws-badge-status.pendente      { background: rgba(136,136,170,0.15); color: var(--cinza); }
.ws-badge-status.em-andamento  { background: rgba(80,64,160,0.15);   color: var(--roxo-escuro); }
.ws-badge-status.concluida     { background: rgba(78,170,119,0.15);  color: #1a6640; }

/* ── Card body ───────────────────────────────────────────── */
.ws-card-body { flex: 1; }
.ws-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1rem;
  color: var(--preto);
  margin-bottom: 0.4rem;
  line-height: 1.3;
}
.ws-card-desc {
  font-size: 0.84rem;
  color: var(--cinza);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Prazo ───────────────────────────────────────────────── */
.ws-card-prazo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--cinza);
  font-weight: 500;
  padding: 6px 8px;
  background: var(--branco);
  border-radius: 2px;
  border: 1px solid var(--creme-escuro);
}
.ws-card-prazo.vencida { color: var(--vermelho); font-weight: 700; border-color: var(--vermelho); background: rgba(217,85,85,0.06); }
.ws-card-prazo.proxima { color: #8a6a00; font-weight: 700; border-color: var(--amarelo); background: rgba(245,197,66,0.08); }
.ws-prazo-icon { display: inline-flex; align-items: center; flex-shrink: 0; }
.ws-prazo-icon svg { width: 13px; height: 13px; }

/* ── Actions ─────────────────────────────────────────────── */
.ws-card-actions {
  border-top: 1px solid var(--creme-escuro);
  padding-top: 0.75rem;
}
.ws-status-select {
  width: 100%;
  padding: 7px 32px 7px 10px;
  font-size: 0.85rem;
  font-family: 'Archivo', sans-serif;
  color: var(--preto);
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235040A0' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.ws-status-select:focus { border-color: var(--roxo); box-shadow: 0 0 0 3px rgba(128,112,192,0.2); }

/* ── Nota ────────────────────────────────────────────────── */
.ws-nota {
  border-top: 1px dashed var(--creme-escuro);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ws-nota-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ws-nota-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--roxo-escuro);
}
.ws-nota-label-icon { display: inline-flex; align-items: center; }
.ws-nota-label-icon svg { width: 11px; height: 11px; }
.ws-nota-edit-btn {
  background: none;
  border: 1px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-family: 'Archivo', sans-serif;
  font-weight: 600;
  color: var(--roxo-escuro);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.ws-nota-edit-btn:hover { border-color: var(--roxo); background: rgba(80,64,160,0.06); }

.ws-nota-preview {
  font-size: 0.82rem;
  color: var(--preto);
  line-height: 1.5;
  cursor: pointer;
  padding: 6px 8px;
  background: rgba(80,64,160,0.05);
  border-radius: 2px;
  border: 1px solid rgba(80,64,160,0.12);
  white-space: pre-wrap;
  transition: background 0.15s;
}
.ws-nota-preview:hover { background: rgba(80,64,160,0.1); }

.ws-nota-vazia {
  font-size: 0.78rem;
  color: var(--cinza);
  font-style: italic;
}

.ws-nota-textarea {
  width: 100%;
  padding: 8px 10px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.85rem;
  color: var(--preto);
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
}
.ws-nota-textarea:focus { border-color: var(--roxo); }

.ws-nota-btns { display: flex; gap: 0.4rem; }

.ws-btn-salvar {
  flex: 1;
  padding: 6px 12px;
  background: var(--roxo-escuro);
  color: var(--creme);
  border: none;
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.78rem;
  cursor: pointer;
  transition: opacity 0.15s;
}
.ws-btn-salvar:hover { opacity: 0.88; }

.ws-btn-cancel {
  padding: 6px 12px;
  background: none;
  color: var(--cinza);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.ws-btn-cancel:hover { border-color: var(--cinza); }

/* ── Tasks disponíveis ───────────────────────────────────── */
.ws-disponiveis {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.ws-disp-header { margin-bottom: 1.2rem; }
.ws-disp-title {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  color: var(--creme);
  margin-bottom: 0.3rem;
}
.ws-disp-sub { font-size: 0.82rem; color: rgba(242,230,196,0.5); }

.ws-disp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.ws-disp-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-left: 3px solid var(--amarelo);
  border-radius: 2px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: background 0.15s;
}
.ws-disp-card:hover { background: rgba(255,255,255,0.1); }

.ws-btn-pegar {
  margin-top: auto;
  padding: 7px 14px;
  background: var(--amarelo);
  color: var(--preto);
  border: none;
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.8rem;
  cursor: pointer;
  transition: opacity 0.15s;
  align-self: flex-start;
}
.ws-btn-pegar:hover { opacity: 0.85; }

/* ── Footer ──────────────────────────────────────────────── */
.ws-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255,255,255,0.08);
  text-align: center;
}
.ws-footer-link {
  font-size: 0.82rem;
  color: rgba(242,230,196,0.4);
  text-decoration: none;
  transition: color 0.15s;
}
.ws-footer-link:hover { color: rgba(242,230,196,0.8); }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 640px) {
  .ws-header { padding: 0 1rem; }
  .ws-chip-status { display: none; }
  .ws-hero { padding: 1.2rem 1rem; }
  .ws-hero-title { font-size: 1.3rem; }
  .ws-main { padding: 1.2rem 1rem; }
  .ws-grid { grid-template-columns: 1fr; }
  .ws-hero-inner { flex-direction: column; align-items: flex-start; }
  .ws-hero-stats { gap: 0.5rem; }
  .ws-stat { min-width: 60px; padding: 8px 12px; }
  .ws-stat-n { font-size: 1.2rem; }
}
</style>

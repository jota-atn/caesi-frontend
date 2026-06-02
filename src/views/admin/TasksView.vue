<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { user } from '../../stores/auth.js'
import { usuarios } from '../../stores/usuarios.js'
import { showToast } from '../../stores/toast.js'
import { useEscapeKey } from '../../composables/useEscapeKey.js'
import {
  tasks, criarTask, editarTask, excluirTask,
  atualizarStatus, solicitarParticipacao,
  aprovarParticipacao, rejeitarParticipacao,
} from '../../stores/tasks.js'
import clipboardIcon from '../../assets/icons/clipboard.svg?raw'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/admin/painel') }

// ── Permissões ────────────────────────────────────────────
const isRootAdmin = computed(() => user.value?.email === 'admin')

const adminsDisponiveis = computed(() =>
  usuarios.value.filter(u => u.role === 'admin' && u.email !== 'admin' && u.ativo !== false)
)

function nomeAdmin(email) {
  return usuarios.value.find(u => u.email === email)?.nome ?? email
}

function iniciaisAdmin(email) {
  const nome = nomeAdmin(email)
  return nome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

// ── Filtros ───────────────────────────────────────────────
const busca      = ref('')
const filtroStatus     = ref('todas')
const filtroPrioridade = ref('todas')
const filtroCategoria  = ref('todas')

const tasksFiltradas = computed(() => {
  let lista = tasks.value
  if (filtroStatus.value !== 'todas')
    lista = lista.filter(t => t.status === filtroStatus.value)
  if (filtroPrioridade.value !== 'todas')
    lista = lista.filter(t => t.prioridade === filtroPrioridade.value)
  if (filtroCategoria.value !== 'todas')
    lista = lista.filter(t => t.categoria === filtroCategoria.value)
  if (busca.value.trim())
    lista = lista.filter(t =>
      t.titulo.toLowerCase().includes(busca.value.toLowerCase()) ||
      t.descricao.toLowerCase().includes(busca.value.toLowerCase())
    )
  return lista.slice().sort((a, b) => {
    const ord = { alta: 0, media: 1, baixa: 2 }
    return ord[a.prioridade] - ord[b.prioridade]
  })
})

const contagem = computed(() => ({
  pendente:      tasks.value.filter(t => t.status === 'pendente').length,
  'em-andamento': tasks.value.filter(t => t.status === 'em-andamento').length,
  concluida:     tasks.value.filter(t => t.status === 'concluida').length,
}))

// Solicitações pendentes para o Admin CAESI
const solicitacoesPendentes = computed(() => {
  if (!isRootAdmin.value) return []
  return tasks.value.flatMap(t =>
    t.solicitacoes.map(email => ({ task: t, email, nome: nomeAdmin(email) }))
  )
})

// ── Modal: criar / editar ─────────────────────────────────
const modalForm = ref(false)
const editandoId = ref(null)

const form = ref({
  titulo: '', descricao: '', prioridade: 'media',
  prazo: '', categoria: 'gestao', alocados: [],
})

function abrirCriar() {
  editandoId.value = null
  form.value = { titulo: '', descricao: '', prioridade: 'media', prazo: '', categoria: 'gestao', alocados: [] }
  modalForm.value = true
}

function abrirEditar(task) {
  editandoId.value = task.id
  form.value = {
    titulo:     task.titulo,
    descricao:  task.descricao,
    prioridade: task.prioridade,
    prazo:      task.prazo,
    categoria:  task.categoria,
    alocados:   [...task.alocados],
  }
  modalForm.value = true
}

function toggleAlocado(email) {
  const idx = form.value.alocados.indexOf(email)
  if (idx === -1) form.value.alocados.push(email)
  else form.value.alocados.splice(idx, 1)
}

function salvarTask() {
  if (!form.value.titulo.trim() || !form.value.prazo) return
  if (editandoId.value) {
    editarTask(editandoId.value, { ...form.value })
    showToast('Task atualizada.', 'success')
  } else {
    criarTask({ ...form.value })
    showToast('Task criada.', 'success')
  }
  modalForm.value = false
}

// ── Modal: confirmar exclusão ─────────────────────────────
const modalExcluir = ref(null)

function confirmarExcluir(task) { modalExcluir.value = task }

function excluirConfirmado() {
  excluirTask(modalExcluir.value.id)
  showToast('Task excluída.', 'info')
  modalExcluir.value = null
}

// ── Ações de participação ─────────────────────────────────
function solicitar(task) {
  solicitarParticipacao(task.id, user.value.email, user.value.nome)
  showToast('Solicitação enviada ao Admin CAESI.', 'info')
}

function aprovar(taskId, email) {
  aprovarParticipacao(taskId, email)
  showToast(`${nomeAdmin(email)} adicionado à task.`, 'success')
}

function rejeitar(taskId, email) {
  rejeitarParticipacao(taskId, email)
  showToast('Solicitação recusada.', 'info')
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
  if (!prazo) return false
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  const d = new Date(prazo + 'T00:00:00')
  const diff = (d - hoje) / 86400000
  return diff < 0 ? 'vencida' : diff <= 3 ? 'proxima' : null
}

function jaSolicitou(task) {
  return task.solicitacoes.includes(user.value?.email)
}

function estaAlocado(task) {
  return task.alocados.includes(user.value?.email)
}

function podeAlterarStatus(task) {
  return isRootAdmin.value || estaAlocado(task)
}

// ── ESC fecha modais ──────────────────────────────────────
useEscapeKey(() => {
  if (modalExcluir.value) { modalExcluir.value = null; return }
  if (modalForm.value)    { modalForm.value = false }
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:120px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <div>
          <button class="back-link" style="margin-bottom:0.5rem;" @click="voltar">← Voltar</button>
          <h2>Mural de <span>Tasks</span></h2>
        </div>
        <button v-if="isRootAdmin" class="btn btn-amarelo" @click="abrirCriar">+ Nova task</button>
      </div>

      <!-- Solicitações pendentes (Admin CAESI) -->
      <div v-if="isRootAdmin && solicitacoesPendentes.length" class="paper paper-mb solicitacoes-banner">
        <div class="label-sm" style="margin-bottom:0.8rem;">
          Solicitações de participação ({{ solicitacoesPendentes.length }})
        </div>
        <div class="solicitacoes-lista">
          <div v-for="s in solicitacoesPendentes" :key="s.email + s.task.id" class="solicitacao-item">
            <div class="solicitacao-info">
              <span class="solicitacao-nome">{{ s.nome }}</span>
              <span class="solicitacao-task">{{ s.task.titulo }}</span>
            </div>
            <div class="solicitacao-acoes">
              <button class="btn btn-sm btn-verde" @click="aprovar(s.task.id, s.email)">Aprovar</button>
              <button class="btn btn-sm btn-outline" @click="rejeitar(s.task.id, s.email)">Recusar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="tasks-stats paper-mb">
        <button class="tasks-stat-chip" :class="{ ativo: filtroStatus === 'todas' }" @click="filtroStatus = 'todas'">
          <span class="tasks-stat-num">{{ tasks.length }}</span>
          <span class="tasks-stat-label">Todas</span>
        </button>
        <button class="tasks-stat-chip pendente" :class="{ ativo: filtroStatus === 'pendente' }" @click="filtroStatus = 'pendente'">
          <span class="tasks-stat-num">{{ contagem.pendente }}</span>
          <span class="tasks-stat-label">Pendentes</span>
        </button>
        <button class="tasks-stat-chip em-andamento" :class="{ ativo: filtroStatus === 'em-andamento' }" @click="filtroStatus = 'em-andamento'">
          <span class="tasks-stat-num">{{ contagem['em-andamento'] }}</span>
          <span class="tasks-stat-label">Em andamento</span>
        </button>
        <button class="tasks-stat-chip concluida" :class="{ ativo: filtroStatus === 'concluida' }" @click="filtroStatus = 'concluida'">
          <span class="tasks-stat-num">{{ contagem.concluida }}</span>
          <span class="tasks-stat-label">Concluídas</span>
        </button>
      </div>

      <!-- Filtros -->
      <div class="tasks-filtros paper paper-mb">
        <div class="field" style="flex:1;min-width:180px;margin:0;">
          <input v-model="busca" placeholder="Buscar por título ou descrição…" />
        </div>
        <div class="field" style="margin:0;">
          <select v-model="filtroPrioridade">
            <option value="todas">Todas as prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div class="field" style="margin:0;">
          <select v-model="filtroCategoria">
            <option value="todas">Todas as categorias</option>
            <option value="gestao">Gestão</option>
            <option value="formularios">Formulários</option>
            <option value="ouvidoria">Ouvidoria</option>
          </select>
        </div>
      </div>

      <!-- Cards -->
      <div v-if="tasksFiltradas.length" class="tasks-grid">
        <div v-for="t in tasksFiltradas" :key="t.id" class="task-card" :class="'status-' + t.status">

          <!-- Topo: prioridade + categoria + prazo -->
          <div class="task-card-top">
            <span class="badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
            <span class="badge-cat" :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
          </div>

          <!-- Título + descrição -->
          <div class="task-card-body">
            <h3 class="task-titulo">{{ t.titulo }}</h3>
            <p v-if="t.descricao" class="task-descricao">{{ t.descricao }}</p>
          </div>

          <!-- Prazo + status -->
          <div class="task-card-meta">
            <span class="task-prazo" :class="prazoAlerta(t.prazo) ?? ''">
              {{ prazoAlerta(t.prazo) === 'vencida' ? '⚠ Vencida' : prazoAlerta(t.prazo) === 'proxima' ? '⚡ ' : '' }}
              Prazo: {{ prazoFormatado(t.prazo) }}
            </span>
            <span class="badge-status" :class="t.status">{{ labelStatus[t.status] }}</span>
          </div>

          <!-- Alocados -->
          <div v-if="t.alocados.length" class="task-alocados">
            <span class="task-alocados-label">Alocados:</span>
            <div class="task-avatares">
              <span v-for="email in t.alocados" :key="email" class="task-avatar" :title="nomeAdmin(email)">
                {{ iniciaisAdmin(email) }}
              </span>
            </div>
          </div>
          <div v-else class="task-sem-alocados">Nenhum admin alocado</div>

          <!-- Solicitações pendentes nessa task (Admin CAESI) -->
          <div v-if="isRootAdmin && t.solicitacoes.length" class="task-solicitacoes-inline">
            <span class="task-solicitacoes-badge">{{ t.solicitacoes.length }} solicitação{{ t.solicitacoes.length > 1 ? 'ões' : '' }} pendente{{ t.solicitacoes.length > 1 ? 's' : '' }}</span>
          </div>

          <!-- Ações -->
          <div class="task-card-acoes">
            <!-- Admin CAESI -->
            <template v-if="isRootAdmin">
              <select
                class="status-select"
                :value="t.status"
                @change="atualizarStatus(t.id, $event.target.value)"
              >
                <option value="pendente">Pendente</option>
                <option value="em-andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
              <button class="btn btn-sm btn-outline" @click="abrirEditar(t)">Editar</button>
              <button class="btn btn-sm btn-vermelho-outline" @click="confirmarExcluir(t)">Excluir</button>
            </template>

            <!-- Admin alocado (não root) -->
            <template v-else-if="estaAlocado(t)">
              <select
                class="status-select"
                :value="t.status"
                @change="atualizarStatus(t.id, $event.target.value)"
              >
                <option value="pendente">Pendente</option>
                <option value="em-andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </select>
              <span class="badge-alocado">Você está nessa task</span>
            </template>

            <!-- Admin não alocado -->
            <template v-else>
              <button v-if="!jaSolicitou(t)" class="btn btn-sm btn-outline" @click="solicitar(t)">
                Solicitar participação
              </button>
              <span v-else class="badge-solicitado">Solicitação enviada</span>
            </template>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="paper" style="text-align:center;padding:3rem 2rem;">
        <span v-html="clipboardIcon" style="display:inline-flex;width:2.5rem;height:2.5rem;color:var(--cinza);margin-bottom:1rem;"></span>
        <p style="color:var(--cinza);font-size:0.95rem;">
          {{ tasks.length === 0 ? 'Nenhuma task criada ainda.' : 'Nenhuma task encontrada com os filtros aplicados.' }}
        </p>
        <button v-if="isRootAdmin && tasks.length === 0" class="btn btn-amarelo btn-sm" style="margin-top:1.2rem;" @click="abrirCriar">
          Criar primeira task
        </button>
      </div>
    </div>

    <!-- ── Modal: Criar / Editar ─────────────────────────────── -->
    <div v-if="modalForm" class="modal-overlay" @click.self="modalForm = false">
      <div class="modal-box modal-box--lg" role="dialog" aria-modal="true" aria-labelledby="modal-task-titulo" v-focus-trap>
        <h2 class="modal-title" id="modal-task-titulo">
          {{ editandoId ? 'Editar task' : 'Nova task' }}
        </h2>

        <div class="field">
          <label>Título <span class="obrig">*</span></label>
          <input v-model="form.titulo" placeholder="Descreva a task brevemente" maxlength="80" />
        </div>

        <div class="field">
          <label>Descrição</label>
          <textarea v-model="form.descricao" rows="3" placeholder="Detalhes, contexto, links…" style="resize:vertical;min-height:80px;" />
        </div>

        <div class="modal-row">
          <div class="field" style="flex:1;">
            <label>Prioridade <span class="obrig">*</span></label>
            <select v-model="form.prioridade">
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
          <div class="field" style="flex:1;">
            <label>Categoria <span class="obrig">*</span></label>
            <select v-model="form.categoria">
              <option value="gestao">Gestão</option>
              <option value="formularios">Formulários</option>
              <option value="ouvidoria">Ouvidoria</option>
            </select>
          </div>
          <div class="field" style="flex:1;">
            <label>Prazo <span class="obrig">*</span></label>
            <input v-model="form.prazo" type="date" />
          </div>
        </div>

        <div v-if="adminsDisponiveis.length" class="field">
          <label>Admins alocados</label>
          <div class="alocados-checkboxes">
            <label v-for="a in adminsDisponiveis" :key="a.email" class="alocado-check">
              <input type="checkbox" :checked="form.alocados.includes(a.email)" @change="toggleAlocado(a.email)" />
              <span>{{ a.nome }}</span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="modalForm = false">Cancelar</button>
          <button class="btn btn-amarelo" :disabled="!form.titulo.trim() || !form.prazo" @click="salvarTask">
            {{ editandoId ? 'Salvar alterações' : 'Criar task' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal: Confirmar exclusão ─────────────────────────── -->
    <div v-if="modalExcluir" class="modal-overlay" @click.self="modalExcluir = null">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-excluir-titulo" v-focus-trap>
        <h2 class="modal-title" id="modal-excluir-titulo">Excluir task</h2>
        <p class="modal-body">
          Tem certeza que deseja excluir <strong>{{ modalExcluir.titulo }}</strong>?
          Essa ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="modalExcluir = null">Cancelar</button>
          <button class="btn btn-vermelho" @click="excluirConfirmado">Excluir</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Stats chips ─────────────────────────────────────────── */
.tasks-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.tasks-stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  min-width: 80px;
}
.tasks-stat-chip:hover,
.tasks-stat-chip.ativo { border-color: var(--roxo-escuro); background: var(--creme); }
.tasks-stat-chip.ativo { box-shadow: 2px 2px 0 var(--roxo-escuro); }
.tasks-stat-num {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--preto);
}
.tasks-stat-chip.pendente      .tasks-stat-num { color: var(--cinza); }
.tasks-stat-chip.em-andamento  .tasks-stat-num { color: var(--roxo); }
.tasks-stat-chip.concluida     .tasks-stat-num { color: var(--verde); }
.tasks-stat-label { font-size: 0.7rem; font-weight: 600; color: var(--cinza); text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Filtros ─────────────────────────────────────────────── */
.tasks-filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

/* ── Grid de cards ───────────────────────────────────────── */
.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* ── Task card ───────────────────────────────────────────── */
.task-card {
  background: var(--creme);
  border-radius: 2px;
  padding: 1.2rem;
  border: 2px solid var(--creme-escuro);
  border-left-width: 4px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.15s;
}
.task-card:hover { box-shadow: 4px 4px 0 var(--roxo-escuro); }
.task-card.status-concluida { opacity: 0.75; }

/* Left border por status */
.task-card.status-pendente     { border-left-color: var(--cinza); }
.task-card.status-em-andamento { border-left-color: var(--roxo); }
.task-card.status-concluida    { border-left-color: var(--verde); }

/* ── Badges ──────────────────────────────────────────────── */
.task-card-top {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.badge-prio, .badge-cat, .badge-status, .badge-alocado, .badge-solicitado {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 2px;
  font-family: 'Syne', sans-serif;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-prio.alta   { background: rgba(217,85,85,0.15);   color: var(--vermelho); }
.badge-prio.media  { background: rgba(245,197,66,0.2);   color: #8a6a00; }
.badge-prio.baixa  { background: rgba(78,170,119,0.15);  color: #1a6640; }

.badge-cat.gestao      { background: rgba(80,64,160,0.12); color: var(--roxo-escuro); }
.badge-cat.formularios { background: rgba(128,112,192,0.12); color: var(--roxo-escuro); }
.badge-cat.ouvidoria   { background: rgba(200,176,120,0.25); color: #6b5200; }

.badge-status.pendente      { background: rgba(136,136,170,0.15); color: var(--cinza); }
.badge-status.em-andamento  { background: rgba(128,112,192,0.15); color: var(--roxo-escuro); }
.badge-status.concluida     { background: rgba(78,170,119,0.15);  color: #1a6640; }

.badge-alocado   { font-size: 0.75rem; color: var(--verde); font-weight: 600; align-self: center; }
.badge-solicitado { background: rgba(128,112,192,0.12); color: var(--cinza); }

/* ── Conteúdo do card ────────────────────────────────────── */
.task-card-body { flex: 1; }
.task-titulo {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--preto);
  margin-bottom: 0.35rem;
  line-height: 1.3;
}
.task-descricao {
  font-size: 0.84rem;
  color: var(--cinza);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.task-prazo {
  font-size: 0.78rem;
  color: var(--cinza);
  font-weight: 500;
}
.task-prazo.vencida { color: var(--vermelho); font-weight: 700; }
.task-prazo.proxima { color: #8a6a00; font-weight: 700; }

/* ── Alocados ────────────────────────────────────────────── */
.task-alocados { display: flex; align-items: center; gap: 0.5rem; }
.task-alocados-label { font-size: 0.75rem; color: var(--cinza); font-weight: 600; }
.task-avatares { display: flex; gap: 4px; flex-wrap: wrap; }
.task-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--roxo-escuro);
  color: var(--creme);
  font-size: 0.6rem;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task-sem-alocados { font-size: 0.78rem; color: var(--cinza); font-style: italic; }

/* ── Solicitações inline ─────────────────────────────────── */
.task-solicitacoes-badge {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(245,197,66,0.25);
  color: #8a6a00;
  padding: 2px 8px;
  border-radius: 2px;
  font-family: 'Syne', sans-serif;
}

/* ── Ações do card ───────────────────────────────────────── */
.task-card-acoes {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--creme-escuro);
}
.status-select {
  flex: 1;
  min-width: 130px;
  padding: 5px 32px 5px 8px;
  font-size: 0.82rem;
  font-family: 'Inter', sans-serif;
  color: var(--preto);
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235040A0' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.status-select:focus { border-color: var(--roxo); box-shadow: 0 0 0 3px rgba(128,112,192,0.2); }

/* ── Solicitações banner ─────────────────────────────────── */
.solicitacoes-banner { border-left: 4px solid var(--amarelo); }
.solicitacoes-lista { display: flex; flex-direction: column; gap: 0.5rem; }
.solicitacao-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--creme-escuro);
}
.solicitacao-item:last-child { border-bottom: none; }
.solicitacao-info { display: flex; flex-direction: column; gap: 2px; }
.solicitacao-nome { font-size: 0.88rem; font-weight: 700; color: var(--preto); }
.solicitacao-task { font-size: 0.8rem; color: var(--cinza); }
.solicitacao-acoes { display: flex; gap: 0.4rem; }

/* ── Modal form ──────────────────────────────────────────── */
.modal-box--lg { max-width: 620px; }
.modal-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.modal-row .field { margin-bottom: 0; }
.obrig { color: var(--vermelho); }

.alocados-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.4rem;
}
.alocado-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.12s;
}
.alocado-check:has(input:checked) { border-color: var(--roxo-escuro); background: rgba(80,64,160,0.06); }
.alocado-check input { width: 14px; height: 14px; accent-color: var(--roxo-escuro); }

/* ── Botões extras ───────────────────────────────────────── */
.btn-verde          { background: var(--verde); color: #fff; border-color: var(--verde); }
.btn-verde:hover    { opacity: 0.88; }
.btn-vermelho       { background: var(--vermelho); color: #fff; border: 2px solid var(--vermelho); }
.btn-vermelho:hover { opacity: 0.88; }
.btn-vermelho-outline        { background: none; color: var(--vermelho); border: 2px solid var(--vermelho); }
.btn-vermelho-outline:hover  { background: rgba(217,85,85,0.08); }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .tasks-grid { grid-template-columns: 1fr; }
  .modal-row  { flex-direction: column; }
  .tasks-stats { gap: 0.4rem; }
  .tasks-stat-chip { min-width: 60px; padding: 8px 10px; }
  .tasks-stat-num { font-size: 1.2rem; }
}
</style>

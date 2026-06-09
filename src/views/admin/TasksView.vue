<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { showToast } from '../../stores/toast.js'
import { useEscapeKey } from '../../composables/useEscapeKey.js'
import {
  tasks, criarTask, editarTask, excluirTask, atualizarStatus,
  membros, addMembro, removeMembro,
} from '../../stores/tasks.js'
import clipboardIcon from '../../assets/icons/clipboard.svg?raw'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/admin/painel') }

// ── Membros ───────────────────────────────────────────────
const adicionandoMembro = ref(false)
const novoMembroNome    = ref('')
const confirmarRmMembro = ref(null)

function nomeMembro(id) {
  return membros.value.find(m => m.id === id)?.nome ?? '?'
}

function iniciaisNome(nome) {
  return nome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function adicionarMembro() {
  if (!novoMembroNome.value.trim()) return
  addMembro(novoMembroNome.value)
  novoMembroNome.value = ''
  adicionandoMembro.value = false
  showToast('Membro adicionado.', 'success')
}

function confirmarRemover(m) {
  confirmarRmMembro.value = m
}

function removerConfirmado() {
  removeMembro(confirmarRmMembro.value.id)
  showToast(`${confirmarRmMembro.value.nome} removido.`, 'info')
  confirmarRmMembro.value = null
}

async function copiarLink(token) {
  const url = `${window.location.origin}/workspace/${token}`
  try {
    await navigator.clipboard.writeText(url)
    showToast('Link copiado!', 'success')
  } catch {
    showToast(url, 'info')
  }
}

// ── Filtros ───────────────────────────────────────────────
const busca            = ref('')
const filtroStatus     = ref('todas')
const filtroPrioridade = ref('todas')
const filtroCategoria  = ref('todas')
const ordenacao        = ref('prioridade')

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
    if (ordenacao.value === 'prazo') return new Date(a.prazo) - new Date(b.prazo)
    const ord = { alta: 0, media: 1, baixa: 2 }
    return ord[a.prioridade] - ord[b.prioridade]
  })
})

const contagem = computed(() => ({
  pendente:       tasks.value.filter(t => t.status === 'pendente').length,
  'em-andamento': tasks.value.filter(t => t.status === 'em-andamento').length,
  concluida:      tasks.value.filter(t => t.status === 'concluida').length,
}))

// ── Modal: criar / editar ─────────────────────────────────
const modalForm  = ref(false)
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
    titulo:    task.titulo,
    descricao: task.descricao,
    prioridade: task.prioridade,
    prazo:     task.prazo,
    categoria: task.categoria,
    alocados:  [...task.alocados],
  }
  modalForm.value = true
}

function toggleAlocado(id) {
  const idx = form.value.alocados.indexOf(id)
  if (idx === -1) form.value.alocados.push(id)
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

// ── ESC fecha modais ──────────────────────────────────────
useEscapeKey(() => {
  if (confirmarRmMembro.value) { confirmarRmMembro.value = null; return }
  if (modalExcluir.value)      { modalExcluir.value = null; return }
  if (modalForm.value)         { modalForm.value = false; return }
  if (adicionandoMembro.value) { adicionandoMembro.value = false; novoMembroNome.value = '' }
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
        <button class="btn btn-amarelo" @click="abrirCriar">+ Nova task</button>
      </div>

      <!-- ── Membros do workspace ────────────────────────────── -->
      <div class="membros-section paper paper-mb">
        <div class="membros-header">
          <span class="label-sm">Membros do workspace ({{ membros.length }})</span>
          <button
            v-if="!adicionandoMembro"
            class="btn btn-sm btn-outline"
            @click="adicionandoMembro = true"
          >+ Adicionar</button>
        </div>

        <div v-if="adicionandoMembro" class="membro-add-form">
          <input
            v-model="novoMembroNome"
            class="membro-add-input"
            placeholder="Nome do membro"
            maxlength="60"
            autofocus
            @keydown.enter="adicionarMembro"
            @keydown.esc="adicionandoMembro = false; novoMembroNome = ''"
          />
          <button
            class="btn btn-sm btn-amarelo"
            :disabled="!novoMembroNome.trim()"
            @click="adicionarMembro"
          >Adicionar</button>
          <button
            class="btn btn-sm btn-outline"
            @click="adicionandoMembro = false; novoMembroNome = ''"
          >Cancelar</button>
        </div>

        <div v-if="membros.length" class="membros-lista">
          <div v-for="m in membros" :key="m.id" class="membro-item">
            <span class="membro-avatar">{{ iniciaisNome(m.nome) }}</span>
            <span class="membro-nome">{{ m.nome }}</span>
            <div class="membro-acoes">
              <button class="btn btn-sm btn-outline" @click="copiarLink(m.token)">Copiar link</button>
              <button class="btn btn-sm btn-vermelho-outline" @click="confirmarRemover(m)">Remover</button>
            </div>
          </div>
        </div>
        <p v-else-if="!adicionandoMembro" class="membro-empty">
          Nenhum membro adicionado ainda.
        </p>
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
        <button
          class="btn btn-outline btn-sm sort-btn"
          @click="ordenacao = ordenacao === 'prioridade' ? 'prazo' : 'prioridade'"
        >
          {{ ordenacao === 'prioridade' ? '↕ Prioridade' : '↕ Prazo' }}
        </button>
      </div>

      <!-- Cards -->
      <div v-if="tasksFiltradas.length" class="tasks-grid">
        <div v-for="t in tasksFiltradas" :key="t.id" class="task-card" :class="'status-' + t.status">

          <div class="task-card-top">
            <span class="badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
            <span class="badge-cat" :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
          </div>

          <div class="task-card-body">
            <h3 class="task-titulo">{{ t.titulo }}</h3>
            <p v-if="t.descricao" class="task-descricao">{{ t.descricao }}</p>
          </div>

          <div class="task-card-meta">
            <span class="task-prazo" :class="prazoAlerta(t.prazo) ?? ''">
              {{ prazoAlerta(t.prazo) === 'vencida' ? '⚠ Vencida' : prazoAlerta(t.prazo) === 'proxima' ? '⚡ ' : '' }}
              Prazo: {{ prazoFormatado(t.prazo) }}
            </span>
            <span class="badge-status" :class="t.status">{{ labelStatus[t.status] }}</span>
          </div>

          <div v-if="t.alocados.length" class="task-alocados">
            <span class="task-alocados-label">Alocados:</span>
            <div class="task-avatares">
              <span
                v-for="id in t.alocados" :key="id"
                class="task-avatar"
                :title="nomeMembro(id)"
              >{{ iniciaisNome(nomeMembro(id)) }}</span>
            </div>
          </div>
          <div v-else class="task-sem-alocados">Nenhum membro alocado</div>

          <div class="task-card-acoes">
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
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="paper" style="text-align:center;padding:3rem 2rem;">
        <span v-html="clipboardIcon" style="display:inline-flex;width:2.5rem;height:2.5rem;color:var(--cinza);margin-bottom:1rem;"></span>
        <p style="color:var(--cinza);font-size:0.95rem;">
          {{ tasks.length === 0 ? 'Nenhuma task criada ainda.' : 'Nenhuma task encontrada com os filtros aplicados.' }}
        </p>
        <button v-if="tasks.length === 0" class="btn btn-amarelo btn-sm" style="margin-top:1.2rem;" @click="abrirCriar">
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

        <div class="field">
          <label>Membros alocados</label>
          <div v-if="membros.length" class="alocados-chips">
            <button
              v-for="m in membros" :key="m.id"
              type="button"
              class="alocado-chip"
              :class="{ 'alocado-chip--ativo': form.alocados.includes(m.id) }"
              @click="toggleAlocado(m.id)"
            >
              <span class="alocado-chip-avatar">{{ iniciaisNome(m.nome) }}</span>
              <span class="alocado-chip-nome">{{ m.nome }}</span>
            </button>
          </div>
          <p v-else class="field-hint">Nenhum membro adicionado ainda. Adicione membros na seção acima.</p>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="modalForm = false">Cancelar</button>
          <button class="btn btn-amarelo" :disabled="!form.titulo.trim() || !form.prazo" @click="salvarTask">
            {{ editandoId ? 'Salvar alterações' : 'Criar task' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal: Confirmar exclusão de task ─────────────────── -->
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

    <!-- ── Modal: Confirmar remoção de membro ────────────────── -->
    <div v-if="confirmarRmMembro" class="modal-overlay" @click.self="confirmarRmMembro = null">
      <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">Remover membro</h2>
        <p class="modal-body">
          Deseja remover <strong>{{ confirmarRmMembro.nome }}</strong>?
          O link de acesso será invalidado e as tasks alocadas a ele serão desalocadas.
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="confirmarRmMembro = null">Cancelar</button>
          <button class="btn btn-vermelho" @click="removerConfirmado">Remover</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Membros ─────────────────────────────────────────────── */
.membros-section { display: flex; flex-direction: column; gap: 1rem; }

.membros-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.membro-add-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.membro-add-input {
  flex: 1;
  min-width: 180px;
  padding: 7px 10px;
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.9rem;
  background: var(--branco);
  color: var(--preto);
  outline: none;
  transition: border-color 0.2s;
}
.membro-add-input:focus { border-color: var(--roxo); }

.membros-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.membro-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--branco);
  border: 1px solid var(--creme-escuro);
  border-radius: 2px;
  flex-wrap: wrap;
}

.membro-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--roxo-escuro);
  color: var(--creme);
  font-size: 0.65rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.membro-nome {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--preto);
}

.membro-acoes { display: flex; gap: 0.4rem; margin-left: auto; }

.membro-empty { font-size: 0.85rem; color: var(--cinza); font-style: italic; margin: 0; }

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
  font-family: 'Archivo Black', sans-serif;
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
.sort-btn { align-self: stretch; white-space: nowrap; }

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
.task-card.status-pendente     { border-left-color: var(--cinza); }
.task-card.status-em-andamento { border-left-color: var(--roxo); }
.task-card.status-concluida    { border-left-color: var(--verde); }

/* ── Badges ──────────────────────────────────────────────── */
.task-card-top { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.badge-prio, .badge-cat, .badge-status {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badge-prio.alta   { background: rgba(217,85,85,0.15);   color: var(--vermelho); }
.badge-prio.media  { background: rgba(245,197,66,0.2);   color: #8a6a00; }
.badge-prio.baixa  { background: rgba(78,170,119,0.15);  color: #1a6640; }

.badge-cat.gestao      { background: rgba(80,64,160,0.12);   color: var(--roxo-escuro); }
.badge-cat.formularios { background: rgba(128,112,192,0.12); color: var(--roxo-escuro); }
.badge-cat.ouvidoria   { background: rgba(200,176,120,0.25); color: #6b5200; }

.badge-status.pendente      { background: rgba(136,136,170,0.15); color: var(--cinza); }
.badge-status.em-andamento  { background: rgba(128,112,192,0.15); color: var(--roxo-escuro); }
.badge-status.concluida     { background: rgba(78,170,119,0.15);  color: #1a6640; }

/* ── Conteúdo do card ────────────────────────────────────── */
.task-card-body { flex: 1; }
.task-titulo {
  font-family: 'Archivo Black', sans-serif;
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
.task-prazo { font-size: 0.78rem; color: var(--cinza); font-weight: 500; }
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
  font-family: 'Archivo Black', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
}
.task-sem-alocados { font-size: 0.78rem; color: var(--cinza); font-style: italic; }

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
  font-family: 'Archivo', sans-serif;
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

/* ── Modal form ──────────────────────────────────────────── */
.modal-box--lg { max-width: 620px; padding-bottom: 2.5rem; }
.modal-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
.modal-row .field { margin-bottom: 0; }
.obrig { color: var(--vermelho); }

.alocados-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.alocado-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  font-family: 'Archivo', sans-serif;
}
.alocado-chip:hover { border-color: var(--roxo); }
.alocado-chip--ativo { background: var(--roxo-escuro); border-color: var(--roxo-escuro); }
.alocado-chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--creme-escuro);
  color: var(--roxo-escuro);
  font-size: 0.6rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.alocado-chip--ativo .alocado-chip-avatar { background: rgba(255,255,255,0.2); color: var(--creme); }
.alocado-chip-nome { font-size: 0.85rem; font-weight: 600; color: var(--preto); transition: color 0.15s; }
.alocado-chip--ativo .alocado-chip-nome { color: var(--creme); }

/* ── Botões extras ───────────────────────────────────────── */
.btn-vermelho        { background: var(--vermelho); color: #fff; border: 2px solid var(--vermelho); }
.btn-vermelho:hover  { opacity: 0.88; }
.btn-vermelho-outline       { background: none; color: var(--vermelho); border: 2px solid var(--vermelho); }
.btn-vermelho-outline:hover { background: rgba(217,85,85,0.08); }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .tasks-grid { grid-template-columns: 1fr; }
  .modal-row  { flex-direction: column; }
  .tasks-stats { gap: 0.4rem; }
  .tasks-stat-chip { min-width: 60px; padding: 8px 10px; }
  .tasks-stat-num { font-size: 1.2rem; }
  .membro-item { gap: 0.5rem; }
  .membro-acoes { width: 100%; }
}
</style>

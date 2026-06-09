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

function confirmarRemover(m) { confirmarRmMembro.value = m }

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
const filtroPrioridade = ref('todas')
const filtroCategoria  = ref('todas')
const filtroMembro     = ref('')

const tasksFiltradas = computed(() => {
  let lista = tasks.value
  if (filtroMembro.value)
    lista = lista.filter(t => t.alocados.includes(filtroMembro.value))
  if (filtroPrioridade.value !== 'todas')
    lista = lista.filter(t => t.prioridade === filtroPrioridade.value)
  if (filtroCategoria.value !== 'todas')
    lista = lista.filter(t => t.categoria === filtroCategoria.value)
  if (busca.value.trim()) {
    const q = busca.value.toLowerCase()
    lista = lista.filter(t =>
      t.titulo.toLowerCase().includes(q) || t.descricao.toLowerCase().includes(q)
    )
  }
  return lista
})

function sortTasks(lista) {
  return lista.slice().sort((a, b) => {
    const ord = { alta: 0, media: 1, baixa: 2 }
    return ord[a.prioridade] - ord[b.prioridade]
  })
}

const kanbanCols = computed(() => ({
  pendente:       sortTasks(tasksFiltradas.value.filter(t => t.status === 'pendente')),
  'em-andamento': sortTasks(tasksFiltradas.value.filter(t => t.status === 'em-andamento')),
  concluida:      sortTasks(tasksFiltradas.value.filter(t => t.status === 'concluida')),
}))

const contagem = computed(() => ({
  total:          tasks.value.length,
  pendente:       tasks.value.filter(t => t.status === 'pendente').length,
  'em-andamento': tasks.value.filter(t => t.status === 'em-andamento').length,
  concluida:      tasks.value.filter(t => t.status === 'concluida').length,
}))

// ── Mover status ──────────────────────────────────────────
const NEXT_STATUS = { pendente: 'em-andamento', 'em-andamento': 'concluida', concluida: 'em-andamento' }
const NEXT_LABEL  = { pendente: '→ Iniciar', 'em-andamento': '→ Concluir', concluida: '↩ Reabrir' }

function moverStatus(task) {
  atualizarStatus(task.id, NEXT_STATUS[task.status])
}

// ── Modal: criar / editar ─────────────────────────────────
const modalForm  = ref(false)
const editandoId = ref(null)

const form = ref({
  titulo: '', descricao: '', prioridade: 'media',
  prazo: '', categoria: 'gestao', alocados: [],
})

const editandoTask = computed(() =>
  editandoId.value ? tasks.value.find(t => t.id === editandoId.value) : null
)

const anotacoesDoTask = computed(() => {
  const t = editandoTask.value
  if (!t?.anotacoes) return []
  return Object.entries(t.anotacoes)
    .map(([membroId, a]) => ({ nome: nomeMembro(membroId), ...a }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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

function totalAnotacoes(task) {
  return Object.keys(task.anotacoes || {}).length
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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

    <div class="kanban-wrapper">

      <div class="page-heading">
        <div>
          <button class="back-link" style="margin-bottom:0.5rem;" @click="voltar">← Voltar</button>
          <h2>Mural de <span>Tasks</span></h2>
        </div>
        <button class="btn btn-amarelo" @click="abrirCriar">+ Nova task</button>
      </div>

      <!-- ── Membros ──────────────────────────────────────── -->
      <div class="membros-section paper paper-mb">
        <div class="membros-header">
          <span class="label-sm">Membros do workspace ({{ membros.length }})</span>
          <button v-if="!adicionandoMembro" class="btn btn-sm btn-outline" @click="adicionandoMembro = true">
            + Adicionar
          </button>
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
          <button class="btn btn-sm btn-amarelo" :disabled="!novoMembroNome.trim()" @click="adicionarMembro">
            Adicionar
          </button>
          <button class="btn btn-sm btn-outline" @click="adicionandoMembro = false; novoMembroNome = ''">
            Cancelar
          </button>
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
        <p v-else-if="!adicionandoMembro" class="membro-empty">Nenhum membro adicionado ainda.</p>
      </div>

      <!-- ── Toolbar ──────────────────────────────────────── -->
      <div class="kanban-toolbar paper paper-mb">
        <div class="field" style="flex:1;min-width:160px;margin:0;">
          <input v-model="busca" placeholder="Buscar tasks…" />
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
        <div class="field" style="margin:0;">
          <select v-model="filtroMembro">
            <option value="">Todos os membros</option>
            <option v-for="m in membros" :key="m.id" :value="m.id">{{ m.nome }}</option>
          </select>
        </div>
      </div>

      <!-- ── Kanban board ───────────────────────────────────── -->
      <div class="kanban-board">

        <!-- Coluna: Pendente -->
        <div class="kanban-col">
          <div class="kanban-col-header kanban-col-header--pendente">
            <span class="kanban-col-label">Pendente</span>
            <span class="kanban-col-count">{{ contagem.pendente }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in kanbanCols.pendente" :key="t.id" class="kanban-card" :class="'prio-' + t.prioridade">
              <div class="kc-top">
                <span class="kc-badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
                <span class="kc-badge-cat"  :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
              </div>
              <h4 class="kc-titulo">{{ t.titulo }}</h4>
              <p v-if="t.descricao" class="kc-desc">{{ t.descricao }}</p>
              <div class="kc-meta">
                <span class="kc-prazo" :class="prazoAlerta(t.prazo) ?? ''">
                  {{ prazoAlerta(t.prazo) === 'vencida' ? '⚠ ' : prazoAlerta(t.prazo) === 'proxima' ? '⚡ ' : '📅 ' }}
                  {{ prazoFormatado(t.prazo) }}
                </span>
                <div v-if="t.alocados.length" class="kc-avatares">
                  <span v-for="id in t.alocados" :key="id" class="kc-avatar" :title="nomeMembro(id)">
                    {{ iniciaisNome(nomeMembro(id)) }}
                  </span>
                </div>
              </div>
              <div class="kc-actions">
                <button class="kc-btn-mover kc-btn-iniciar" @click="moverStatus(t)">{{ NEXT_LABEL[t.status] }}</button>
                <button class="kc-btn-icon" title="Editar" @click="abrirEditar(t)">✏</button>
                <button class="kc-btn-icon kc-btn-del" title="Excluir" @click="confirmarExcluir(t)">✕</button>
                <span v-if="totalAnotacoes(t)" class="kc-notas-badge" @click="abrirEditar(t)">
                  💬 {{ totalAnotacoes(t) }}
                </span>
              </div>
            </div>
            <div v-if="!kanbanCols.pendente.length" class="kc-empty">Sem tasks pendentes</div>
          </div>
        </div>

        <!-- Coluna: Em andamento -->
        <div class="kanban-col">
          <div class="kanban-col-header kanban-col-header--andamento">
            <span class="kanban-col-label">Em andamento</span>
            <span class="kanban-col-count">{{ contagem['em-andamento'] }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in kanbanCols['em-andamento']" :key="t.id" class="kanban-card" :class="'prio-' + t.prioridade">
              <div class="kc-top">
                <span class="kc-badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
                <span class="kc-badge-cat"  :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
              </div>
              <h4 class="kc-titulo">{{ t.titulo }}</h4>
              <p v-if="t.descricao" class="kc-desc">{{ t.descricao }}</p>
              <div class="kc-meta">
                <span class="kc-prazo" :class="prazoAlerta(t.prazo) ?? ''">
                  {{ prazoAlerta(t.prazo) === 'vencida' ? '⚠ ' : prazoAlerta(t.prazo) === 'proxima' ? '⚡ ' : '📅 ' }}
                  {{ prazoFormatado(t.prazo) }}
                </span>
                <div v-if="t.alocados.length" class="kc-avatares">
                  <span v-for="id in t.alocados" :key="id" class="kc-avatar" :title="nomeMembro(id)">
                    {{ iniciaisNome(nomeMembro(id)) }}
                  </span>
                </div>
              </div>
              <div class="kc-actions">
                <button class="kc-btn-mover kc-btn-concluir" @click="moverStatus(t)">{{ NEXT_LABEL[t.status] }}</button>
                <button class="kc-btn-icon" @click="atualizarStatus(t.id, 'pendente')" title="Voltar para Pendente">↩</button>
                <button class="kc-btn-icon" title="Editar" @click="abrirEditar(t)">✏</button>
                <button class="kc-btn-icon kc-btn-del" title="Excluir" @click="confirmarExcluir(t)">✕</button>
                <span v-if="totalAnotacoes(t)" class="kc-notas-badge" @click="abrirEditar(t)">
                  💬 {{ totalAnotacoes(t) }}
                </span>
              </div>
            </div>
            <div v-if="!kanbanCols['em-andamento'].length" class="kc-empty">Sem tasks em andamento</div>
          </div>
        </div>

        <!-- Coluna: Concluída -->
        <div class="kanban-col">
          <div class="kanban-col-header kanban-col-header--concluida">
            <span class="kanban-col-label">Concluída</span>
            <span class="kanban-col-count">{{ contagem.concluida }}</span>
          </div>
          <div class="kanban-cards">
            <div v-for="t in kanbanCols.concluida" :key="t.id" class="kanban-card kanban-card--done" :class="'prio-' + t.prioridade">
              <div class="kc-top">
                <span class="kc-badge-prio" :class="t.prioridade">{{ labelPrioridade[t.prioridade] }}</span>
                <span class="kc-badge-cat"  :class="t.categoria">{{ labelCategoria[t.categoria] }}</span>
              </div>
              <h4 class="kc-titulo">{{ t.titulo }}</h4>
              <p v-if="t.descricao" class="kc-desc">{{ t.descricao }}</p>
              <div class="kc-meta">
                <span class="kc-prazo" :class="prazoAlerta(t.prazo) ?? ''">
                  📅 {{ prazoFormatado(t.prazo) }}
                </span>
                <div v-if="t.alocados.length" class="kc-avatares">
                  <span v-for="id in t.alocados" :key="id" class="kc-avatar" :title="nomeMembro(id)">
                    {{ iniciaisNome(nomeMembro(id)) }}
                  </span>
                </div>
              </div>
              <div class="kc-actions">
                <button class="kc-btn-mover kc-btn-reabrir" @click="moverStatus(t)">↩ Reabrir</button>
                <button class="kc-btn-icon" title="Editar" @click="abrirEditar(t)">✏</button>
                <button class="kc-btn-icon kc-btn-del" title="Excluir" @click="confirmarExcluir(t)">✕</button>
                <span v-if="totalAnotacoes(t)" class="kc-notas-badge" @click="abrirEditar(t)">
                  💬 {{ totalAnotacoes(t) }}
                </span>
              </div>
            </div>
            <div v-if="!kanbanCols.concluida.length" class="kc-empty">Sem tasks concluídas</div>
          </div>
        </div>

      </div>

      <!-- Empty total -->
      <div v-if="tasks.length === 0" class="kanban-empty-total">
        <p>Nenhuma task criada ainda.</p>
        <button class="btn btn-amarelo btn-sm" @click="abrirCriar">Criar primeira task</button>
      </div>
    </div>

    <!-- ── Modal: Criar / Editar ──────────────────────────────── -->
    <div v-if="modalForm" class="modal-overlay" @click.self="modalForm = false">
      <div class="modal-box modal-box--lg" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">{{ editandoId ? 'Editar task' : 'Nova task' }}</h2>

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
          <p v-else class="field-hint">Nenhum membro adicionado.</p>
        </div>

        <!-- Anotações dos membros (somente ao editar) -->
        <div v-if="editandoId && anotacoesDoTask.length" class="field">
          <label class="label-sm" style="display:block;margin-bottom:0.6rem;">Notas dos membros</label>
          <div class="anotacoes-lista">
            <div v-for="a in anotacoesDoTask" :key="a.nome" class="anotacao-item">
              <div class="anotacao-header">
                <span class="anotacao-nome">{{ a.nome }}</span>
                <span class="anotacao-data">{{ formatDate(a.updatedAt) }}</span>
              </div>
              <p class="anotacao-texto">{{ a.texto }}</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" @click="modalForm = false">Cancelar</button>
          <button class="btn btn-amarelo" :disabled="!form.titulo.trim() || !form.prazo" @click="salvarTask">
            {{ editandoId ? 'Salvar' : 'Criar task' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal: Confirmar exclusão ─────────────────────────── -->
    <div v-if="modalExcluir" class="modal-overlay" @click.self="modalExcluir = null">
      <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">Excluir task</h2>
        <p class="modal-body">
          Excluir <strong>{{ modalExcluir.titulo }}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="modalExcluir = null">Cancelar</button>
          <button class="btn btn-vermelho" @click="excluirConfirmado">Excluir</button>
        </div>
      </div>
    </div>

    <!-- ── Modal: Remover membro ──────────────────────────────── -->
    <div v-if="confirmarRmMembro" class="modal-overlay" @click.self="confirmarRmMembro = null">
      <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">Remover membro</h2>
        <p class="modal-body">
          Remover <strong>{{ confirmarRmMembro.nome }}</strong>?
          O link de acesso será invalidado e suas alocações removidas.
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
.membros-header  { display: flex; align-items: center; justify-content: space-between; }

.membro-add-form { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.membro-add-input {
  flex: 1; min-width: 180px;
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

.membros-lista { display: flex; flex-direction: column; gap: 0.5rem; }

.membro-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: var(--branco);
  border: 1px solid var(--creme-escuro);
  border-radius: 2px;
  flex-wrap: wrap;
}
.membro-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--roxo-escuro); color: var(--creme);
  font-size: 0.65rem; font-weight: 700; font-family: 'Archivo Black', sans-serif;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.membro-nome { flex: 1; font-size: 0.9rem; font-weight: 600; color: var(--preto); }
.membro-acoes { display: flex; gap: 0.4rem; margin-left: auto; }
.membro-empty { font-size: 0.85rem; color: var(--cinza); font-style: italic; margin: 0; }

/* ── Toolbar ─────────────────────────────────────────────── */
.kanban-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }

/* ── Kanban wrapper ──────────────────────────────────────── */
.kanban-wrapper {
  padding: 0 1.5rem 3rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.kanban-board {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

/* ── Coluna ──────────────────────────────────────────────── */
.kanban-col {
  background: rgba(0,0,0,0.18);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
}

.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid rgba(0,0,0,0.15);
}
.kanban-col-header--pendente  { background: rgba(136,136,170,0.25); }
.kanban-col-header--andamento { background: rgba(80,64,160,0.35); }
.kanban-col-header--concluida { background: rgba(78,170,119,0.25); }

.kanban-col-label {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--creme);
}
.kanban-col-count {
  background: rgba(0,0,0,0.25);
  color: var(--creme);
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.kanban-cards {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 120px;
}

.kc-empty {
  text-align: center;
  padding: 2rem 1rem;
  font-size: 0.78rem;
  color: rgba(242,230,196,0.3);
  font-style: italic;
}

/* ── Kanban card ─────────────────────────────────────────── */
.kanban-card {
  background: var(--creme);
  border-radius: 2px;
  padding: 0.9rem;
  border-left: 3px solid var(--cinza);
  box-shadow: 2px 2px 0 rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow 0.15s, transform 0.15s;
}
.kanban-card:hover {
  box-shadow: 3px 3px 0 rgba(0,0,0,0.35);
  transform: translate(-1px, -1px);
}
.kanban-card--done { opacity: 0.7; }

.kanban-card.prio-alta  { border-left-color: var(--vermelho); }
.kanban-card.prio-media { border-left-color: var(--amarelo); }
.kanban-card.prio-baixa { border-left-color: var(--verde); }

/* ── Card content ────────────────────────────────────────── */
.kc-top { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.kc-badge-prio, .kc-badge-cat {
  font-size: 0.62rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.kc-badge-prio.alta   { background: rgba(217,85,85,0.15);   color: var(--vermelho); }
.kc-badge-prio.media  { background: rgba(245,197,66,0.2);   color: #8a6a00; }
.kc-badge-prio.baixa  { background: rgba(78,170,119,0.15);  color: #1a6640; }
.kc-badge-cat.gestao      { background: rgba(80,64,160,0.12);   color: var(--roxo-escuro); }
.kc-badge-cat.formularios { background: rgba(128,112,192,0.12); color: var(--roxo-escuro); }
.kc-badge-cat.ouvidoria   { background: rgba(200,176,120,0.25); color: #6b5200; }

.kc-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.88rem;
  color: var(--preto);
  line-height: 1.3;
}
.kc-desc {
  font-size: 0.78rem;
  color: var(--cinza);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.kc-prazo { font-size: 0.72rem; color: var(--cinza); font-weight: 500; }
.kc-prazo.vencida { color: var(--vermelho); font-weight: 700; }
.kc-prazo.proxima { color: #8a6a00; font-weight: 700; }

.kc-avatares { display: flex; gap: 3px; }
.kc-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--roxo-escuro); color: var(--creme);
  font-size: 0.55rem; font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  display: flex; align-items: center; justify-content: center;
}

/* ── Ações do card ───────────────────────────────────────── */
.kc-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--creme-escuro);
}

.kc-btn-mover {
  flex: 1;
  padding: 4px 8px;
  border: none;
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.7rem;
  cursor: pointer;
  transition: opacity 0.15s;
  min-width: 0;
}
.kc-btn-mover:hover { opacity: 0.82; }

.kc-btn-iniciar  { background: rgba(80,64,160,0.18); color: var(--roxo-escuro); }
.kc-btn-concluir { background: rgba(78,170,119,0.2);  color: #1a6640; }
.kc-btn-reabrir  { background: rgba(136,136,170,0.15); color: var(--cinza); }

.kc-btn-icon {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: none;
  border: 1px solid var(--creme-escuro);
  border-radius: 2px;
  font-size: 0.72rem;
  cursor: pointer;
  color: var(--cinza);
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.kc-btn-icon:hover { border-color: var(--roxo); color: var(--roxo-escuro); background: rgba(80,64,160,0.06); }
.kc-btn-del:hover  { border-color: var(--vermelho); color: var(--vermelho); background: rgba(217,85,85,0.06); }

.kc-notas-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--roxo-escuro);
  background: rgba(80,64,160,0.1);
  padding: 2px 7px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.kc-notas-badge:hover { background: rgba(80,64,160,0.2); }

/* ── Empty total ─────────────────────────────────────────── */
.kanban-empty-total {
  text-align: center;
  padding: 3rem;
  color: rgba(242,230,196,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-box--lg { max-width: 620px; padding-bottom: 2.5rem; }
.modal-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
.modal-row .field { margin-bottom: 0; }
.obrig { color: var(--vermelho); }

.alocados-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
.alocado-chip {
  display: flex; align-items: center; gap: 8px;
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
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--creme-escuro); color: var(--roxo-escuro);
  font-size: 0.6rem; font-weight: 700; font-family: 'Archivo Black', sans-serif;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}
.alocado-chip--ativo .alocado-chip-avatar { background: rgba(255,255,255,0.2); color: var(--creme); }
.alocado-chip-nome { font-size: 0.85rem; font-weight: 600; color: var(--preto); transition: color 0.15s; }
.alocado-chip--ativo .alocado-chip-nome { color: var(--creme); }

/* ── Anotações no modal ──────────────────────────────────── */
.anotacoes-lista { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem; }
.anotacao-item {
  background: rgba(80,64,160,0.06);
  border: 1px solid rgba(80,64,160,0.15);
  border-radius: 2px;
  padding: 0.75rem;
}
.anotacao-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.4rem; gap: 0.5rem;
}
.anotacao-nome { font-size: 0.78rem; font-weight: 700; color: var(--roxo-escuro); }
.anotacao-data { font-size: 0.7rem; color: var(--cinza); }
.anotacao-texto { font-size: 0.82rem; color: var(--preto); line-height: 1.5; white-space: pre-wrap; }

/* ── Botões ──────────────────────────────────────────────── */
.btn-vermelho        { background: var(--vermelho); color: #fff; border: 2px solid var(--vermelho); }
.btn-vermelho:hover  { opacity: 0.88; }
.btn-vermelho-outline       { background: none; color: var(--vermelho); border: 2px solid var(--vermelho); }
.btn-vermelho-outline:hover { background: rgba(217,85,85,0.08); }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 860px) {
  .kanban-board { grid-template-columns: 1fr; }
  .kanban-wrapper { padding: 0 1rem 3rem; }
  .modal-row { flex-direction: column; }
  .membro-item { gap: 0.5rem; }
  .membro-acoes { width: 100%; }
}
</style>

import { ref, computed } from 'vue'

const KEY_TASKS   = 'caesi_tasks'
const KEY_MEMBROS = 'caesi_membros'

function loadTasks()   { return JSON.parse(localStorage.getItem(KEY_TASKS)   || '[]') }
function loadMembros() { return JSON.parse(localStorage.getItem(KEY_MEMBROS) || '[]') }

const _tasks   = ref(loadTasks())
const _membros = ref(loadMembros())

function persistTasks(data) {
  localStorage.setItem(KEY_TASKS, JSON.stringify(data))
  _tasks.value = [...data]
}

function persistMembros(data) {
  localStorage.setItem(KEY_MEMBROS, JSON.stringify(data))
  _membros.value = [...data]
}

export const tasks   = computed(() => _tasks.value)
export const membros = computed(() => _membros.value)

// ── Membros ───────────────────────────────────────────────

export function addMembro(nome) {
  const membro = {
    id:    crypto.randomUUID(),
    nome:  nome.trim(),
    token: crypto.randomUUID(),
  }
  persistMembros([..._membros.value, membro])
  return membro
}

export function removeMembro(id) {
  persistMembros(_membros.value.filter(m => m.id !== id))
  persistTasks(_tasks.value.map(t => ({
    ...t,
    alocados: t.alocados.filter(a => a !== id),
  })))
}

export function getMembroByToken(token) {
  return _membros.value.find(m => m.token === token) || null
}

// ── Tasks ─────────────────────────────────────────────────

export function criarTask(dados) {
  const task = {
    id:          Date.now().toString(),
    titulo:      dados.titulo,
    descricao:   dados.descricao || '',
    prioridade:  dados.prioridade,
    prazo:       dados.prazo,
    categoria:   dados.categoria,
    status:      'pendente',
    alocados:    dados.alocados || [],
    selecionavel: dados.selecionavel || false,
    criadoEm:   new Date().toISOString(),
  }
  persistTasks([..._tasks.value, task])
  return task
}

export function editarTask(id, dados) {
  persistTasks(_tasks.value.map(t =>
    t.id === id ? { ...t, ...dados } : t
  ))
}

export function excluirTask(id) {
  persistTasks(_tasks.value.filter(t => t.id !== id))
}

export function atualizarStatus(id, status) {
  persistTasks(_tasks.value.map(t => t.id === id ? { ...t, status } : t))
}

export function autoAlocar(taskId, membroId) {
  persistTasks(_tasks.value.map(t => {
    if (t.id !== taskId || !t.selecionavel || t.alocados.includes(membroId)) return t
    return { ...t, alocados: [...t.alocados, membroId] }
  }))
}

export function salvarAnotacao(taskId, membroId, texto) {
  persistTasks(_tasks.value.map(t => {
    if (t.id !== taskId) return t
    const anotacoes = { ...(t.anotacoes || {}) }
    if (texto.trim()) {
      anotacoes[membroId] = { texto: texto.trim(), updatedAt: new Date().toISOString() }
    } else {
      delete anotacoes[membroId]
    }
    return { ...t, anotacoes }
  }))
}

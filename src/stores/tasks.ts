import { ref, computed } from 'vue'

export type PrioridadeTask = 'alta' | 'media' | 'baixa'
export type CategoriaTask = 'gestao' | 'formularios' | 'ouvidoria'
export type StatusTask = 'pendente' | 'em-andamento' | 'concluida'

export interface Anotacao {
  texto: string
  updatedAt: string
}

export interface Task {
  id: string
  titulo: string
  descricao: string
  prioridade: PrioridadeTask
  prazo: string
  categoria: CategoriaTask
  status: StatusTask
  alocados: string[]
  selecionavel: boolean
  criadoEm: string
  anotacoes?: Record<string, Anotacao>
}

export interface NovaTask {
  titulo: string
  descricao?: string
  prioridade: PrioridadeTask
  prazo: string
  categoria: CategoriaTask
  alocados?: string[]
  selecionavel?: boolean
}

export interface Membro {
  id: string
  nome: string
  token: string
}

const KEY_TASKS   = 'caesi_tasks'
const KEY_MEMBROS = 'caesi_tasks_membros'

function loadTasks(): Task[]     { return JSON.parse(localStorage.getItem(KEY_TASKS)   || '[]') }
function loadMembros(): Membro[] { return JSON.parse(localStorage.getItem(KEY_MEMBROS) || '[]') }

const _tasks   = ref<Task[]>(loadTasks())
const _membros = ref<Membro[]>(loadMembros())

function persistTasks(data: Task[]) {
  localStorage.setItem(KEY_TASKS, JSON.stringify(data))
  _tasks.value = [...data]
}

function persistMembros(data: Membro[]) {
  localStorage.setItem(KEY_MEMBROS, JSON.stringify(data))
  _membros.value = [...data]
}

export const tasks   = computed(() => _tasks.value)
export const membros = computed(() => _membros.value)

// ── Membros ───────────────────────────────────────────────

export function addMembro(nome: string): Membro {
  const membro: Membro = {
    id:    crypto.randomUUID(),
    nome:  nome.trim(),
    token: crypto.randomUUID(),
  }
  persistMembros([..._membros.value, membro])
  return membro
}

export function removeMembro(id: string) {
  persistMembros(_membros.value.filter(m => m.id !== id))
  persistTasks(_tasks.value.map(t => ({
    ...t,
    alocados: t.alocados.filter(a => a !== id),
  })))
}

export function getMembroByToken(token: string): Membro | null {
  return _membros.value.find(m => m.token === token) || null
}

// ── Tasks ─────────────────────────────────────────────────

export function criarTask(dados: NovaTask): Task {
  const task: Task = {
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

export function editarTask(id: string, dados: Partial<Task>) {
  persistTasks(_tasks.value.map(t =>
    t.id === id ? { ...t, ...dados } : t
  ))
}

export function excluirTask(id: string) {
  persistTasks(_tasks.value.filter(t => t.id !== id))
}

export function atualizarStatus(id: string, status: StatusTask) {
  persistTasks(_tasks.value.map(t => t.id === id ? { ...t, status } : t))
}

export function autoAlocar(taskId: string, membroId: string) {
  persistTasks(_tasks.value.map(t => {
    if (t.id !== taskId || !t.selecionavel || t.alocados.includes(membroId)) return t
    return { ...t, alocados: [...t.alocados, membroId] }
  }))
}

export function salvarAnotacao(taskId: string, membroId: string, texto: string) {
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

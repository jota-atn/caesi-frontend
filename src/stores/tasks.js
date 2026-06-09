import { ref, computed } from 'vue'

const KEY = 'caesi_tasks'

function load() {
  return JSON.parse(localStorage.getItem(KEY) || '[]')
}

const _tasks = ref(load())

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _tasks.value = [...data]
}

export const tasks = computed(() => _tasks.value)

export function criarTask(dados) {
  const task = {
    id: Date.now().toString(),
    titulo:    dados.titulo,
    descricao: dados.descricao || '',
    prioridade: dados.prioridade,
    prazo:     dados.prazo,
    categoria: dados.categoria,
    status:    'pendente',
    alocados:  dados.alocados || [],
    solicitacoes: [],
    criadoEm: new Date().toISOString(),
  }
  persist([..._tasks.value, task])

  return task
}

export function editarTask(id, dados) {
  let novosAlocados = []
  const updated = _tasks.value.map(t => {
    if (t.id !== id) return t
    novosAlocados = (dados.alocados || []).filter(e => !t.alocados.includes(e))
    return { ...t, ...dados }
  })
  persist(updated)

  const task = updated.find(t => t.id === id)
}

export function excluirTask(id) {
  persist(_tasks.value.filter(t => t.id !== id))
}

export function atualizarStatus(id, status) {
  persist(_tasks.value.map(t => t.id === id ? { ...t, status } : t))
}

export function solicitarParticipacao(id, adminEmail, adminNome) {
  const task = _tasks.value.find(t => t.id === id)
  if (!task) return
  if (task.solicitacoes.includes(adminEmail) || task.alocados.includes(adminEmail)) return

  persist(_tasks.value.map(t =>
    t.id === id ? { ...t, solicitacoes: [...t.solicitacoes, adminEmail] } : t
  ))

}

export function aprovarParticipacao(id, adminEmail) {
  const task = _tasks.value.find(t => t.id === id)
  if (!task) return
  persist(_tasks.value.map(t =>
    t.id === id ? {
      ...t,
      alocados:     [...t.alocados, adminEmail],
      solicitacoes: t.solicitacoes.filter(e => e !== adminEmail),
    } : t
  ))
}

export function rejeitarParticipacao(id, adminEmail) {
  const task = _tasks.value.find(t => t.id === id)
  if (!task) return
  persist(_tasks.value.map(t =>
    t.id === id ? { ...t, solicitacoes: t.solicitacoes.filter(e => e !== adminEmail) } : t
  ))
}

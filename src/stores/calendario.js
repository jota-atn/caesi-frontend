import { ref, computed } from 'vue'

const KEY = 'caesi_calendario'

const _eventos = ref(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const eventos = computed(() => _eventos.value)

function hojeLocalISO() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const proximosEventos = computed(() => {
  const hoje = hojeLocalISO()
  return _eventos.value
    .filter(e => e.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
})

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
  _eventos.value = [...list]
}

export function getEvento(id) {
  return _eventos.value.find(e => e.id === id) ?? null
}

export function addEvento({ nome, data, descricao = '', formularioId = null }) {
  const novo = { id: Date.now(), nome, data, descricao, formularioId }
  persist([..._eventos.value, novo])
  return novo
}

export function updateEvento(id, updates) {
  persist(_eventos.value.map(e => e.id === id ? { ...e, ...updates } : e))
}

export function removeEvento(id) {
  persist(_eventos.value.filter(e => e.id !== id))
}

// Sync a partir do módulo de Formulários: um formulário com dataEvento
// mantém um evento vinculado (formularioId) sempre atualizado.
export function upsertEventoFormulario(formularioId, { nome, data, descricao }) {
  const existente = _eventos.value.find(e => e.formularioId === formularioId)
  if (!data) {
    if (existente) removeEvento(existente.id)
    return
  }
  if (existente) {
    updateEvento(existente.id, { nome, data, descricao })
  } else {
    addEvento({ nome, data, descricao, formularioId })
  }
}

export function removeEventoByFormulario(formularioId) {
  const existente = _eventos.value.find(e => e.formularioId === formularioId)
  if (existente) removeEvento(existente.id)
}

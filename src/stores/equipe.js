import { ref, computed } from 'vue'

const KEY = 'caesi_equipe'

const DEFAULT = [
  { diretoria: 'Administrativa',        presidente: '' },
  { diretoria: 'Cultura e Lazer',        presidente: '' },
  { diretoria: 'Assistência Estudantil', presidente: '' },
  { diretoria: 'Financeira',             presidente: '' },
]

function load() {
  const stored = localStorage.getItem(KEY)
  if (!stored) return DEFAULT.map(d => ({ ...d }))
  return JSON.parse(stored)
}

const _equipe = ref(load())

export const equipe = computed(() => _equipe.value)

export function saveEquipe(novaEquipe) {
  localStorage.setItem(KEY, JSON.stringify(novaEquipe))
  _equipe.value = [...novaEquipe]
}

import { ref, computed } from 'vue'

export interface Estrutura {
  id: number
  nome: string
  descricao: string
  lat: number
  lng: number
  imagens: string[]
}

export interface NovaEstrutura {
  nome: string
  descricao?: string
  lat: number
  lng: number
  imagens?: string[]
}

const KEY = 'caesi_mapa'

const _estruturas = ref<Estrutura[]>(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const estruturas = computed(() => _estruturas.value)

// Coordenadas do bloco de Sistemas e Computação (UASC) na UFCG — centro padrão do mapa.
export const CENTRO_PADRAO = { lat: -7.2127895, lng: -35.907437 }

function persist(list: Estrutura[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  _estruturas.value = [...list]
}

export function getEstrutura(id: number): Estrutura | null {
  return _estruturas.value.find(e => e.id === id) ?? null
}

export function addEstrutura({ nome, descricao = '', lat, lng, imagens = [] }: NovaEstrutura): Estrutura {
  const nova: Estrutura = { id: Date.now(), nome, descricao, lat, lng, imagens }
  persist([..._estruturas.value, nova])
  return nova
}

export function updateEstrutura(id: number, updates: Partial<Estrutura>) {
  persist(_estruturas.value.map(e => e.id === id ? { ...e, ...updates } : e))
}

export function removeEstrutura(id: number) {
  persist(_estruturas.value.filter(e => e.id !== id))
}

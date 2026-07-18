import { ref, computed } from 'vue'

export interface Publicacao {
  id: number
  titulo: string
  tipo: string
  mensagem: string
  imagens: string[]
  anexos: string[]
  criadoEm: string
  editadoEm: string | null
}

export interface NovaPublicacao {
  titulo: string
  tipo: string
  mensagem: string
  imagens?: string[]
  anexos?: string[]
}

const KEY = 'caesi_mural'
const _list = ref<Publicacao[]>(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const publicacoes = computed(() => _list.value)

function persist(data: Publicacao[]) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

function dataAtual(): string {
  return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function addPublicacao({ titulo, tipo, mensagem, imagens, anexos }: NovaPublicacao): Publicacao {
  const nova: Publicacao = {
    id: Date.now(),
    titulo: titulo.trim(),
    tipo: tipo.trim(),
    mensagem: mensagem.trim(),
    imagens: imagens ?? [],
    anexos: anexos ?? [],
    criadoEm: dataAtual(),
    editadoEm: null,
  }
  persist([nova, ..._list.value])
  return nova
}

export function updatePublicacao(id: number, data: Partial<Publicacao>) {
  persist(_list.value.map(p =>
    p.id === id ? { ...p, ...data, editadoEm: dataAtual() } : p
  ))
}

export function deletePublicacao(id: number) {
  persist(_list.value.filter(p => p.id !== id))
}

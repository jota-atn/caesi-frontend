import { ref, computed } from 'vue'

const KEY = 'caesi_mural'
const _list = ref(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const publicacoes = computed(() => _list.value)

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

function dataAtual() {
  return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function addPublicacao({ titulo, tipo, mensagem, imagens, anexos }) {
  const nova = {
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

export function updatePublicacao(id, data) {
  persist(_list.value.map(p =>
    p.id === id ? { ...p, ...data, editadoEm: dataAtual() } : p
  ))
}

export function deletePublicacao(id) {
  persist(_list.value.filter(p => p.id !== id))
}

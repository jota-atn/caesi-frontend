import { ref, computed } from 'vue'

const KEY = 'caesi_mensagens'

const _list = ref(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const mensagens = computed(() => _list.value)

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

export function addMensagem(msg) {
  const id = Date.now()
  const ano = new Date().getFullYear()
  const nova = {
    ...msg,
    id,
    protocolo: `#${ano}-${String(id).slice(-4)}`,
    status: 'pendente',
    nota: '',
    data: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    preview: msg.corpo.slice(0, 110) + (msg.corpo.length > 110 ? '…' : ''),
  }
  persist([..._list.value, nova])
  return nova
}

export function updateStatus(id, status) {
  persist(_list.value.map(m => m.id === id ? { ...m, status } : m))
}

export function updateNota(id, nota) {
  persist(_list.value.map(m => m.id === id ? { ...m, nota } : m))
}

export function updateResposta(id, resposta) {
  persist(_list.value.map(m => m.id === id ? { ...m, resposta } : m))
}

export function deleteMensagem(id) {
  persist(_list.value.filter(m => m.id !== id))
}

export function marcarRespostaVista(id) {
  persist(_list.value.map(m => m.id === id ? { ...m, respostaVista: true } : m))
}

import { ref, computed } from 'vue'

const KEY = 'caesi_mensagens'

function load() {
  return JSON.parse(localStorage.getItem(KEY) || '[]')
}

const _list = ref(load())

export const mensagens = computed(() => _list.value)

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

export function addMensagem(msg) {
  const all = load()
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
  persist([...all, nova])
  return nova
}

export function updateStatus(id, status) {
  const all = load()
  const m = all.find(m => m.id === id)
  if (m) { m.status = status; persist(all) }
}

export function updateNota(id, nota) {
  const all = load()
  const m = all.find(m => m.id === id)
  if (m) { m.nota = nota; persist(all) }
}

export function updateResposta(id, resposta) {
  const all = load()
  const m = all.find(m => m.id === id)
  if (m) { m.resposta = resposta; persist(all) }
}

export function deleteMensagem(id) {
  persist(load().filter(m => m.id !== id))
}

export function marcarRespostaVista(id) {
  const all = load()
  const m = all.find(m => m.id === id)
  if (m) { m.respostaVista = true; persist(all) }
}

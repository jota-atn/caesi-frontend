import { ref, computed } from 'vue'

const KEY = 'caesi_usuarios'
const ADMIN_DEFAULT = { nome: 'Admin CAESI', email: 'admin', matricula: null, senha: 'admin', role: 'admin', ativo: true }

function init() {
  const stored = localStorage.getItem(KEY)
  if (!stored) {
    localStorage.setItem(KEY, JSON.stringify([ADMIN_DEFAULT]))
    return [ADMIN_DEFAULT]
  }
  const users = JSON.parse(stored)
  if (!users.find(u => u.role === 'admin')) {
    users.unshift(ADMIN_DEFAULT)
    localStorage.setItem(KEY, JSON.stringify(users))
  }
  return users
}

const _list = ref(init())
export const usuarios = computed(() => _list.value)

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

export function findUser(identificador, senha) {
  return _list.value.find(u =>
    (u.email === identificador || u.matricula === identificador) &&
    u.senha === senha &&
    u.ativo !== false
  ) ?? null
}

export function registerUser({ nome, matricula, email, senha }) {
  if (_list.value.find(u => u.email === email || (matricula && u.matricula === matricula))) {
    return { error: 'Já existe uma conta com esse e-mail ou matrícula.' }
  }
  const novo = { nome, matricula, email, senha, role: 'user', ativo: true }
  persist([..._list.value, novo])
  return { user: novo }
}

export function setUserAtivo(email, ativo) {
  persist(_list.value.map(u => u.email === email ? { ...u, ativo } : u))
}

export function updateUser(emailAtual, updates) {
  const u = _list.value.find(u => u.email === emailAtual)
  if (!u) return { error: 'Usuário não encontrado.' }
  if (u.email === 'admin' && updates.nome !== undefined) {
    return { error: 'O nome do administrador original não pode ser alterado.' }
  }
  const updated = { ...u, ...updates }
  persist(_list.value.map(u => u.email === emailAtual ? updated : u))
  return { user: updated }
}

export function createAdmin({ nome, email, senha }) {
  if (_list.value.find(u => u.email === email)) {
    return { error: 'Já existe uma conta com esse e-mail.' }
  }
  const novo = { nome, email, matricula: null, senha, role: 'admin', ativo: true }
  persist([..._list.value, novo])
  return { user: novo }
}

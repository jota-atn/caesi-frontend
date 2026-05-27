import { ref, computed } from 'vue'

const KEY = 'caesi_usuarios'
const ADMIN_DEFAULT = { nome: 'Admin CAESI', email: 'admin', matricula: null, senha: 'admin', role: 'admin', ativo: true }

function load() {
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

const _list = ref(load())
export const usuarios = computed(() => _list.value)

function persist(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
  _list.value = [...data]
}

export function findUser(identificador, senha) {
  return load().find(u =>
    (u.email === identificador || u.matricula === identificador) &&
    u.senha === senha &&
    u.ativo !== false
  ) ?? null
}

export function registerUser({ nome, matricula, email, senha }) {
  const users = load()
  if (users.find(u => u.email === email || (matricula && u.matricula === matricula))) {
    return { error: 'Já existe uma conta com esse e-mail ou matrícula.' }
  }
  const novo = { nome, matricula, email, senha, role: 'user', ativo: true }
  persist([...users, novo])
  return { user: novo }
}

export function setUserAtivo(email, ativo) {
  const users = load()
  const u = users.find(u => u.email === email)
  if (u) { u.ativo = ativo; persist(users) }
}

export function updateUser(emailAtual, updates) {
  const users = load()
  const u = users.find(u => u.email === emailAtual)
  if (!u) return { error: 'Usuário não encontrado.' }
  Object.assign(u, updates)
  persist(users)
  return { user: { ...u } }
}

export function createAdmin({ nome, email, senha }) {
  const users = load()
  if (users.find(u => u.email === email)) {
    return { error: 'Já existe uma conta com esse e-mail.' }
  }
  const novo = { nome, email, matricula: null, senha, role: 'admin', ativo: true }
  persist([...users, novo])
  return { user: novo }
}

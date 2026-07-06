import { ref, computed } from 'vue'

const MOCK_EMAIL    = 'caesi@ccc.ufcg.edu.br'
const MOCK_PASSWORD = 'caesi2025'
const KEY_SENHA       = 'caesi_admin_senha'
const KEY_MUST_CHANGE = 'caesi_admin_deve_trocar_senha'

const _admin      = ref(!!localStorage.getItem('caesi_admin'))
const _mustChange = ref(!!localStorage.getItem(KEY_MUST_CHANGE))

export const isAdmin            = computed(() => _admin.value)
export const isLoggedIn         = computed(() => _admin.value)
export const mustChangePassword = computed(() => _mustChange.value)
export const user               = computed(() => _admin.value ? { role: 'admin', nome: 'Admin', email: 'admin' } : null)

function senhaAtual() {
  return localStorage.getItem(KEY_SENHA) || MOCK_PASSWORD
}

// Mock do front: em produção quem decide "primeiro login" é o back (senha
// aleatória gerada no cadastro do admin), aqui simulamos com a senha padrão
// de fábrica ainda não ter sido trocada.
export function loginAdmin(email, senha) {
  if (email.trim().toLowerCase() !== MOCK_EMAIL || senha !== senhaAtual()) return false
  _admin.value = true
  localStorage.setItem('caesi_admin', '1')

  if (!localStorage.getItem(KEY_SENHA)) {
    _mustChange.value = true
    localStorage.setItem(KEY_MUST_CHANGE, '1')
  }
  return true
}

export function trocarSenha(novaSenha) {
  localStorage.setItem(KEY_SENHA, novaSenha)
  localStorage.removeItem(KEY_MUST_CHANGE)
  _mustChange.value = false
}

// Login via Google dispensa senha própria, então não há o que trocar.
export function loginComGoogle() {
  _admin.value = true
  localStorage.setItem('caesi_admin', '1')
}

export function logout() {
  _admin.value = false
  localStorage.removeItem('caesi_admin')
}

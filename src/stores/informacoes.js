import { ref, computed } from 'vue'

const KEY_EDITAIS      = 'caesi_editais'
const KEY_PROFESSORES  = 'caesi_professores'
const KEY_LABORATORIOS = 'caesi_laboratorios'
const KEY_TAMBURETEI   = 'caesi_tamburetei'

function hoje() { return new Date().toISOString().split('T')[0] }

// ── Editais ─────────────────────────────────────────────
const _editais = ref(JSON.parse(localStorage.getItem(KEY_EDITAIS) || '[]'))
export const editais = computed(() => _editais.value)

function persistEditais(list) {
  localStorage.setItem(KEY_EDITAIS, JSON.stringify(list))
  _editais.value = [...list]
}

export function addEdital({ titulo, descricao = '', data = null, anexo = null }) {
  const novo = { id: Date.now(), titulo, descricao, data, anexo, criadoEm: hoje() }
  persistEditais([..._editais.value, novo])
  return novo
}
export function updateEdital(id, updates) {
  persistEditais(_editais.value.map(e => e.id === id ? { ...e, ...updates } : e))
}
export function deleteEdital(id) {
  persistEditais(_editais.value.filter(e => e.id !== id))
}

// ── Professores ─────────────────────────────────────────
const _professores = ref(JSON.parse(localStorage.getItem(KEY_PROFESSORES) || '[]'))
export const professores = computed(() => _professores.value)

function persistProfessores(list) {
  localStorage.setItem(KEY_PROFESSORES, JSON.stringify(list))
  _professores.value = [...list]
}

export function addProfessor({ nome, sala = '', estruturaId = null, descricao = '', foto = '', email = '', lattes = '', googleAcademico = '', linkedin = '' }) {
  const novo = { id: Date.now(), nome, sala, estruturaId, descricao, foto, email, lattes, googleAcademico, linkedin }
  persistProfessores([..._professores.value, novo])
  return novo
}
export function updateProfessor(id, updates) {
  persistProfessores(_professores.value.map(p => p.id === id ? { ...p, ...updates } : p))
}
export function deleteProfessor(id) {
  persistProfessores(_professores.value.filter(p => p.id !== id))
}

// ── Laboratórios ────────────────────────────────────────
const _laboratorios = ref(JSON.parse(localStorage.getItem(KEY_LABORATORIOS) || '[]'))
export const laboratorios = computed(() => _laboratorios.value)

function persistLaboratorios(list) {
  localStorage.setItem(KEY_LABORATORIOS, JSON.stringify(list))
  _laboratorios.value = [...list]
}

export function addLaboratorio({ nome, sigla = '', descricao = '', imagem = null, linkExterno = '', estruturaId = null }) {
  const novo = { id: Date.now(), nome, sigla, descricao, imagem, linkExterno, estruturaId }
  persistLaboratorios([..._laboratorios.value, novo])
  return novo
}
export function updateLaboratorio(id, updates) {
  persistLaboratorios(_laboratorios.value.map(l => l.id === id ? { ...l, ...updates } : l))
}
export function deleteLaboratorio(id) {
  persistLaboratorios(_laboratorios.value.filter(l => l.id !== id))
}

// ── Tamburetei (bloco único, sem lista) ──────────────────
const TAMBURETEI_DEFAULT = {
  titulo: 'Tamburetei',
  descricao: 'O Tamburetei é uma plataforma colaborativa mantida pela OpenDev UFCG pra ajudar quem tá cursando Ciência da Computação — a ideia é "fazer de tamburete aquela cadeira de CC". Lá você encontra resumos de disciplinas, provas antigas, dicas e materiais compartilhados por outros alunos.\n\nA plataforma está parada há um tempo, mas o repositório continua de pé — e quanto mais gente contribuir, mais viva ela fica. Se você tem provas antigas, resumos ou dicas de alguma disciplina, contribuir é só um pull request de distância.',
  linkExterno: 'https://tamburetei.opendevufcg.org/',
}

const _tamburetei = ref({ ...TAMBURETEI_DEFAULT, ...JSON.parse(localStorage.getItem(KEY_TAMBURETEI) || '{}') })
export const tamburetei = computed(() => _tamburetei.value)

export function saveTamburetei(dados) {
  localStorage.setItem(KEY_TAMBURETEI, JSON.stringify(dados))
  _tamburetei.value = { ...dados }
}

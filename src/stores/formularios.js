import { ref, computed } from 'vue'
import { upsertEventoFormulario, removeEventoByFormulario } from './calendario.js'

const KEY_FORMS = 'caesi_formularios_v2'
const KEY_INSCRICOES = 'caesi_inscricoes_v2'

const _forms = ref(JSON.parse(localStorage.getItem(KEY_FORMS) || '[]'))
const _inscricoes = ref(JSON.parse(localStorage.getItem(KEY_INSCRICOES) || '[]'))

export const formularios = computed(() => _forms.value)
export const inscricoes  = computed(() => _inscricoes.value)

function persistForms(data) {
  localStorage.setItem(KEY_FORMS, JSON.stringify(data))
  _forms.value = [...data]
}

function persistInscricoes(data) {
  localStorage.setItem(KEY_INSCRICOES, JSON.stringify(data))
  _inscricoes.value = [...data]
}

export function getFormulario(id) {
  return _forms.value.find(f => f.id === id) ?? null
}

export function addFormulario(dados) {
  const novo = {
    ...dados,
    id: Date.now(),
    status: 'aberto',
    criadoEm: new Date().toISOString().split('T')[0],
  }
  persistForms([..._forms.value, novo])
  upsertEventoFormulario(novo.id, { nome: novo.titulo, data: novo.dataEvento, descricao: novo.descricao })
  return novo
}

export function updateFormulario(id, updates) {
  persistForms(_forms.value.map(f => f.id === id ? { ...f, ...updates } : f))
  const atualizado = _forms.value.find(f => f.id === id)
  if (atualizado) {
    upsertEventoFormulario(id, { nome: atualizado.titulo, data: atualizado.dataEvento, descricao: atualizado.descricao })
  }
}

export function deleteFormulario(id) {
  persistForms(_forms.value.filter(f => f.id !== id))
  persistInscricoes(_inscricoes.value.filter(i => i.formularioId !== id))
  removeEventoByFormulario(id)
}

export function getInscricoesByFormulario(formularioId) {
  return _inscricoes.value.filter(i => i.formularioId === formularioId)
}

export function addInscricao(formularioId, respostas, comprovante = null) {
  const formulario = _forms.value.find(f => f.id === formularioId)
  if (!formulario)                    return { error: 'Formulário não encontrado.' }
  if (formulario.status !== 'aberto') return { error: 'Este formulário está encerrado.' }
  if (formulario.prazoInscricao && new Date(formulario.prazoInscricao + 'T23:59:59') < new Date()) {
    return { error: 'O prazo de inscrição deste formulário já encerrou.' }
  }
  if (formulario.limiteVagas != null) {
    const inscritos = _inscricoes.value.filter(i => i.formularioId === formularioId).length
    if (inscritos >= formulario.limiteVagas) return { error: 'As vagas já foram preenchidas.' }
  }
  const email = respostas._email?.trim() || null
  if (email && _inscricoes.value.find(i => i.formularioId === formularioId && i.userEmail === email)) {
    return { error: 'Este e-mail já foi utilizado para se inscrever neste formulário.' }
  }
  const nova = {
    id: Date.now(),
    formularioId,
    userEmail: email,
    respostas,
    comprovante: comprovante ? { ...comprovante, status: 'pendente' } : null,
    criadoEm: new Date().toISOString().split('T')[0],
  }
  persistInscricoes([..._inscricoes.value, nova])
  return { inscricao: nova }
}

export function emitirCertificados(formularioId) {
  const hoje = new Date().toISOString().split('T')[0]
  persistForms(_forms.value.map(f =>
    f.id === formularioId
      ? { ...f, certificadosEmitidos: true, certificadosEmitidosEm: hoje }
      : f
  ))
  persistInscricoes(_inscricoes.value.map(i =>
    i.formularioId === formularioId ? { ...i, certificado: { emitidoEm: hoje } } : i
  ))
}

export function updateStatusComprovante(inscricaoId, status) {
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId && i.comprovante
      ? { ...i, comprovante: { ...i.comprovante, status } }
      : i
  ))
}

export function cancelarInscricaoDireta(inscricaoId) {
  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))
  return { success: true }
}

export function solicitarCancelamento(inscricaoId, motivo = '') {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)
  if (!inscricao) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId
      ? { ...i, cancelamento: { solicitado: true, motivo, solicitadoEm: new Date().toISOString() } }
      : i
  ))
  return { success: true }
}

export function aprovarCancelamento(inscricaoId) {
  if (!_inscricoes.value.find(i => i.id === inscricaoId)) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))
  return { success: true }
}

export function recusarCancelamento(inscricaoId) {
  if (!_inscricoes.value.find(i => i.id === inscricaoId)) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId ? { ...i, cancelamento: null } : i
  ))
  return { success: true }
}

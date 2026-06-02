import { ref, computed } from 'vue'
import { addNotificacao } from './notificacoes.js'
import { usuarios } from './usuarios.js'

const KEY_FORMS = 'caesi_formularios_v2'
const KEY_INSCRICOES = 'caesi_inscricoes_v2'

function initForms() {
  return JSON.parse(localStorage.getItem(KEY_FORMS) || '[]')
}

function initInscricoes() {
  return JSON.parse(localStorage.getItem(KEY_INSCRICOES) || '[]')
}

const _forms = ref(initForms())
const _inscricoes = ref(initInscricoes())

export const formularios = computed(() => _forms.value)
export const inscricoes = computed(() => _inscricoes.value)

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

  usuarios.value
    .filter(u => u.role !== 'admin' && u.ativo !== false)
    .forEach(u => addNotificacao({
      userEmail: u.email,
      tipo: 'novo-formulario',
      titulo: 'Novo evento ou formulário disponível',
      subtitulo: novo.titulo,
      link: `/aluno/formularios/${novo.id}`,
      dedupeKey: `novo-formulario-${novo.id}`,
    }))

  return novo
}

export function updateFormulario(id, updates) {
  const f = _forms.value.find(f => f.id === id)
  if (f && updates.status === 'encerrado' && f.status !== 'encerrado') {
    _inscricoes.value
      .filter(i => i.formularioId === id)
      .forEach(i => addNotificacao({
        userEmail: i.userEmail,
        tipo: 'formulario-encerrado',
        titulo: 'Um formulário foi encerrado',
        subtitulo: f.titulo,
        link: `/aluno/formularios/${id}`,
        dedupeKey: `formulario-encerrado-${id}`,
      }))
  }
  persistForms(_forms.value.map(f => f.id === id ? { ...f, ...updates } : f))
}

export function deleteFormulario(id) {
  persistForms(_forms.value.filter(f => f.id !== id))
  persistInscricoes(_inscricoes.value.filter(i => i.formularioId !== id))
}

export function getInscricoesByFormulario(formularioId) {
  return _inscricoes.value.filter(i => i.formularioId === formularioId)
}

export function getInscricoesByUser(userEmail) {
  return _inscricoes.value.filter(i => i.userEmail === userEmail)
}

export function addInscricao(formularioId, userEmail, respostas, comprovante = null) {
  const formulario = _forms.value.find(f => f.id === formularioId)
  if (!formulario) {
    return { error: 'Formulário não encontrado.' }
  }
  if (formulario.status !== 'aberto') {
    return { error: 'Este formulário está encerrado.' }
  }
  if (formulario.prazoInscricao && new Date(formulario.prazoInscricao + 'T23:59:59') < new Date()) {
    return { error: 'O prazo de inscrição deste formulário já encerrou.' }
  }
  if (formulario.limiteVagas != null) {
    const inscritos = _inscricoes.value.filter(i => i.formularioId === formularioId).length
    if (inscritos >= formulario.limiteVagas) {
      return { error: 'As vagas para este formulário já foram preenchidas.' }
    }
  }
  if (_inscricoes.value.find(i => i.formularioId === formularioId && i.userEmail === userEmail)) {
    return { error: 'Você já se inscreveu neste formulário.' }
  }
  const nova = {
    id: Date.now(),
    formularioId,
    userEmail,
    respostas,
    comprovante: comprovante ? { ...comprovante, status: 'pendente' } : null,
    criadoEm: new Date().toISOString().split('T')[0],
  }
  persistInscricoes([..._inscricoes.value, nova])
  return { inscricao: nova }
}

export function emitirCertificados(formularioId) {
  const hoje = new Date().toISOString().split('T')[0]
  const f = _forms.value.find(f => f.id === formularioId)

  persistForms(_forms.value.map(f =>
    f.id === formularioId
      ? { ...f, certificadosEmitidos: true, certificadosEmitidosEm: hoje }
      : f
  ))

  const atualizadas = _inscricoes.value.map(i =>
    i.formularioId === formularioId
      ? { ...i, certificado: { emitidoEm: hoje } }
      : i
  )
  persistInscricoes(atualizadas)

  if (f) {
    atualizadas
      .filter(i => i.formularioId === formularioId)
      .forEach(i => addNotificacao({
        userEmail: i.userEmail,
        tipo: 'certificado-emitido',
        titulo: 'Seu certificado está disponível',
        subtitulo: f.titulo,
        link: '/aluno/inscricoes',
        dedupeKey: `certificado-emitido-${formularioId}-${i.userEmail}`,
      }))
  }
}

export function updateStatusComprovante(inscricaoId, status) {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)

  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId && i.comprovante
      ? { ...i, comprovante: { ...i.comprovante, status } }
      : i
  ))

  if (status === 'validado' && inscricao) {
    const f = _forms.value.find(f => f.id === inscricao.formularioId)
    addNotificacao({
      userEmail: inscricao.userEmail,
      tipo: 'inscricao-confirmada',
      titulo: 'Inscrição confirmada!',
      subtitulo: f?.titulo ?? '',
      link: '/aluno/inscricoes',
      dedupeKey: `inscricao-confirmada-${inscricaoId}`,
    })
  }
}

export function cancelarInscricaoDireta(inscricaoId) {
  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))
  return { success: true }
}

export function solicitarCancelamento(inscricaoId, motivo = '') {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)
  if (!inscricao) return { error: 'Inscrição não encontrada.' }
  const f = _forms.value.find(f => f.id === inscricao.formularioId)
  const solicitadoEm = new Date().toISOString()

  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId
      ? { ...i, cancelamento: { solicitado: true, motivo, solicitadoEm } }
      : i
  ))

  usuarios.value
    .filter(u => u.role === 'admin')
    .forEach(u => addNotificacao({
      userEmail: u.email,
      tipo: 'cancelamento-solicitado',
      titulo: 'Solicitação de cancelamento',
      subtitulo: `${inscricao.userEmail} — "${f?.titulo ?? ''}"`,
      link: `/admin/formularios/${inscricao.formularioId}`,
      dedupeKey: `cancelamento-solicitado-${inscricaoId}-${solicitadoEm}`,
    }))

  return { success: true }
}

export function aprovarCancelamento(inscricaoId, mensagem = '') {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)
  if (!inscricao) return { error: 'Inscrição não encontrada.' }
  const f = _forms.value.find(f => f.id === inscricao.formularioId)

  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))

  addNotificacao({
    userEmail: inscricao.userEmail,
    tipo: 'cancelamento-aprovado',
    titulo: 'Cancelamento aprovado',
    subtitulo: mensagem || `Sua inscrição em "${f?.titulo ?? ''}" foi cancelada.`,
    link: '/aluno/inscricoes',
  })

  return { success: true }
}

export function recusarCancelamento(inscricaoId, mensagem = '') {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)
  if (!inscricao) return { error: 'Inscrição não encontrada.' }
  const f = _forms.value.find(f => f.id === inscricao.formularioId)

  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId ? { ...i, cancelamento: null } : i
  ))

  addNotificacao({
    userEmail: inscricao.userEmail,
    tipo: 'cancelamento-recusado',
    titulo: 'Solicitação recusada',
    subtitulo: mensagem || `Sua solicitação para "${f?.titulo ?? ''}" foi analisada.`,
    link: '/aluno/inscricoes',
  })

  return { success: true }
}

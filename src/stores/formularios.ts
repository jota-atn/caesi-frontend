import { ref, computed } from 'vue'
import { upsertEventoFormulario, removeEventoByFormulario } from './calendario.ts'

export type TipoFormulario = 'evento-com-certificado' | 'evento-sem-certificado' | 'venda' | 'arrecadacao'
export type TipoCampo = 'texto' | 'numero' | 'select'
export type StatusFormulario = 'aberto' | 'encerrado'
export type StatusComprovante = 'pendente' | 'validado' | 'arquivado'

export interface CampoFormulario {
  id: string
  label: string
  tipo: TipoCampo
  obrigatorio: boolean
  opcoes?: string[]
}

export interface NovoFormulario {
  titulo: string
  tipo: TipoFormulario
  descricao: string
  pago: boolean
  valor: number | null
  prazoInscricao: string | null
  dataEvento: string | null
  limiteVagas: number | null
  requerMatricula: boolean
  campos: CampoFormulario[]
}

export interface Formulario extends NovoFormulario {
  id: number
  status: StatusFormulario
  criadoEm: string
  certificadosEmitidos?: boolean
  certificadosEmitidosEm?: string
}

export interface Comprovante {
  nome: string
  url: string | null
  status: StatusComprovante
}

export interface NovoComprovante {
  nome: string
  url: string | null
}

export interface Cancelamento {
  solicitado: boolean
  motivo: string
  solicitadoEm: string
}

export interface Certificado {
  emitidoEm: string
}

export interface Inscricao {
  id: number
  formularioId: number
  userEmail: string | null
  respostas: Record<string, unknown>
  comprovante: Comprovante | null
  criadoEm: string
  certificado?: Certificado
  cancelamento?: Cancelamento | null
}

export type ResultadoInscricao = { inscricao: Inscricao } | { error: string }
export type ResultadoOperacao = { success: true } | { error: string }

const KEY_FORMS = 'caesi_formularios_v2'
const KEY_INSCRICOES = 'caesi_inscricoes_v2'

const _forms = ref<Formulario[]>(JSON.parse(localStorage.getItem(KEY_FORMS) || '[]'))
const _inscricoes = ref<Inscricao[]>(JSON.parse(localStorage.getItem(KEY_INSCRICOES) || '[]'))

export const formularios = computed(() => _forms.value)
export const inscricoes  = computed(() => _inscricoes.value)

function persistForms(data: Formulario[]) {
  localStorage.setItem(KEY_FORMS, JSON.stringify(data))
  _forms.value = [...data]
}

function persistInscricoes(data: Inscricao[]) {
  localStorage.setItem(KEY_INSCRICOES, JSON.stringify(data))
  _inscricoes.value = [...data]
}

export function getFormulario(id: number): Formulario | null {
  return _forms.value.find(f => f.id === id) ?? null
}

export function addFormulario(dados: NovoFormulario): Formulario {
  const novo: Formulario = {
    ...dados,
    id: Date.now(),
    status: 'aberto',
    criadoEm: new Date().toISOString().split('T')[0],
  }
  persistForms([..._forms.value, novo])
  upsertEventoFormulario(novo.id, { nome: novo.titulo, data: novo.dataEvento, descricao: novo.descricao })
  return novo
}

export function updateFormulario(id: number, updates: Partial<Formulario>) {
  persistForms(_forms.value.map(f => f.id === id ? { ...f, ...updates } : f))
  const atualizado = _forms.value.find(f => f.id === id)
  if (atualizado) {
    upsertEventoFormulario(id, { nome: atualizado.titulo, data: atualizado.dataEvento, descricao: atualizado.descricao })
  }
}

export function deleteFormulario(id: number) {
  persistForms(_forms.value.filter(f => f.id !== id))
  persistInscricoes(_inscricoes.value.filter(i => i.formularioId !== id))
  removeEventoByFormulario(id)
}

export function getInscricoesByFormulario(formularioId: number): Inscricao[] {
  return _inscricoes.value.filter(i => i.formularioId === formularioId)
}

export function addInscricao(formularioId: number, respostas: Record<string, unknown>, comprovante: NovoComprovante | null = null): ResultadoInscricao {
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
  const email = (respostas._email as string | undefined)?.trim() || null
  if (email && _inscricoes.value.find(i => i.formularioId === formularioId && i.userEmail === email)) {
    return { error: 'Este e-mail já foi utilizado para se inscrever neste formulário.' }
  }
  const nova: Inscricao = {
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

export function emitirCertificados(formularioId: number) {
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

export function updateStatusComprovante(inscricaoId: number, status: StatusComprovante) {
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId && i.comprovante
      ? { ...i, comprovante: { ...i.comprovante, status } }
      : i
  ))
}

export function cancelarInscricaoDireta(inscricaoId: number): ResultadoOperacao {
  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))
  return { success: true }
}

export function solicitarCancelamento(inscricaoId: number, motivo = ''): ResultadoOperacao {
  const inscricao = _inscricoes.value.find(i => i.id === inscricaoId)
  if (!inscricao) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId
      ? { ...i, cancelamento: { solicitado: true, motivo, solicitadoEm: new Date().toISOString() } }
      : i
  ))
  return { success: true }
}

export function aprovarCancelamento(inscricaoId: number): ResultadoOperacao {
  if (!_inscricoes.value.find(i => i.id === inscricaoId)) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.filter(i => i.id !== inscricaoId))
  return { success: true }
}

export function recusarCancelamento(inscricaoId: number): ResultadoOperacao {
  if (!_inscricoes.value.find(i => i.id === inscricaoId)) return { error: 'Inscrição não encontrada.' }
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId ? { ...i, cancelamento: null } : i
  ))
  return { success: true }
}

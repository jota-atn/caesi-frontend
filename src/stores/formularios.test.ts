import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Formulario, Inscricao, NovoFormulario } from './formularios.ts'

async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./formularios.ts')
}

const formBase: NovoFormulario = {
  titulo: 'Camisa CAESI',
  tipo: 'venda',
  descricao: 'Compra de camisas',
  pago: true,
  valor: 45,
  prazoInscricao: null,
  dataEvento: null,
  limiteVagas: null,
  requerMatricula: false,
  campos: [],
}

describe('stores/formularios', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00'))
  })
  afterEach(() => { vi.useRealTimers() })

  describe('formularios', () => {
    it('começa vazia e addFormulario aplica status/criadoEm', async () => {
      const { formularios, addFormulario } = await storeLimpa()
      const novo = addFormulario(formBase)

      expect(formularios.value).toHaveLength(1)
      expect(novo.status).toBe('aberto')
      expect(novo.criadoEm).toBe('2026-06-15')
    })

    it('addFormulario com dataEvento cria um evento vinculado no calendário', async () => {
      const { addFormulario } = await storeLimpa()
      const novo = addFormulario({ ...formBase, dataEvento: '2026-07-01' })

      const { eventos } = await import('./calendario.ts')
      const evento = eventos.value.find(e => e.formularioId === novo.id)
      expect(evento?.nome).toBe('Camisa CAESI')
      expect(evento?.data).toBe('2026-07-01')
    })

    it('getFormulario encontra pelo id, ou retorna null', async () => {
      const { addFormulario, getFormulario } = await storeLimpa()
      const novo = addFormulario(formBase)

      expect(getFormulario(novo.id)?.titulo).toBe('Camisa CAESI')
      expect(getFormulario(999999)).toBeNull()
    })

    it('updateFormulario atualiza só o formulário indicado e ressincroniza o evento', async () => {
      const { formularios, addFormulario, updateFormulario } = await storeLimpa()
      const a = addFormulario({ ...formBase, dataEvento: '2026-07-01' })
      vi.advanceTimersByTime(1)
      const b = addFormulario(formBase)

      updateFormulario(a.id, { titulo: 'Camisa Editada', dataEvento: '2026-07-10' })

      expect(formularios.value.find((f: Formulario) => f.id === a.id)!.titulo).toBe('Camisa Editada')
      expect(formularios.value.find((f: Formulario) => f.id === b.id)!.titulo).toBe('Camisa CAESI')

      const { eventos } = await import('./calendario.ts')
      expect(eventos.value.find(e => e.formularioId === a.id)?.data).toBe('2026-07-10')
    })

    it('deleteFormulario remove o formulário, suas inscrições e o evento vinculado', async () => {
      const { formularios, inscricoes, addFormulario, addInscricao, deleteFormulario } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null, dataEvento: '2026-07-01' })
      addInscricao(form.id, {})

      deleteFormulario(form.id)

      expect(formularios.value).toHaveLength(0)
      expect(inscricoes.value).toHaveLength(0)
      const { eventos } = await import('./calendario.ts')
      expect(eventos.value.find(e => e.formularioId === form.id)).toBeUndefined()
    })
  })

  describe('addInscricao', () => {
    it('recusa inscrição em formulário inexistente', async () => {
      const { addInscricao } = await storeLimpa()
      const resultado = addInscricao(999999, {})
      expect(resultado).toEqual({ error: 'Formulário não encontrado.' })
    })

    it('recusa inscrição em formulário encerrado', async () => {
      const { addFormulario, updateFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      updateFormulario(form.id, { status: 'encerrado' })

      const resultado = addInscricao(form.id, {})
      expect(resultado).toEqual({ error: 'Este formulário está encerrado.' })
    })

    it('recusa inscrição depois do prazo', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null, prazoInscricao: '2026-06-01' })

      const resultado = addInscricao(form.id, {})
      expect(resultado).toEqual({ error: 'O prazo de inscrição deste formulário já encerrou.' })
    })

    it('aceita inscrição dentro do prazo', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null, prazoInscricao: '2026-07-01' })

      const resultado = addInscricao(form.id, {})
      expect('inscricao' in resultado).toBe(true)
    })

    it('recusa inscrição quando o limite de vagas foi atingido', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null, limiteVagas: 1 })

      addInscricao(form.id, { _email: 'a@a.com' })
      const segunda = addInscricao(form.id, { _email: 'b@b.com' })

      expect(segunda).toEqual({ error: 'As vagas já foram preenchidas.' })
    })

    it('recusa e-mail duplicado no mesmo formulário', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })

      addInscricao(form.id, { _email: 'ana@x.com' })
      const segunda = addInscricao(form.id, { _email: 'ana@x.com' })

      expect(segunda).toEqual({ error: 'Este e-mail já foi utilizado para se inscrever neste formulário.' })
    })

    it('permite o mesmo e-mail em formulários diferentes', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const formA = addFormulario({ ...formBase, pago: false, valor: null })
      vi.advanceTimersByTime(1)
      const formB = addFormulario({ ...formBase, pago: false, valor: null })

      addInscricao(formA.id, { _email: 'ana@x.com' })
      const naOutro = addInscricao(formB.id, { _email: 'ana@x.com' })

      expect('inscricao' in naOutro).toBe(true)
    })

    it('inscrição com comprovante entra com status pendente', async () => {
      const { addFormulario, addInscricao } = await storeLimpa()
      const form = addFormulario(formBase)

      const resultado = addInscricao(form.id, {}, { nome: 'comprovante.png', url: null })

      expect('inscricao' in resultado && resultado.inscricao.comprovante).toEqual({ nome: 'comprovante.png', url: null, status: 'pendente' })
    })
  })

  describe('gestão de comprovante e certificados', () => {
    it('updateStatusComprovante muda só a inscrição indicada', async () => {
      const { inscricoes, addFormulario, addInscricao, updateStatusComprovante } = await storeLimpa()
      const form = addFormulario(formBase)
      const a = addInscricao(form.id, { _email: 'a@a.com' }, { nome: 'a.png', url: null })
      vi.advanceTimersByTime(1)
      const b = addInscricao(form.id, { _email: 'b@b.com' }, { nome: 'b.png', url: null })
      const idA = 'inscricao' in a ? a.inscricao.id : -1
      const idB = 'inscricao' in b ? b.inscricao.id : -1

      updateStatusComprovante(idA, 'validado')

      expect(inscricoes.value.find((i: Inscricao) => i.id === idA)!.comprovante!.status).toBe('validado')
      expect(inscricoes.value.find((i: Inscricao) => i.id === idB)!.comprovante!.status).toBe('pendente')
    })

    it('emitirCertificados marca o formulário e todas as suas inscrições', async () => {
      const { formularios, inscricoes, addFormulario, addInscricao, emitirCertificados } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      addInscricao(form.id, { _email: 'a@a.com' })

      emitirCertificados(form.id)

      expect(formularios.value.find((f: Formulario) => f.id === form.id)!.certificadosEmitidos).toBe(true)
      expect(inscricoes.value.find((i: Inscricao) => i.formularioId === form.id)!.certificado).toEqual({ emitidoEm: '2026-06-15' })
    })
  })

  describe('cancelamento', () => {
    it('cancelarInscricaoDireta remove a inscrição', async () => {
      const { inscricoes, addFormulario, addInscricao, cancelarInscricaoDireta } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      const r = addInscricao(form.id, {})
      const id = 'inscricao' in r ? r.inscricao.id : -1

      const resultado = cancelarInscricaoDireta(id)

      expect(resultado).toEqual({ success: true })
      expect(inscricoes.value).toHaveLength(0)
    })

    it('solicitarCancelamento marca a inscrição como cancelamento solicitado', async () => {
      const { inscricoes, addFormulario, addInscricao, solicitarCancelamento } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      const r = addInscricao(form.id, {})
      const id = 'inscricao' in r ? r.inscricao.id : -1

      solicitarCancelamento(id, 'Não vou poder ir')

      const atual = inscricoes.value.find((i: Inscricao) => i.id === id)!
      expect(atual.cancelamento).toMatchObject({ solicitado: true, motivo: 'Não vou poder ir' })
    })

    it('solicitarCancelamento falha numa inscrição inexistente', async () => {
      const { solicitarCancelamento } = await storeLimpa()
      expect(solicitarCancelamento(999999)).toEqual({ error: 'Inscrição não encontrada.' })
    })

    it('aprovarCancelamento remove a inscrição', async () => {
      const { inscricoes, addFormulario, addInscricao, solicitarCancelamento, aprovarCancelamento } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      const r = addInscricao(form.id, {})
      const id = 'inscricao' in r ? r.inscricao.id : -1
      solicitarCancelamento(id)

      aprovarCancelamento(id)

      expect(inscricoes.value).toHaveLength(0)
    })

    it('recusarCancelamento mantém a inscrição e limpa o pedido de cancelamento', async () => {
      const { inscricoes, addFormulario, addInscricao, solicitarCancelamento, recusarCancelamento } = await storeLimpa()
      const form = addFormulario({ ...formBase, pago: false, valor: null })
      const r = addInscricao(form.id, {})
      const id = 'inscricao' in r ? r.inscricao.id : -1
      solicitarCancelamento(id)

      recusarCancelamento(id)

      const atual = inscricoes.value.find((i: Inscricao) => i.id === id)!
      expect(atual.cancelamento).toBeNull()
    })
  })
})

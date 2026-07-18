import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Task } from './tasks.ts'

async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./tasks.ts')
}

describe('stores/tasks', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  describe('membros', () => {
    it('começa vazia e addMembro cria com id/token únicos', async () => {
      const { membros, addMembro } = await storeLimpa()
      const m = addMembro('  Ana  ')

      expect(membros.value).toHaveLength(1)
      expect(m.nome).toBe('Ana')
      expect(m.id).toBeTypeOf('string')
      expect(m.token).toBeTypeOf('string')
      expect(m.id).not.toBe(m.token)
    })

    it('getMembroByToken encontra pelo token, ou retorna null', async () => {
      const { addMembro, getMembroByToken } = await storeLimpa()
      const m = addMembro('Ana')

      expect(getMembroByToken(m.token)?.nome).toBe('Ana')
      expect(getMembroByToken('token-invalido')).toBeNull()
    })

    it('removeMembro remove o membro e desaloca ele de todas as tasks', async () => {
      const { tasks, membros, addMembro, criarTask, removeMembro } = await storeLimpa()
      const ana = addMembro('Ana')
      const bruno = addMembro('Bruno')
      const task = criarTask({ titulo: 'Task', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao', alocados: [ana.id, bruno.id] })

      removeMembro(ana.id)

      expect(membros.value).toHaveLength(1)
      expect(membros.value[0].id).toBe(bruno.id)
      const atual = tasks.value.find((t: Task) => t.id === task.id)!
      expect(atual.alocados).toEqual([bruno.id])
    })
  })

  describe('tasks', () => {
    it('criarTask aplica defaults (descricao, alocados, selecionavel, status)', async () => {
      const { tasks, criarTask } = await storeLimpa()
      const task = criarTask({ titulo: 'Nova task', prioridade: 'alta', prazo: '2026-08-01', categoria: 'ouvidoria' })

      expect(task.descricao).toBe('')
      expect(task.alocados).toEqual([])
      expect(task.selecionavel).toBe(false)
      expect(task.status).toBe('pendente')
      expect(tasks.value).toHaveLength(1)
    })

    it('editarTask atualiza só os campos informados, na task certa', async () => {
      const { tasks, criarTask, editarTask } = await storeLimpa()
      const a = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })
      vi.advanceTimersByTime(1)
      const b = criarTask({ titulo: 'B', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })

      editarTask(a.id, { titulo: 'A editado' })

      expect(tasks.value.find((t: Task) => t.id === a.id)!.titulo).toBe('A editado')
      expect(tasks.value.find((t: Task) => t.id === b.id)!.titulo).toBe('B')
    })

    it('excluirTask remove só a task indicada', async () => {
      const { tasks, criarTask, excluirTask } = await storeLimpa()
      const a = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })
      vi.advanceTimersByTime(1)
      const b = criarTask({ titulo: 'B', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })

      excluirTask(a.id)

      expect(tasks.value).toHaveLength(1)
      expect(tasks.value[0].id).toBe(b.id)
    })

    it('atualizarStatus muda só o status da task indicada', async () => {
      const { tasks, criarTask, atualizarStatus } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })

      atualizarStatus(task.id, 'em-andamento')

      expect(tasks.value.find((t: Task) => t.id === task.id)!.status).toBe('em-andamento')
    })
  })

  describe('autoAlocar', () => {
    it('adiciona o membro aos alocados quando a task é selecionável', async () => {
      const { tasks, criarTask, addMembro, autoAlocar } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao', selecionavel: true })
      const membro = addMembro('Ana')

      autoAlocar(task.id, membro.id)

      expect(tasks.value.find((t: Task) => t.id === task.id)!.alocados).toEqual([membro.id])
    })

    it('não faz nada quando a task não é selecionável', async () => {
      const { tasks, criarTask, addMembro, autoAlocar } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao', selecionavel: false })
      const membro = addMembro('Ana')

      autoAlocar(task.id, membro.id)

      expect(tasks.value.find((t: Task) => t.id === task.id)!.alocados).toEqual([])
    })

    it('não duplica o membro se ele já estiver alocado', async () => {
      const { tasks, criarTask, addMembro, autoAlocar } = await storeLimpa()
      const membro = addMembro('Ana')
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao', selecionavel: true, alocados: [membro.id] })

      autoAlocar(task.id, membro.id)

      expect(tasks.value.find((t: Task) => t.id === task.id)!.alocados).toEqual([membro.id])
    })
  })

  describe('salvarAnotacao', () => {
    it('cria uma anotação nova pro membro', async () => {
      const { tasks, criarTask, addMembro, salvarAnotacao } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })
      const membro = addMembro('Ana')

      salvarAnotacao(task.id, membro.id, 'Minha anotação')

      const atual = tasks.value.find((t: Task) => t.id === task.id)!
      expect(atual.anotacoes?.[membro.id].texto).toBe('Minha anotação')
    })

    it('remove a anotação quando o texto fica vazio', async () => {
      const { tasks, criarTask, addMembro, salvarAnotacao } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })
      const membro = addMembro('Ana')

      salvarAnotacao(task.id, membro.id, 'Texto')
      salvarAnotacao(task.id, membro.id, '   ')

      const atual = tasks.value.find((t: Task) => t.id === task.id)!
      expect(atual.anotacoes?.[membro.id]).toBeUndefined()
    })

    it('anotações de membros diferentes na mesma task não se sobrescrevem', async () => {
      const { tasks, criarTask, addMembro, salvarAnotacao } = await storeLimpa()
      const task = criarTask({ titulo: 'A', prioridade: 'media', prazo: '2026-08-01', categoria: 'gestao' })
      const ana = addMembro('Ana')
      const bruno = addMembro('Bruno')

      salvarAnotacao(task.id, ana.id, 'Anotação da Ana')
      salvarAnotacao(task.id, bruno.id, 'Anotação do Bruno')

      const atual = tasks.value.find((t: Task) => t.id === task.id)!
      expect(atual.anotacoes?.[ana.id].texto).toBe('Anotação da Ana')
      expect(atual.anotacoes?.[bruno.id].texto).toBe('Anotação do Bruno')
    })
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Artefato } from './portal.ts'

async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./portal.ts')
}

describe('stores/portal', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  it('começa vazia quando não há nada no localStorage', async () => {
    const { artefatos } = await storeLimpa()
    expect(artefatos.value).toEqual([])
  })

  it('addArtefato cria com histórico inicial e defaults null', async () => {
    const { artefatos, addArtefato } = await storeLimpa()

    const novo = addArtefato({ tipo: 'Ata', descricao: 'Ata de reunião' })

    expect(novo.valor).toBeNull()
    expect(novo.anexo).toBeNull()
    expect(novo.editadoEm).toBeNull()
    expect(novo.historico).toEqual([{ data: novo.criadoEm, resumo: 'Artefato criado' }])
    expect(artefatos.value).toHaveLength(1)
  })

  it('getArtefato encontra pelo id, ou retorna null se não existir', async () => {
    const { addArtefato, getArtefato } = await storeLimpa()
    const novo = addArtefato({ tipo: 'Ata', descricao: 'Desc' })

    expect(getArtefato(novo.id)?.tipo).toBe('Ata')
    expect(getArtefato(999999)).toBeNull()
  })

  it('updateArtefato sem mudança real não altera editadoEm nem adiciona histórico', async () => {
    const { artefatos, addArtefato, updateArtefato } = await storeLimpa()
    const novo = addArtefato({ tipo: 'Ata', descricao: 'Desc' })

    updateArtefato(novo.id, { tipo: 'Ata' }) // mesmo valor de antes

    const atual = artefatos.value.find((a: Artefato) => a.id === novo.id)!
    expect(atual.editadoEm).toBeNull()
    expect(atual.historico).toHaveLength(1)
  })

  it('updateArtefato com mudança real marca editadoEm e adiciona um item no histórico', async () => {
    const { artefatos, addArtefato, updateArtefato } = await storeLimpa()
    const novo = addArtefato({ tipo: 'Ata', descricao: 'Desc' })

    updateArtefato(novo.id, { tipo: 'Ofício' })

    const atual = artefatos.value.find((a: Artefato) => a.id === novo.id)!
    expect(atual.tipo).toBe('Ofício')
    expect(atual.editadoEm).toBeTypeOf('string')
    expect(atual.historico).toHaveLength(2)
    expect(atual.historico[1].resumo).toBe('Tipo alterado')
  })

  it('updateArtefato com várias mudanças de uma vez junta os rótulos no plural', async () => {
    const { artefatos, addArtefato, updateArtefato } = await storeLimpa()
    const novo = addArtefato({ tipo: 'Ata', descricao: 'Desc' })

    updateArtefato(novo.id, { tipo: 'Ofício', descricao: 'Nova descrição' })

    const atual = artefatos.value.find((a: Artefato) => a.id === novo.id)!
    expect(atual.historico[1].resumo).toBe('Tipo, Descrição alterados')
  })

  it('updateArtefato ignora campos fora de CAMPOS_LABEL pro histórico', async () => {
    const { artefatos, addArtefato, updateArtefato } = await storeLimpa()
    const novo = addArtefato({ tipo: 'Ata', descricao: 'Desc' })

    // "id" não é um campo rastreado no histórico (nem deveria ser alterável de verdade).
    updateArtefato(novo.id, { id: novo.id })

    expect(artefatos.value.find((a: Artefato) => a.id === novo.id)!.historico).toHaveLength(1)
  })

  it('deleteArtefato remove só o artefato indicado', async () => {
    const { artefatos, addArtefato, deleteArtefato } = await storeLimpa()
    const a = addArtefato({ tipo: 'A', descricao: 'Desc A' })
    vi.advanceTimersByTime(1)
    const b = addArtefato({ tipo: 'B', descricao: 'Desc B' })

    deleteArtefato(a.id)

    expect(artefatos.value).toHaveLength(1)
    expect(artefatos.value[0].id).toBe(b.id)
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Estrutura } from './mapa.ts'

async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./mapa.ts')
}

describe('stores/mapa', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => { vi.useRealTimers() })

  it('começa vazia quando não há nada no localStorage', async () => {
    const { estruturas } = await storeLimpa()
    expect(estruturas.value).toEqual([])
  })

  it('addEstrutura adiciona com descrição e imagens padrão quando omitidas', async () => {
    const { estruturas, addEstrutura } = await storeLimpa()

    const nova = addEstrutura({ nome: 'Bloco CP', lat: -7.21, lng: -35.9 })

    expect(nova.nome).toBe('Bloco CP')
    expect(nova.descricao).toBe('')
    expect(nova.imagens).toEqual([])
    expect(nova.id).toBeTypeOf('number')
    expect(estruturas.value).toHaveLength(1)
  })

  it('getEstrutura encontra pelo id, ou retorna null se não existir', async () => {
    const { addEstrutura, getEstrutura } = await storeLimpa()
    const nova = addEstrutura({ nome: 'Bloco CP', lat: -7.21, lng: -35.9 })

    expect(getEstrutura(nova.id)?.nome).toBe('Bloco CP')
    expect(getEstrutura(999999)).toBeNull()
  })

  it('updateEstrutura atualiza só os campos informados', async () => {
    const { estruturas, addEstrutura, updateEstrutura } = await storeLimpa()
    const nova = addEstrutura({ nome: 'Bloco CP', descricao: 'Original', lat: -7.21, lng: -35.9 })

    updateEstrutura(nova.id, { lat: -7.22, lng: -35.91 })

    const atualizada = estruturas.value.find((e: Estrutura) => e.id === nova.id)!
    expect(atualizada.lat).toBe(-7.22)
    expect(atualizada.lng).toBe(-35.91)
    expect(atualizada.nome).toBe('Bloco CP')
    expect(atualizada.descricao).toBe('Original')
  })

  it('removeEstrutura remove só a estrutura indicada', async () => {
    const { estruturas, addEstrutura, removeEstrutura } = await storeLimpa()
    const a = addEstrutura({ nome: 'A', lat: 0, lng: 0 })
    vi.advanceTimersByTime(1)
    const b = addEstrutura({ nome: 'B', lat: 1, lng: 1 })

    removeEstrutura(a.id)

    expect(estruturas.value).toHaveLength(1)
    expect(estruturas.value[0].id).toBe(b.id)
  })

  it('persiste no localStorage entre reimports do módulo', async () => {
    const { addEstrutura } = await storeLimpa()
    addEstrutura({ nome: 'Persistida', lat: 0, lng: 0 })

    vi.resetModules()
    const { estruturas } = await import('./mapa.ts')

    expect(estruturas.value).toHaveLength(1)
    expect(estruturas.value[0].nome).toBe('Persistida')
  })
})

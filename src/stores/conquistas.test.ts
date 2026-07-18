import { describe, it, expect, beforeEach } from 'vitest'

async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./conquistas.ts')
}

describe('stores/conquistas', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('começa como não zerada quando não há nada no localStorage', async () => {
    const { cobrinhaZerada } = await storeLimpa()
    expect(cobrinhaZerada.value).toBe(false)
  })

  it('marcarCobrinhaZerada marca como zerada e retorna true na primeira vez', async () => {
    const { cobrinhaZerada, marcarCobrinhaZerada } = await storeLimpa()

    const desbloqueouAgora = marcarCobrinhaZerada()

    expect(desbloqueouAgora).toBe(true)
    expect(cobrinhaZerada.value).toBe(true)
    expect(localStorage.getItem('caesi_cobrinha_zerou')).toBe('true')
  })

  it('marcarCobrinhaZerada retorna false quando já estava zerada', async () => {
    const { marcarCobrinhaZerada } = await storeLimpa()

    marcarCobrinhaZerada()
    const segundaChamada = marcarCobrinhaZerada()

    expect(segundaChamada).toBe(false)
  })

  it('lê o estado já zerado do localStorage ao recarregar a store', async () => {
    const { marcarCobrinhaZerada } = await storeLimpa()
    marcarCobrinhaZerada()

    vi.resetModules()
    const { cobrinhaZerada } = await import('./conquistas.ts')

    expect(cobrinhaZerada.value).toBe(true)
  })
})

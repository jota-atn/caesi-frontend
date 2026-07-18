import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Publicacao } from './mural.ts'

// As stores usam Date.now() como id. Em testes, chamadas seguidas e síncronas
// podem cair no mesmo milissegundo e gerar ids colididos (dois itens
// "diferentes" com o mesmo id) — usamos fake timers só pra garantir ids
// distintos entre chamadas no mesmo teste, sem mudar a store.
beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

// As stores desse projeto guardam o estado num `ref` de módulo, inicializado
// UMA VEZ na primeira linha do arquivo (`ref(JSON.parse(localStorage.getItem(...)))`).
// Isso significa que só limpar o localStorage entre os testes não basta — o `ref`
// já foi criado com o valor antigo e não vai reler o localStorage sozinho.
// Por isso, a cada teste: limpamos o localStorage E forçamos o Vitest a reavaliar
// o módulo do zero com `vi.resetModules()` + `import()` dinâmico, o que faz a
// linha `ref(JSON.parse(...))` rodar de novo, agora contra o localStorage limpo.
async function storeLimpa() {
  localStorage.clear()
  vi.resetModules()
  return import('./mural.ts')
}

describe('stores/mural', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('começa vazia quando não há nada no localStorage', async () => {
    const { publicacoes } = await storeLimpa()
    expect(publicacoes.value).toEqual([])
  })

  it('addPublicacao adiciona no início da lista com os campos derivados preenchidos', async () => {
    const { publicacoes, addPublicacao } = await storeLimpa()

    const nova = addPublicacao({ titulo: '  Aviso  ', tipo: '  Edital  ', mensagem: '  Texto  ' })

    expect(nova.titulo).toBe('Aviso')
    expect(nova.tipo).toBe('Edital')
    expect(nova.mensagem).toBe('Texto')
    expect(nova.id).toBeTypeOf('number')
    expect(nova.criadoEm).toBeTypeOf('string')
    expect(nova.editadoEm).toBeNull()
    expect(nova.imagens).toEqual([])
    expect(nova.anexos).toEqual([])

    expect(publicacoes.value).toHaveLength(1)
    expect(publicacoes.value[0].id).toBe(nova.id)
  })

  it('addPublicacao coloca publicações novas antes das antigas', async () => {
    const { publicacoes, addPublicacao } = await storeLimpa()

    const primeira = addPublicacao({ titulo: 'Primeira', tipo: '', mensagem: 'Msg 1' })
    vi.advanceTimersByTime(1)
    const segunda  = addPublicacao({ titulo: 'Segunda', tipo: '', mensagem: 'Msg 2' })

    expect(publicacoes.value.map((p: Publicacao) => p.id)).toEqual([segunda.id, primeira.id])
  })

  it('persiste no localStorage — uma nova instância da store lê o mesmo dado', async () => {
    const { addPublicacao } = await storeLimpa()
    addPublicacao({ titulo: 'Persistida', tipo: '', mensagem: 'Msg' })

    // Reabre a store (sem limpar o localStorage) simulando o usuário recarregando a página.
    vi.resetModules()
    const { publicacoes } = await import('./mural.ts')

    expect(publicacoes.value).toHaveLength(1)
    expect(publicacoes.value[0].titulo).toBe('Persistida')
  })

  it('updatePublicacao atualiza os campos e marca editadoEm', async () => {
    const { publicacoes, addPublicacao, updatePublicacao } = await storeLimpa()
    const original = addPublicacao({ titulo: 'Original', tipo: '', mensagem: 'Msg' })

    updatePublicacao(original.id, { titulo: 'Editado' })

    const atualizada = publicacoes.value.find((p: Publicacao) => p.id === original.id)!
    expect(atualizada.titulo).toBe('Editado')
    expect(atualizada.editadoEm).toBeTypeOf('string')
  })

  it('updatePublicacao não afeta outras publicações', async () => {
    const { publicacoes, addPublicacao, updatePublicacao } = await storeLimpa()
    const a = addPublicacao({ titulo: 'A', tipo: '', mensagem: 'Msg A' })
    vi.advanceTimersByTime(1)
    const b = addPublicacao({ titulo: 'B', tipo: '', mensagem: 'Msg B' })

    updatePublicacao(a.id, { titulo: 'A editado' })

    expect(publicacoes.value.find((p: Publicacao) => p.id === b.id)!.titulo).toBe('B')
    expect(publicacoes.value.find((p: Publicacao) => p.id === b.id)!.editadoEm).toBeNull()
  })

  it('deletePublicacao remove só a publicação indicada', async () => {
    const { publicacoes, addPublicacao, deletePublicacao } = await storeLimpa()
    const a = addPublicacao({ titulo: 'A', tipo: '', mensagem: 'Msg A' })
    vi.advanceTimersByTime(1)
    const b = addPublicacao({ titulo: 'B', tipo: '', mensagem: 'Msg B' })

    deletePublicacao(a.id)

    expect(publicacoes.value).toHaveLength(1)
    expect(publicacoes.value[0].id).toBe(b.id)
  })
})

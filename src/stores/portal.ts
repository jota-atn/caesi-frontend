import { ref, computed } from 'vue'

export interface Anexo {
  nome: string
}

export interface HistoricoItem {
  data: string
  resumo: string
}

export interface Artefato {
  id: number
  tipo: string
  descricao: string
  valor: number | null
  anexo: Anexo | null
  criadoEm: string
  editadoEm: string | null
  historico: HistoricoItem[]
}

export interface NovoArtefato {
  tipo: string
  descricao: string
  valor?: number | null
  anexo?: Anexo | null
}

const KEY = 'caesi_portal'

const _artefatos = ref<Artefato[]>(JSON.parse(localStorage.getItem(KEY) || '[]'))

export const artefatos = computed(() => _artefatos.value)

function persist(list: Artefato[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
  _artefatos.value = [...list]
}

function hoje(): string {
  return new Date().toISOString().split('T')[0]
}

export function getArtefato(id: number): Artefato | null {
  return _artefatos.value.find(a => a.id === id) ?? null
}

const CAMPOS_LABEL: Record<string, string> = { tipo: 'Tipo', descricao: 'Descrição', valor: 'Valor', anexo: 'Anexo' }

export function addArtefato({ tipo, descricao, valor = null, anexo = null }: NovoArtefato): Artefato {
  const novo: Artefato = {
    id: Date.now(),
    tipo,
    descricao,
    valor,
    anexo,
    criadoEm: hoje(),
    editadoEm: null,
    historico: [{ data: hoje(), resumo: 'Artefato criado' }],
  }
  persist([..._artefatos.value, novo])
  return novo
}

export function updateArtefato(id: number, updates: Partial<Artefato>) {
  const atual = _artefatos.value.find(a => a.id === id)
  if (!atual) return

  const alterados = Object.keys(updates).filter(
    k => CAMPOS_LABEL[k] && JSON.stringify((updates as Record<string, unknown>)[k]) !== JSON.stringify((atual as Record<string, unknown>)[k])
  )
  const novoHistorico = alterados.length
    ? [...atual.historico, { data: hoje(), resumo: `${alterados.map(k => CAMPOS_LABEL[k]).join(', ')} alterado${alterados.length > 1 ? 's' : ''}` }]
    : atual.historico

  persist(_artefatos.value.map(a => a.id === id
    ? { ...a, ...updates, editadoEm: alterados.length ? hoje() : a.editadoEm, historico: novoHistorico }
    : a
  ))
}

export function deleteArtefato(id: number) {
  persist(_artefatos.value.filter(a => a.id !== id))
}

import { ref, computed } from 'vue'

const KEY_MEMBROS  = 'caesi_membros'
const KEY_DESC     = 'caesi_gestao_descricao'
const KEY_INFO     = 'caesi_gestao_info'
const KEY_HIST     = 'caesi_gestoes_anteriores'
const KEY_HIST_VIS = 'caesi_gestoes_visiveis'
const KEY_MISSAO   = 'caesi_sobre_missao'
const KEY_CONTATO  = 'caesi_sobre_contato'
const KEY_SECOES   = 'caesi_sobre_secoes'

const MISSAO_DEFAULT = `O CAESI, Centro Acadêmico de Ciência da Computação, é a entidade estudantil
que representa os alunos do curso de Ciência da Computação da UFCG. Nossa missão é defender
os direitos e interesses dos estudantes, promover a integração acadêmica e facilitar a comunicação
entre o corpo discente e a instituição.

A ouvidoria é um dos nossos canais mais importantes: um espaço para que qualquer aluno possa
relatar problemas, sugerir melhorias ou entrar em contato com o CAESI de forma segura, inclusive anônima.`

const CONTATO_DEFAULT = {
  endereco:  'Sala do CAESI — Bloco CP, UFCG, Campina Grande – PB',
  email:     'caesi@ccc.ufcg.edu.br',
  instagram: 'caesiufcg',
}

const _membros   = ref(JSON.parse(localStorage.getItem(KEY_MEMBROS) || '[]'))
const _descricao = ref(localStorage.getItem(KEY_DESC) || '')
const INFO_DEFAULT = { nomeChapa: '', mesInicio: '', anoInicio: '', mesFim: '', anoFim: '' }
const _info      = ref({ ...INFO_DEFAULT, ...JSON.parse(localStorage.getItem(KEY_INFO) || '{}') })
const _historico = ref(JSON.parse(localStorage.getItem(KEY_HIST) || '[]'))
const _histVis   = ref(localStorage.getItem(KEY_HIST_VIS) !== 'false')
const _missao    = ref(localStorage.getItem(KEY_MISSAO) || MISSAO_DEFAULT)
const _contato   = ref({ ...CONTATO_DEFAULT, ...JSON.parse(localStorage.getItem(KEY_CONTATO) || '{}') })
const _secoes    = ref(JSON.parse(localStorage.getItem(KEY_SECOES) || '[]'))

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export const membros            = computed(() => _membros.value)
export const descricaoGestao    = computed(() => _descricao.value)
export const gestaoInfo         = computed(() => _info.value)
export const historicoGestoes   = computed(() => _historico.value)
export const historicoVisivel   = computed(() => _histVis.value)
export const missaoTexto        = computed(() => _missao.value)
export const contatoInfo        = computed(() => _contato.value)
export const secoesCustom       = computed(() => _secoes.value)
export const periodoFormatado  = computed(() => {
  const { mesInicio, anoInicio, mesFim, anoFim } = _info.value
  if (!mesInicio || !anoInicio) return ''
  const fim = mesFim && anoFim ? ` – ${mesFim} ${anoFim}` : ''
  return `${mesInicio} ${anoInicio}${fim}`
})
export { MESES }

function persistMembros(list) {
  localStorage.setItem(KEY_MEMBROS, JSON.stringify(list))
  _membros.value = [...list]
}

export function addMembro(membro) {
  const novo = { ...membro, id: Date.now() }
  persistMembros([..._membros.value, novo])
  return novo
}

export function removeMembro(id) {
  persistMembros(_membros.value.filter(a => a.id !== id))
}

export function updateMembro(id, data) {
  persistMembros(_membros.value.map(a => a.id === id ? { ...a, ...data } : a))
}

export function saveMissao(texto) {
  localStorage.setItem(KEY_MISSAO, texto)
  _missao.value = texto
}

export function saveContato(dados) {
  const novo = { ..._contato.value, ...dados }
  localStorage.setItem(KEY_CONTATO, JSON.stringify(novo))
  _contato.value = novo
}

export function saveDescricao(texto) {
  localStorage.setItem(KEY_DESC, texto)
  _descricao.value = texto
}

export function saveInfo(info) {
  localStorage.setItem(KEY_INFO, JSON.stringify(info))
  _info.value = { ...info }
}

export function setHistoricoVisivel(val) {
  _histVis.value = val
  localStorage.setItem(KEY_HIST_VIS, String(val))
}

export function adicionarGestaoManual({ nomeChapa, periodo, descricao, membros }) {
  const entrada = { id: Date.now(), nomeChapa, periodo, descricao, membros: membros ?? [] }
  const nova = [entrada, ..._historico.value]
  localStorage.setItem(KEY_HIST, JSON.stringify(nova))
  _historico.value = nova
}

export function arquivarGestaoAtual() {
  const entrada = {
    id:       Date.now(),
    nomeChapa: _info.value.nomeChapa,
    periodo:  periodoFormatado.value,
    descricao: _descricao.value,
    membros:  _membros.value.map(({ nome, diretoria, periodo, foto }) => ({ nome, diretoria, periodo, foto: foto ?? '' })),
  }
  const nova = [entrada, ..._historico.value]
  localStorage.setItem(KEY_HIST, JSON.stringify(nova))
  _historico.value = nova
}

export function removerGestaoHistorico(id) {
  const nova = _historico.value.filter(g => g.id !== id)
  localStorage.setItem(KEY_HIST, JSON.stringify(nova))
  _historico.value = nova
}

function persistSecoes(list) {
  localStorage.setItem(KEY_SECOES, JSON.stringify(list))
  _secoes.value = [...list]
}

export function addSecao({ titulo, conteudo }) {
  const nova = { id: Date.now(), titulo, conteudo }
  persistSecoes([..._secoes.value, nova])
  return nova
}

export function updateSecao(id, data) {
  persistSecoes(_secoes.value.map(s => s.id === id ? { ...s, ...data } : s))
}

export function removeSecao(id) {
  persistSecoes(_secoes.value.filter(s => s.id !== id))
}

export function moverSecao(id, direcao) {
  const list = [..._secoes.value]
  const idx = list.findIndex(s => s.id === id)
  const alvo = idx + direcao
  if (idx < 0 || alvo < 0 || alvo >= list.length) return
  ;[list[idx], list[alvo]] = [list[alvo], list[idx]]
  persistSecoes(list)
}

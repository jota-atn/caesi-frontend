import { ref, computed } from 'vue'

const KEY_FORMS = 'caesi_formularios'
const KEY_INSCRICOES = 'caesi_inscricoes'

const MOCK_FORMULARIOS = [
  {
    id: 1,
    titulo: 'Semana de Computação 2025',
    tipo: 'evento-com-certificado',
    descricao: 'A maior semana acadêmica do curso de CC da UFCG. Palestras, workshops e networking.',
    pago: false,
    valor: null,
    prazoInscricao: '2025-06-15',
    status: 'aberto',
    campos: [
      { id: 'nome', label: 'Nome completo', tipo: 'texto', obrigatorio: true },
      { id: 'matricula', label: 'Matrícula', tipo: 'texto', obrigatorio: true },
      { id: 'periodo', label: 'Período atual', tipo: 'select', opcoes: ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º+'], obrigatorio: true },
      { id: 'interesse', label: 'Área de maior interesse', tipo: 'select', opcoes: ['Sistemas', 'IA/ML', 'Engenharia de Software', 'Redes', 'Teoria'], obrigatorio: false },
    ],
    criadoEm: '2025-05-10',
  },
  {
    id: 2,
    titulo: 'Venda de Camisas CAESI 2025',
    tipo: 'venda',
    descricao: 'Camisa oficial do CAESI 2025. Pedidos até esgotar o estoque. Pagamento via PIX.',
    pago: true,
    valor: 55.00,
    prazoInscricao: '2025-07-01',
    status: 'aberto',
    campos: [
      { id: 'nome', label: 'Nome completo', tipo: 'texto', obrigatorio: true },
      { id: 'tamanho', label: 'Tamanho', tipo: 'select', opcoes: ['P', 'M', 'G', 'GG', 'XGG'], obrigatorio: true },
      { id: 'quantidade', label: 'Quantidade', tipo: 'numero', obrigatorio: true },
      { id: 'contato', label: 'WhatsApp para contato', tipo: 'texto', obrigatorio: true },
    ],
    criadoEm: '2025-05-20',
  },
  {
    id: 3,
    titulo: 'Churrasco do CA — Junho 2025',
    tipo: 'evento-sem-certificado',
    descricao: 'Churrasco de integração do CA com os alunos. Local: área externa do LCC.',
    pago: true,
    valor: 25.00,
    prazoInscricao: '2025-06-20',
    status: 'aberto',
    campos: [
      { id: 'nome', label: 'Nome completo', tipo: 'texto', obrigatorio: true },
      { id: 'restricoes', label: 'Restrições alimentares', tipo: 'texto', obrigatorio: false },
    ],
    criadoEm: '2025-05-25',
  },
]

const MOCK_INSCRICOES = [
  {
    id: 101,
    formularioId: 1,
    userEmail: 'joao@ccc.ufcg.edu.br',
    respostas: { nome: 'João Silva', matricula: '121210123', periodo: '5º', interesse: 'IA/ML' },
    comprovante: null,
    criadoEm: '2025-05-12',
  },
  {
    id: 102,
    formularioId: 1,
    userEmail: 'maria@ccc.ufcg.edu.br',
    respostas: { nome: 'Maria Souza', matricula: '121210456', periodo: '3º', interesse: 'Engenharia de Software' },
    comprovante: null,
    criadoEm: '2025-05-13',
  },
  {
    id: 103,
    formularioId: 2,
    userEmail: 'joao@ccc.ufcg.edu.br',
    respostas: { nome: 'João Silva', tamanho: 'G', quantidade: '1', contato: '83999991111' },
    comprovante: { nome: 'comprovante_pix_joao.jpg', url: null, status: 'pendente' },
    criadoEm: '2025-05-21',
  },
  {
    id: 104,
    formularioId: 2,
    userEmail: 'pedro@ccc.ufcg.edu.br',
    respostas: { nome: 'Pedro Lima', tamanho: 'M', quantidade: '2', contato: '83988882222' },
    comprovante: { nome: 'comprovante_pedro.png', url: null, status: 'validado' },
    criadoEm: '2025-05-22',
  },
  {
    id: 105,
    formularioId: 3,
    userEmail: 'maria@ccc.ufcg.edu.br',
    respostas: { nome: 'Maria Souza', restricoes: 'Vegetariana' },
    comprovante: { nome: 'pix_maria_churrasco.jpg', url: null, status: 'pendente' },
    criadoEm: '2025-05-26',
  },
]

function initForms() {
  const stored = localStorage.getItem(KEY_FORMS)
  if (!stored) {
    localStorage.setItem(KEY_FORMS, JSON.stringify(MOCK_FORMULARIOS))
    return MOCK_FORMULARIOS
  }
  return JSON.parse(stored)
}

function initInscricoes() {
  const stored = localStorage.getItem(KEY_INSCRICOES)
  if (!stored) {
    localStorage.setItem(KEY_INSCRICOES, JSON.stringify(MOCK_INSCRICOES))
    return MOCK_INSCRICOES
  }
  return JSON.parse(stored)
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
  return novo
}

export function updateFormulario(id, updates) {
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

export function updateStatusComprovante(inscricaoId, status) {
  persistInscricoes(_inscricoes.value.map(i =>
    i.id === inscricaoId && i.comprovante
      ? { ...i, comprovante: { ...i.comprovante, status } }
      : i
  ))
}

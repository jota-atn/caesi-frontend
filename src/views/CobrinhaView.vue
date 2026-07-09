<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BackLink from '../components/BackLink.vue'
import { showToast } from '../stores/toast.js'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import { marcarCobrinhaZerada } from '../stores/conquistas.js'
import capeloIcon from '../assets/icons/graduation-cap.svg?raw'

const router = useRouter()

// DEBUG temporário: começa direto na luta do chefe e pula pro próximo assim que derrota, sem esperar pontuação.
// Lembrar de voltar pra false antes de mesclar/lançar.
const DEBUG_COMECAR_NO_CHEFE = false

const mqDesktop = window.matchMedia('(any-pointer: fine)')
const ehDesktop = ref(mqDesktop.matches)
function atualizarEhDesktop(e) { ehDesktop.value = e.matches }

const CHAVE_JA_VIU_BOAS_VINDAS = 'caesi_cobrinha_viu_boas_vindas'
const modalBoasVindas = ref(localStorage.getItem(CHAVE_JA_VIU_BOAS_VINDAS) !== 'true')
function fecharModalBoasVindas() {
  modalBoasVindas.value = false
  localStorage.setItem(CHAVE_JA_VIU_BOAS_VINDAS, 'true')
}
const modalConfirmarSaida = ref(false)
let pausadoPeloModal = false

function abrirConfirmarSaida() {
  if (estado.value === 'jogando') {
    estado.value = 'pausado'
    pausadoPeloModal = true
  }
  modalConfirmarSaida.value = true
}

function fecharConfirmarSaida() {
  modalConfirmarSaida.value = false
  if (pausadoPeloModal) {
    if (estado.value === 'pausado') estado.value = 'jogando'
    pausadoPeloModal = false
  }
}

useEscapeKey(() => {
  if (modalBoasVindas.value) { fecharModalBoasVindas(); return }
  if (modalConfirmarSaida.value) { fecharConfirmarSaida(); return }
  abrirConfirmarSaida()
})

const CELL = 28
const COLS = 28
const ROWS = 18

const VETORES = {
  cima:     { x: 0, y: -1 },
  baixo:    { x: 0, y: 1 },
  esquerda: { x: -1, y: 0 },
  direita:  { x: 1, y: 0 },
}

const TECLA_PARA_DIRECAO = {
  ArrowUp: 'cima', ArrowDown: 'baixo', ArrowLeft: 'esquerda', ArrowRight: 'direita',
  w: 'cima', s: 'baixo', a: 'esquerda', d: 'direita',
}

const cobra = ref([])
const direcao = ref(VETORES.direita)
let filaDirecoes = []
let ordemSegurando = [] // nomes das teclas de direção fisicamente pressionadas, da mais antiga pra mais recente

const comida = reactive({ x: 0, y: 0, especial: false })
const obstaculos = ref([])
const inimigos = ref([])
let proximoIdInimigo = 1
const projeteis = ref([])
let proximoIdProjetil = 1

const LIMIARES_CHEFE = [300, 750, 1000]

// chefes 1 e 2 vem sozinhos (encontros solo); o chefe 3 é uma dupla (ver iniciarBatalhaChefe)
const chefesAtivos = ref([]) // 1 item nos encontros solo, 2 no encontro final
const chefesDerrotados = ref(0) // conta ENCONTROS completos (0-3), não entidades individuais derrotadas
const proximoLimiarChefe = ref(LIMIARES_CHEFE[0])
const TIPOS_CHEFE_SOLO = ['perseguidor', 'fantasma']
const VIDAS_POR_TIPO = { perseguidor: 3, fantasma: 3, agil: 2, pesado: 3 }
const NOMES_CHEFE = {
  perseguidor: 'O Grande Cubo Vermelho',
  fantasma: 'Sombra Rancorosa da Borda',
  agil: 'Cavaleiro Relâmpago da Ata Perdida',
  pesado: 'Guardião de Ferro do Requerimento',
}

const MENSAGENS_COMIDA_ESPECIAL = [
  'Dalton ficaria orgulhoso!',
  'Compilou de primeira. Suspeito.',
  'Merge sem conflito. Milagre acadêmico.',
  'Isso é O(1) de eficiência.',
  'Aprovado com 10 em FMCC2',
  'Venceu Manel em uma discussão',
  'Foi chamado pra Projeto',
]

const MENSAGENS_GAME_OVER = [
  'Essa aí tu pagou rasgado',
  'Te vira bicho!',
  'Dessa vez pagou fumado!',
  'Foi pego colando, dá nisso mesmo',
  'Essa doeu mais que P2 de manhã cedo',
  'Tentou enrolar Eanes por ponto e olha no que deu',
]

// sorteia sem repetir a mesma mensagem duas vezes seguidas (cada lista tem seu próprio "último sorteado")
function criarSorteador(lista) {
  let ultimoIndice = -1
  return () => {
    if (lista.length <= 1) return lista[0]
    let indice
    do { indice = Math.floor(Math.random() * lista.length) } while (indice === ultimoIndice)
    ultimoIndice = indice
    return lista[indice]
  }
}

const sortearMensagemComidaEspecial = criarSorteador(MENSAGENS_COMIDA_ESPECIAL)
const sortearMensagemGameOver = criarSorteador(MENSAGENS_GAME_OVER)

const mensagemGameOver = ref(MENSAGENS_GAME_OVER[0])

const score = ref(0)
const recorde = ref(Number(localStorage.getItem('caesi_cobrinha_recorde') || 0))
const estado = ref('jogando') // 'jogando' | 'pausado' | 'fim' | 'vencido'

// recorde atualiza ao vivo (não só no fim de jogo) e avisa uma vez por partida quando é superado
let avisouNovoRecordeNestaPartida = false
watch(score, (novoScore) => {
  if (novoScore <= recorde.value) return
  recorde.value = novoScore
  localStorage.setItem('caesi_cobrinha_recorde', String(recorde.value))
  if (!avisouNovoRecordeNestaPartida) {
    avisouNovoRecordeNestaPartida = true
    showToast('Novo recorde!', 'success')
  }
})

const faltamProChefe = computed(() => {
  if (chefesAtivos.value.length || chefesDerrotados.value >= 3) return null
  return Math.max(0, proximoLimiarChefe.value - score.value)
})

let tickId = null
let velocidade = 130
let comidasComidas = 0
const invulneravelInimigos = ref(0)

// feedback visual rápido (shake + flash) pra dar impacto sem pesar no loop de lógica
const efeitoTela = ref(null) // null | 'acerto' | 'dano'
let efeitoTelaTimeout = null
function dispararEfeitoTela(tipo, duracao) {
  efeitoTela.value = tipo
  clearTimeout(efeitoTelaTimeout)
  efeitoTelaTimeout = setTimeout(() => { efeitoTela.value = null }, duracao)
}

const pulsoComer = ref(false)
let pulsoComerTimeout = null
function dispararPulsoComer() {
  pulsoComer.value = true
  clearTimeout(pulsoComerTimeout)
  pulsoComerTimeout = setTimeout(() => { pulsoComer.value = false }, 150)
}

function celulaOcupada(x, y) {
  if (comida.x === x && comida.y === y) return true
  if (obstaculos.value.some(o => o.x === x && o.y === y)) return true
  if (inimigos.value.some(i => i.x === x && i.y === y)) return true
  if (chefesAtivos.value.some(chefe => celulasChefe(chefe).some(c => c.x === x && c.y === y))) return true
  return cobra.value.some(seg => seg.x === x && seg.y === y)
}

const CENTRO_X = Math.floor(COLS / 2)
const CENTRO_Y = Math.floor(ROWS / 2)

function pertoDoCentro(x, y) {
  return Math.abs(x - CENTRO_X) <= 4 && Math.abs(y - CENTRO_Y) <= 3
}

// zona de segurança ao redor da cabeça, mais uma faixa estendida bem à frente
// na direção em que a cobra está indo — senão spawna algo "na cara" de quem
// tá indo reto sem dar tempo nenhum de reagir
function pertoDaCobra(x, y) {
  const cabeca = cobra.value[0]
  if (Math.abs(x - cabeca.x) <= 5 && Math.abs(y - cabeca.y) <= 4) return true

  const dir = direcao.value
  const passosAFrente = (x - cabeca.x) * dir.x + (y - cabeca.y) * dir.y
  const desvioLateral = dir.x !== 0 ? Math.abs(y - cabeca.y) : Math.abs(x - cabeca.x)
  return passosAFrente >= 1 && passosAFrente <= 12 && desvioLateral <= 1
}

function posicaoLivre(evitarCentro = false, evitarCobra = false) {
  let x, y
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
  } while (celulaOcupada(x, y) || (evitarCentro && pertoDoCentro(x, y)) || (evitarCobra && pertoDaCobra(x, y)))
  return { x, y }
}

function reposicionarComida() {
  const livre = posicaoLivre()
  comida.x = livre.x
  comida.y = livre.y
  comida.especial = comidasComidas > 0 && comidasComidas % 10 === 0
}

function gerarObstaculos(qtd, evitarCentro = false, evitarCobra = false) {
  const novos = []
  for (let i = 0; i < qtd; i++) {
    const p = posicaoLivre(evitarCentro, evitarCobra)
    novos.push(p)
    obstaculos.value = [...obstaculos.value, p]
  }
  return novos
}

// tipos de inimigo comum liberados conforme os chefes vão caindo:
// fase 1 (nenhum chefe derrotado) = só patrulha; fase 2 = +rápido; fase 3 = +atirador
function tiposInimigoDisponiveis() {
  const tipos = ['patrulha']
  if (chefesDerrotados.value >= 1) tipos.push('rapido')
  if (chefesDerrotados.value >= 2) tipos.push('atirador')
  return tipos
}

function gerarInimigo(evitarCentro = false, evitarCobra = false) {
  const tipos = tiposInimigoDisponiveis()
  const tipo = tipos[Math.floor(Math.random() * tipos.length)]
  const p = posicaoLivre(evitarCentro, evitarCobra)

  if (tipo === 'atirador') {
    inimigos.value = [...inimigos.value, { id: proximoIdInimigo++, tipo, x: p.x, y: p.y, cooldownTiro: 5 }]
    return
  }

  const horizontal = Math.random() < 0.5
  const sentido = Math.random() < 0.5 ? -1 : 1
  inimigos.value = [...inimigos.value, {
    id: proximoIdInimigo++,
    tipo,
    x: p.x,
    y: p.y,
    dx: horizontal ? sentido : 0,
    dy: horizontal ? 0 : sentido,
  }]
}

function tentarMover(x, y, dx, dy) {
  const nx = x + dx
  const ny = y + dy
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return null
  if (obstaculos.value.some(o => o.x === nx && o.y === ny)) return null
  return { nx, ny }
}

function moverPasso(inimigo) {
  let destino = tentarMover(inimigo.x, inimigo.y, inimigo.dx, inimigo.dy)
  if (!destino) {
    inimigo.dx *= -1
    inimigo.dy *= -1
    destino = tentarMover(inimigo.x, inimigo.y, inimigo.dx, inimigo.dy)
  }
  if (destino) {
    inimigo.x = destino.nx
    inimigo.y = destino.ny
  }
}

function atirar(inimigo) {
  const cabeca = cobra.value[0]
  const dx = cabeca.x - inimigo.x
  const dy = cabeca.y - inimigo.y
  let dirX = 0, dirY = 0
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) dirX = dx > 0 ? 1 : -1
  else if (dy !== 0) dirY = dy > 0 ? 1 : -1
  else dirX = 1
  projeteis.value = [...projeteis.value, { id: proximoIdProjetil++, x: inimigo.x, y: inimigo.y, dx: dirX, dy: dirY }]
}

function moverInimigo(inimigo) {
  if (inimigo.tipo === 'atirador') {
    inimigo.cooldownTiro -= 1
    if (inimigo.cooldownTiro <= 0) {
      atirar(inimigo)
      inimigo.cooldownTiro = 5
    }
    return
  }
  const vezes = inimigo.tipo === 'rapido' ? 2 : 1
  for (let i = 0; i < vezes; i++) moverPasso(inimigo)
}

// ── Chefes (a cada X pontos, mapa limpo + miniboss) ────────
function gerarCaminhoPerimetro() {
  const minX = 1, maxX = COLS - 3
  const minY = 1, maxY = ROWS - 3
  const caminho = []
  for (let x = minX; x <= maxX; x++) caminho.push({ x, y: minY })
  for (let y = minY + 1; y <= maxY; y++) caminho.push({ x: maxX, y })
  for (let x = maxX - 1; x >= minX; x--) caminho.push({ x, y: maxY })
  for (let y = maxY - 1; y > minY; y--) caminho.push({ x: minX, y })
  return caminho
}

const ATAQUE_CHEFE_COOLDOWN = 9

function criarChefe(tipo) {
  const base = { tipo, vidas: VIDAS_POR_TIPO[tipo], atordoado: 0, ataqueCooldown: ATAQUE_CHEFE_COOLDOWN, cooldownBase: ATAQUE_CHEFE_COOLDOWN }
  if (tipo === 'perseguidor' || tipo === 'agil') {
    // agil é a variante rápida (chefe final): mesma perseguição, 2 passos por tick
    return { ...base, x: COLS - 3, y: tipo === 'agil' ? 2 : ROWS - 3, passosPorTick: tipo === 'agil' ? 2 : 1 }
  }
  // fantasma e pesado patrulham o perímetro; pesado começa do lado oposto e anda de 2 em 2 ticks (lento)
  const caminho = gerarCaminhoPerimetro()
  const indiceCaminho = tipo === 'pesado' ? Math.floor(caminho.length / 2) : 0
  const inicio = caminho[indiceCaminho]
  return { ...base, x: inicio.x, y: inicio.y, caminho, indiceCaminho, contadorLento: 0 }
}

function empurrarChefe(chefe) {
  const distancia = 5
  chefe.x = Math.min(Math.max(chefe.x + direcao.value.x * distancia, 0), COLS - 2)
  chefe.y = Math.min(Math.max(chefe.y + direcao.value.y * distancia, 0), ROWS - 2)
}

// buff de "poder transferido": quando um dos dois chefes do encontro final morre primeiro, o outro fica mais forte
function aplicarBuffChefe(chefe) {
  chefe.buffado = true
  chefe.cooldownBase = Math.max(4, chefe.cooldownBase - 3)
  if (chefe.passosPorTick) chefe.passosPorTick += 1
}

// só o corpo conta como obstáculo pro chefe (a cabeça precisa continuar alcançável, é o alvo)
function corpoOcupaCelula(x, y) {
  return cobra.value.some((seg, idx) => idx > 0 && seg.x === x && seg.y === y)
}

function chefeColidiriaComCorpo(x, y) {
  return corpoOcupaCelula(x, y) || corpoOcupaCelula(x + 1, y) || corpoOcupaCelula(x, y + 1) || corpoOcupaCelula(x + 1, y + 1)
}

// no encontro final os dois chefes não podem se sobrepor
function chefeColidiriaComOutroChefe(chefeAtual, x, y) {
  const candidatas = [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }]
  return chefesAtivos.value.some(outro => {
    if (outro === chefeAtual) return false
    return candidatas.some(c => celulasChefe(outro).some(cc => cc.x === c.x && cc.y === c.y))
  })
}

function moverChefePasso(chefe) {
  if (chefe.tipo === 'perseguidor' || chefe.tipo === 'agil') {
    const cabeca = cobra.value[0]
    const dx = cabeca.x - chefe.x
    const dy = cabeca.y - chefe.y
    const candidatos = []
    const passoX = { x: Math.min(Math.max(chefe.x + (dx > 0 ? 1 : -1), 0), COLS - 2), y: chefe.y }
    const passoY = { x: chefe.x, y: Math.min(Math.max(chefe.y + (dy > 0 ? 1 : -1), 0), ROWS - 2) }
    if (Math.abs(dx) > Math.abs(dy) && dx !== 0) {
      candidatos.push(passoX)
      if (dy !== 0) candidatos.push(passoY)
    } else if (dy !== 0) {
      candidatos.push(passoY)
      if (dx !== 0) candidatos.push(passoX)
    } else if (dx !== 0) {
      candidatos.push(passoX)
    }
    const livre = candidatos.find(c => !chefeColidiriaComCorpo(c.x, c.y) && !chefeColidiriaComOutroChefe(chefe, c.x, c.y))
    if (livre) {
      chefe.x = livre.x
      chefe.y = livre.y
    } // senão, fica parado esse tick — o caminho tá bloqueado
  } else {
    const proximoIndice = (chefe.indiceCaminho + 1) % chefe.caminho.length
    const passo = chefe.caminho[proximoIndice]
    if (!chefeColidiriaComCorpo(passo.x, passo.y) && !chefeColidiriaComOutroChefe(chefe, passo.x, passo.y)) {
      chefe.indiceCaminho = proximoIndice
      chefe.x = passo.x
      chefe.y = passo.y
    }
  }
}

function moverChefe(chefe) {
  if (chefe.tipo === 'pesado') {
    // pesado anda só a cada 2 ticks — a menos que tenha herdado o poder do outro chefe (buffado)
    chefe.contadorLento += 1
    if (!chefe.buffado && chefe.contadorLento % 2 !== 0) return
    moverChefePasso(chefe)
    return
  }
  const passos = chefe.passosPorTick || 1
  for (let i = 0; i < passos; i++) moverChefePasso(chefe)
}

function atirarChefe(chefe) {
  atirar(chefe)
  if (chefe.tipo !== 'pesado') return
  // pesado varre uma segunda direção perpendicular, pra cobrir mais área do que um tiro só
  const cabeca = cobra.value[0]
  const dx = cabeca.x - chefe.x
  const dy = cabeca.y - chefe.y
  let dirX = 0, dirY = 0
  if (Math.abs(dx) >= Math.abs(dy)) dirY = Math.random() < 0.5 ? -1 : 1
  else dirX = Math.random() < 0.5 ? -1 : 1
  projeteis.value = [...projeteis.value, { id: proximoIdProjetil++, x: chefe.x, y: chefe.y, dx: dirX, dy: dirY }]
}

function celulasChefe(chefe) {
  return [
    { x: chefe.x, y: chefe.y },
    { x: chefe.x + 1, y: chefe.y },
    { x: chefe.x, y: chefe.y + 1 },
    { x: chefe.x + 1, y: chefe.y + 1 },
  ]
}

const ALCANCE_SEGURO_ATAQUE = 3

// jogador tá na mesma linha/coluna que o chefe, na direção em que está andando, e perto —
// ou seja, indo pro bote de verdade. Só nesse caso o chefe segura o tiro; se o jogador só
// tá passando perto (linha/coluna diferente), o chefe continua atirando normalmente.
function chefeNaMiraDeAtaque(chefe) {
  const cabeca = cobra.value[0]
  const dir = direcao.value
  return celulasChefe(chefe).some(c => {
    const passosAFrente = (c.x - cabeca.x) * dir.x + (c.y - cabeca.y) * dir.y
    const desvioLateral = dir.x !== 0 ? Math.abs(c.y - cabeca.y) : Math.abs(c.x - cabeca.x)
    return desvioLateral === 0 && passosAFrente >= 0 && passosAFrente <= ALCANCE_SEGURO_ATAQUE
  })
}

function iniciarBatalhaChefe() {
  obstaculos.value = []
  inimigos.value = []
  projeteis.value = []
  if (chefesDerrotados.value === 2) {
    // chefe final: os dois de uma vez
    chefesAtivos.value = [criarChefe('agil'), criarChefe('pesado')]
    showToast('Chefe final! Dois de uma vez — acerte a cabeça em qualquer um.', 'info')
  } else {
    chefesAtivos.value = [criarChefe(TIPOS_CHEFE_SOLO[chefesDerrotados.value])]
    showToast(`Chefe ${chefesDerrotados.value + 1} de 3 apareceu! Acerte a cabeça nele.`, 'info')
  }
  gerarObstaculos(6, false, true)
}

// ── Transição pra boss fight: cobra encolhe, tela fecha em círculo (iris wipe), troca o cenário, reabre ──
const TAMANHO_COBRA_CHEFE = 3
const TRANSICAO_DURACAO = 400
const transicaoFase = ref(null) // null | 'fechando' | 'abrindo'
const transicaoCentro = reactive({ x: 50, y: 50 })
let tamanhoAntesDoChefe = TAMANHO_COBRA_CHEFE
let crescimentoPendente = 0 // segmentos que a cobra ainda precisa recuperar depois da luta

function centroDaCabecaPercentual() {
  if (!cobra.value.length) return { x: 50, y: 50 }
  const cabeca = cobra.value[0]
  return { x: ((cabeca.x + 0.5) / COLS) * 100, y: ((cabeca.y + 0.5) / ROWS) * 100 }
}

function encolherCobraAnimado(alvo, aoTerminar) {
  const excedente = cobra.value.length - alvo
  if (excedente <= 0) { aoTerminar(); return }
  const intervalo = Math.max(18, Math.min(55, 700 / excedente))
  function passo() {
    if (cobra.value.length <= alvo) { aoTerminar(); return }
    cobra.value = cobra.value.slice(0, -1)
    setTimeout(passo, intervalo)
  }
  passo()
}

function iniciarTransicaoChefe() {
  if (estado.value === 'transicao') return
  estado.value = 'transicao'
  const centro = centroDaCabecaPercentual()
  transicaoCentro.x = centro.x
  transicaoCentro.y = centro.y
  tamanhoAntesDoChefe = cobra.value.length
  crescimentoPendente = 0
  encolherCobraAnimado(TAMANHO_COBRA_CHEFE, () => {
    transicaoFase.value = 'fechando'
    setTimeout(() => {
      iniciarBatalhaChefe()
      transicaoFase.value = 'abrindo'
      setTimeout(() => {
        transicaoFase.value = null
        estado.value = 'jogando'
      }, TRANSICAO_DURACAO)
    }, TRANSICAO_DURACAO)
  })
}

function iniciar() {
  cobra.value = [
    { x: CENTRO_X, y: CENTRO_Y },
    { x: CENTRO_X - 1, y: CENTRO_Y },
    { x: CENTRO_X - 2, y: CENTRO_Y },
  ]
  direcao.value = VETORES.direita
  filaDirecoes = []
  ordemSegurando = []
  obstaculos.value = []
  inimigos.value = []
  projeteis.value = []
  chefesAtivos.value = []
  chefesDerrotados.value = 0
  proximoLimiarChefe.value = LIMIARES_CHEFE[0]
  transicaoFase.value = null
  score.value = 0
  comidasComidas = 0
  invulneravelInimigos.value = 0
  efeitoTela.value = null
  pulsoComer.value = false
  avisouNovoRecordeNestaPartida = false
  tamanhoAntesDoChefe = TAMANHO_COBRA_CHEFE
  crescimentoPendente = 0
  velocidade = 130
  estado.value = 'aguardando'
  gerarObstaculos(6, true, true)
  gerarInimigo(true, true)
  gerarInimigo(true, true)
  reposicionarComida()

  // DEBUG temporário: começa direto na luta do chefe pra testar. Tirar depois.
  if (DEBUG_COMECAR_NO_CHEFE) iniciarBatalhaChefe()
}

function comecarJogo() {
  estado.value = 'jogando'
  tickId = setInterval(tick, velocidade)
}

function reiniciar() {
  clearInterval(tickId)
  iniciar()
  comecarJogo()
}

function continuarInfinito() {
  // os 3 chefes já foram derrotados (chefesDerrotados fica em 3) — só retoma o loop, sem mais chefes pela frente
  estado.value = 'jogando'
}

function trocarVelocidade() {
  clearInterval(tickId)
  tickId = setInterval(tick, velocidade)
}

function morrer() {
  estado.value = 'fim'
  dispararEfeitoTela('dano', 280)
  mensagemGameOver.value = sortearMensagemGameOver()
}

function tick() {
  if (estado.value !== 'jogando') return

  if (invulneravelInimigos.value > 0) invulneravelInimigos.value -= 1

  if (filaDirecoes.length) {
    direcao.value = filaDirecoes.shift()
  } else if (ordemSegurando.length) {
    const seguraVetor = VETORES[ordemSegurando[ordemSegurando.length - 1]]
    const ehReversao = seguraVetor.x === -direcao.value.x && seguraVetor.y === -direcao.value.y
    if (!ehReversao) direcao.value = seguraVetor
  }
  const cabeca = cobra.value[0]
  const novaCabeca = { x: cabeca.x + direcao.value.x, y: cabeca.y + direcao.value.y }

  const bateuParede = novaCabeca.x < 0 || novaCabeca.x >= COLS || novaCabeca.y < 0 || novaCabeca.y >= ROWS
  const bateuObstaculo = obstaculos.value.some(o => o.x === novaCabeca.x && o.y === novaCabeca.y)
  const bateuNoProprioCorpo = cobra.value.some((seg, i) => i < cobra.value.length - 1 && seg.x === novaCabeca.x && seg.y === novaCabeca.y)

  if (bateuParede || bateuObstaculo || bateuNoProprioCorpo) { morrer(); return }

  if (chefesAtivos.value.length) {
    let bounce = false
    for (const chefe of chefesAtivos.value) {
      if (chefe.atordoado > 0) {
        chefe.atordoado -= 1
        continue
      }
      let acertouChefe = celulasChefe(chefe).some(c => c.x === novaCabeca.x && c.y === novaCabeca.y)
      if (!acertouChefe) {
        moverChefe(chefe)
        // checa de novo: o chefe pode ter atravessado pra cima da cabeça nova ao se mover
        acertouChefe = celulasChefe(chefe).some(c => c.x === novaCabeca.x && c.y === novaCabeca.y)
      }
      if (!acertouChefe) continue

      bounce = true
      chefe.vidas -= 1
      score.value += 20
      dispararEfeitoTela('acerto', 200)
      if (chefe.vidas <= 0) {
        chefesAtivos.value = chefesAtivos.value.filter(c => c !== chefe)
        score.value += 50
        if (chefesAtivos.value.length > 0) {
          // era o encontro final (dupla): o sobrevivente herda o poder do que caiu
          showToast(`${NOMES_CHEFE[chefe.tipo]} caiu! ${NOMES_CHEFE[chefesAtivos.value[0].tipo]} ficou mais forte!`, 'success')
          aplicarBuffChefe(chefesAtivos.value[0])
          break
        }
        chefesDerrotados.value += 1
        if (chefesDerrotados.value >= 3) {
          estado.value = 'vencido'
          if (marcarCobrinhaZerada()) {
            showToast('Conquista desbloqueada! Veja o troféu no topo do site.', 'success')
          }
          return
        }
        showToast('Chefe derrotado! +50', 'success')
        proximoLimiarChefe.value = LIMIARES_CHEFE[chefesDerrotados.value]
        gerarObstaculos(6, false, true)
        gerarInimigo(false, true)
        gerarInimigo(false, true)
        invulneravelInimigos.value = 15
        // volta só até a metade do tamanho de antes da luta, não o tamanho cheio — mantém algum risco depois do chefe
        const alvoRegrow = Math.max(TAMANHO_COBRA_CHEFE, Math.ceil(tamanhoAntesDoChefe / 2))
        crescimentoPendente += Math.max(0, alvoRegrow - cobra.value.length)
        // DEBUG temporário: pula direto pro próximo chefe, sem esperar pontuação. Tirar depois.
        if (DEBUG_COMECAR_NO_CHEFE) iniciarTransicaoChefe()
      } else {
        empurrarChefe(chefe)
        chefe.atordoado = 10
        chefe.ataqueCooldown = chefe.cooldownBase + 5 // respiro maior logo após o golpe
        showToast(`${NOMES_CHEFE[chefe.tipo]} atingido! ${chefe.vidas} vida(s) restante(s)`, 'info')
      }
      break // um acerto só por tick
    }
    if (bounce) return // bounce: a cobra não avança essa rodada

    for (const chefe of chefesAtivos.value) {
      if (chefe.atordoado > 0) continue
      if (chefeNaMiraDeAtaque(chefe)) continue // jogador tá indo pro ataque — cooldown só volta a contar quando ele sair da rota
      chefe.ataqueCooldown -= 1
      if (chefe.ataqueCooldown <= 0) {
        atirarChefe(chefe)
        chefe.ataqueCooldown = chefe.cooldownBase
      }
    }
  }

  let totalInimigosAntes = inimigos.value.length
  inimigos.value = inimigos.value.filter(i => !(i.x === novaCabeca.x && i.y === novaCabeca.y))
  let eliminouInimigo = inimigos.value.length < totalInimigosAntes

  inimigos.value.forEach(moverInimigo)

  // checa de novo: um sobrevivente pode ter atravessado pra cima da cabeça nova ao se mover
  totalInimigosAntes = inimigos.value.length
  inimigos.value = inimigos.value.filter(i => !(i.x === novaCabeca.x && i.y === novaCabeca.y))
  eliminouInimigo = eliminouInimigo || inimigos.value.length < totalInimigosAntes

  if (eliminouInimigo) {
    score.value += 25
    showToast('Inimigo eliminado! +25', 'success')
  }

  projeteis.value.forEach(p => { p.x += p.dx; p.y += p.dy })
  projeteis.value = projeteis.value.filter(p =>
    p.x >= 0 && p.x < COLS && p.y >= 0 && p.y < ROWS &&
    !obstaculos.value.some(o => o.x === p.x && o.y === p.y)
  )

  const comeu = novaCabeca.x === comida.x && novaCabeca.y === comida.y
  cobra.value = [novaCabeca, ...cobra.value]
  if (!comeu && crescimentoPendente > 0) {
    // recuperando o tamanho perdido na luta contra o chefe: cresce 1 segmento por movimento em vez de encolher
    crescimentoPendente -= 1
  } else if (!comeu) {
    cobra.value.pop()
  } else {
    comidasComidas += 1
    dispararPulsoComer()
    if (comida.especial) {
      score.value += 50
      showToast(`${sortearMensagemComidaEspecial()} +50`, 'success')
    } else {
      score.value += 15
    }
    reposicionarComida()
    if (!chefesAtivos.value.length && comidasComidas % 5 === 0) gerarObstaculos(1, false, true)
    if (!chefesAtivos.value.length && comidasComidas % 2 === 0) gerarInimigo(false, true)
    velocidade = Math.max(75, 130 - comidasComidas * 1.5)
    trocarVelocidade()
  }

  const pegoPeloInimigo = invulneravelInimigos.value <= 0 && inimigos.value.some(i => cobra.value.some((seg, idx) => idx > 0 && seg.x === i.x && seg.y === i.y))
  if (pegoPeloInimigo) { morrer(); return }

  const atingidoPorProjetil = invulneravelInimigos.value <= 0 && projeteis.value.some(p => cobra.value.some(seg => seg.x === p.x && seg.y === p.y))
  if (atingidoPorProjetil) { morrer(); return }

  if (!chefesAtivos.value.length && chefesDerrotados.value < 3 && score.value >= proximoLimiarChefe.value) {
    iniciarTransicaoChefe()
  }
}

function onKeydown(e) {
  if (modalBoasVindas.value || modalConfirmarSaida.value) return
  // "vencido" tem 3 destinos diferentes (continuar/reiniciar/sair) — sem atalho de teclado pra não resetar sem querer
  if (estado.value === 'fim' && (e.key === 'Enter' || e.key === 'r' || e.key === 'R')) { reiniciar(); return }

  const teclaNormalizada = e.key.length === 1 ? e.key.toLowerCase() : e.key
  const nomeDirecao = TECLA_PARA_DIRECAO[teclaNormalizada]

  if (estado.value === 'aguardando') {
    if (!nomeDirecao) return
    comecarJogo()
  }

  if (e.key === 'p' || e.key === 'P') {
    if (e.repeat) return
    if (estado.value === 'jogando') estado.value = 'pausado'
    else if (estado.value === 'pausado') estado.value = 'jogando'
    return
  }
  if (!nomeDirecao) return
  e.preventDefault()

  if (!ordemSegurando.includes(nomeDirecao)) ordemSegurando.push(nomeDirecao)
  if (e.repeat) return // auto-repeat só mantém o "segurando", não empilha mais toques na fila

  const nova = VETORES[nomeDirecao]
  if (filaDirecoes.length >= 2) return
  const ultima = filaDirecoes.length ? filaDirecoes[filaDirecoes.length - 1] : direcao.value
  // impede reverter direto pro próprio pescoço, e ignora repetir a mesma direção
  if (nova.x === -ultima.x && nova.y === -ultima.y) return
  if (nova.x === ultima.x && nova.y === ultima.y) return
  filaDirecoes.push(nova)
}

function onKeyup(e) {
  const teclaNormalizada = e.key.length === 1 ? e.key.toLowerCase() : e.key
  const nomeDirecao = TECLA_PARA_DIRECAO[teclaNormalizada]
  if (!nomeDirecao) return
  ordemSegurando = ordemSegurando.filter(d => d !== nomeDirecao)
}

onMounted(() => {
  mqDesktop.addEventListener('change', atualizarEhDesktop)
  if (!ehDesktop.value) return
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('keyup', onKeyup)
  iniciar()
})
onUnmounted(() => {
  mqDesktop.removeEventListener('change', atualizarEhDesktop)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('keyup', onKeyup)
  clearInterval(tickId)
  clearTimeout(efeitoTelaTimeout)
  clearTimeout(pulsoComerTimeout)
})
</script>

<template>
  <div class="page cobrinha-page">
    <div class="deco-star" style="top:120px;right:3%;font-size:1.3rem;opacity:0.35;">✦</div>
    <div class="deco-star" style="bottom:15%;left:2%;font-size:1.1rem;opacity:0.3;">✦</div>

    <div class="page-content">
      <BackLink to="/" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Cobrinha do <span>CAESI</span></h2>
        <div class="cobrinha-hud" v-if="ehDesktop">
          <div class="cobrinha-stat">
            <span class="cobrinha-stat-num">{{ score }}</span>
            <span class="cobrinha-stat-label">Pontos</span>
          </div>
          <div class="cobrinha-stat">
            <span class="cobrinha-stat-num" style="color:var(--amarelo);">{{ recorde }}</span>
            <span class="cobrinha-stat-label">Recorde</span>
          </div>
        </div>
      </div>
      <p v-if="ehDesktop && faltamProChefe !== null" class="cobrinha-progresso-chefe">
        Faltam {{ faltamProChefe }} pontos pro {{ chefesDerrotados === 0 ? 'próximo chefe' : `chefe ${chefesDerrotados + 1} de 3` }}
      </p>

      <div v-if="ehDesktop" class="paper cobrinha-paper">
        <div
          class="cobrinha-area"
          :class="{ 'cobrinha-area--efeito-acerto': efeitoTela === 'acerto', 'cobrinha-area--efeito-dano': efeitoTela === 'dano' }"
          :style="{ width: COLS * CELL + 'px', height: ROWS * CELL + 'px', backgroundSize: CELL + 'px ' + CELL + 'px' }"
        >
          <div v-if="efeitoTela" class="cobrinha-flash" :class="'cobrinha-flash--' + efeitoTela"></div>

          <div
            v-for="o in obstaculos"
            :key="'o' + o.x + '-' + o.y"
            class="cobrinha-obstaculo"
            :style="{ left: o.x * CELL + 'px', top: o.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div
            v-for="inimigo in inimigos"
            :key="inimigo.id"
            class="cobrinha-inimigo"
            :class="'cobrinha-inimigo--' + inimigo.tipo"
            :style="{ left: inimigo.x * CELL + 'px', top: inimigo.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div
            v-for="p in projeteis"
            :key="'p' + p.id"
            class="cobrinha-projetil"
            :style="{ left: p.x * CELL + 'px', top: p.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div
            class="cobrinha-comida"
            :class="{ 'cobrinha-comida--especial': comida.especial }"
            :style="{ left: comida.x * CELL + 'px', top: comida.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
            v-html="comida.especial ? capeloIcon : ''"
          ></div>

          <div
            v-for="chefe in chefesAtivos"
            :key="'chefe-' + chefe.tipo"
            class="cobrinha-chefe"
            :class="['cobrinha-chefe--' + chefe.tipo, { 'cobrinha-chefe--atordoado': chefe.atordoado > 0, 'cobrinha-chefe--buffado': chefe.buffado }]"
            :style="{ left: chefe.x * CELL + 'px', top: chefe.y * CELL + 'px', width: (CELL * 2) + 'px', height: (CELL * 2) + 'px' }"
          ></div>

          <div v-if="chefesAtivos.length" class="cobrinha-chefe-banner">
            <div v-for="chefe in chefesAtivos" :key="'banner-' + chefe.tipo" class="cobrinha-chefe-banner-linha">
              <span class="cobrinha-chefe-nome">{{ NOMES_CHEFE[chefe.tipo] }}</span>
              <span class="cobrinha-chefe-barra">
                <span
                  v-for="n in VIDAS_POR_TIPO[chefe.tipo]"
                  :key="n"
                  class="cobrinha-chefe-segmento"
                  :class="{ 'cobrinha-chefe-segmento--perdido': n > chefe.vidas }"
                ></span>
              </span>
            </div>
          </div>

          <div
            v-for="(seg, i) in cobra"
            :key="'s' + i"
            class="cobrinha-segmento"
            :class="{
              'cobrinha-segmento--cabeca': i === 0,
              'cobrinha-segmento--par': i > 0 && i % 2 === 0,
              'cobrinha-segmento--pulso': i === 0 && pulsoComer,
              'cobrinha-segmento--invulneravel': invulneravelInimigos > 0,
            }"
            :style="{ left: seg.x * CELL + 'px', top: seg.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div
            v-if="transicaoFase"
            class="cobrinha-transicao"
            :class="'cobrinha-transicao--' + transicaoFase"
            :style="{ left: transicaoCentro.x + '%', top: transicaoCentro.y + '%' }"
          ></div>

          <div v-if="estado === 'fim'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">{{ chefesDerrotados >= 3 ? 'Parabéns, campeão(ã)!' : mensagemGameOver }}</p>
            <p class="cobrinha-overlay-sub">
              <template v-if="chefesDerrotados >= 3">Você já tinha zerado o jogo — essa rodada extra foi só diversão. </template>
              Pontuação: {{ score }}
              <template v-if="score > 0 && score >= recorde"> — novo recorde!</template>
            </p>
            <button class="btn btn-amarelo" @click="reiniciar">Jogar de novo (Enter ou R)</button>
          </div>

          <div v-if="estado === 'pausado'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">Pausado</p>
            <p class="cobrinha-overlay-sub">Aperte P pra continuar</p>
          </div>

          <div v-if="estado === 'aguardando'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">Pronta?</p>
            <p class="cobrinha-overlay-sub">Aperte uma tecla pra começar</p>
          </div>

          <div v-if="estado === 'vencido'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">Você venceu o jogo!</p>
            <p class="cobrinha-overlay-sub">
              Os 3 chefes foram derrotados. Pontuação: {{ score }}
              <template v-if="score > 0 && score >= recorde"> — novo recorde!</template>
            </p>
            <div class="cobrinha-overlay-acoes">
              <button class="btn btn-amarelo" @click="continuarInfinito">Continuar jogando</button>
              <button class="btn btn-outline btn-outline-creme" @click="reiniciar">Jogar de novo</button>
              <button class="btn btn-outline btn-outline-creme" @click="router.push('/')">Sair</button>
            </div>
          </div>
        </div>

        <div class="cobrinha-info">
          <div class="cobrinha-legenda">
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--roxo)"></span>você</span>
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--amarelo)"></span>comida</span>
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--vermelho)"></span>obstáculo</span>
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--preto)"></span>inimigo (cabeça elimina +25, corpo mata)</span>
            <span v-if="chefesDerrotados >= 1" class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--vermelho)"></span>inimigo rápido (mesma regra, 2x mais veloz)</span>
            <span v-if="chefesDerrotados >= 2" class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--preto)"></span>atirador (parado, atira; o tiro mata em qualquer parte)</span>
            <span v-if="chefesDerrotados >= 1" class="cobrinha-legenda-item">chefes acertados na cabeça 3x pra vencer, mas atiram de volta</span>
            <span v-if="chefesDerrotados >= 2" class="cobrinha-legenda-item">chefe final: dois de uma vez — quem morrer primeiro deixa o outro mais forte</span>
          </div>
          <div class="cobrinha-controles">
            <span class="cobrinha-tecla-grupo">
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
              <span class="cobrinha-ou">ou</span>
              <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>
              mover
            </span>
            <span class="cobrinha-tecla-grupo"><kbd>P</kbd>pausar</span>
            <span class="cobrinha-tecla-grupo"><kbd>Esc</kbd>sair</span>
          </div>
        </div>
      </div>

      <div v-else class="paper cobrinha-paper" style="text-align:center;">
        <p class="paper-title">Só dá pra jogar no computador</p>
        <p style="font-size:0.9rem;line-height:1.6;">Esse Easter Egg usa o teclado — WASD ou as setinhas. Volta aqui de um computador pra jogar.</p>
        <p v-if="recorde > 0" style="margin-top:0.6rem;color:var(--roxo-escuro);">Seu recorde até agora: <strong>{{ recorde }}</strong></p>
      </div>
    </div>

    <div v-if="modalBoasVindas" class="modal-overlay" @click.self="fecharModalBoasVindas">
      <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">Parabéns! Você encontrou um Easter Egg!</h2>
        <p class="modal-body">Existe um código secreto escondido no site do CAESI, e você acabou de descobrir pra onde ele leva. Não conta pra ninguém, viu? Haha.</p>
        <div class="modal-actions">
          <button class="btn btn-amarelo" @click="fecharModalBoasVindas">Jogar</button>
        </div>
      </div>
    </div>

    <div v-if="modalConfirmarSaida" class="modal-overlay" @click.self="fecharConfirmarSaida">
      <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
        <h2 class="modal-title">Sair da cobrinha?</h2>
        <p class="modal-body">Você vai voltar pra página inicial do site.</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="fecharConfirmarSaida">Cancelar</button>
          <button class="btn btn-amarelo" @click="router.push('/')">Sair</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cobrinha-hud {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.cobrinha-progresso-chefe {
  margin-top: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--roxo-escuro);
  opacity: 0.75;
}
.cobrinha-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: var(--creme);
  border-radius: 3px;
  padding: 0.4rem 0.9rem;
  min-width: 64px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.cobrinha-stat-num {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 1.3rem;
  color: var(--roxo-escuro);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
}
.cobrinha-stat-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cobrinha-paper {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  overflow: auto;
}

.cobrinha-area {
  position: relative;
  background-color: var(--creme-escuro);
  background-image:
    linear-gradient(to right, rgba(80,64,160,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(80,64,160,0.1) 1px, transparent 1px);
  border: none;
  outline: 3px solid var(--roxo-escuro);
  outline-offset: 0;
  box-shadow: inset 0 0 0 2px var(--creme);
  border-radius: 0;
  overflow: hidden;
  max-width: 100%;
}

.cobrinha-area--efeito-acerto {
  animation: cobrinha-shake 0.2s steps(4, end);
}
.cobrinha-area--efeito-dano {
  animation: cobrinha-shake-forte 0.28s steps(5, end);
}
@keyframes cobrinha-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-3px, 2px); }
  50% { transform: translate(3px, -2px); }
  75% { transform: translate(-2px, -2px); }
}
@keyframes cobrinha-shake-forte {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-6px, 3px); }
  40% { transform: translate(5px, -4px); }
  60% { transform: translate(-5px, -3px); }
  80% { transform: translate(4px, 4px); }
}

.cobrinha-flash {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;
}
.cobrinha-flash--acerto {
  background: var(--amarelo);
  animation: cobrinha-flash-fade 0.2s steps(3, end) forwards;
}
.cobrinha-flash--dano {
  background: var(--vermelho);
  animation: cobrinha-flash-fade 0.28s steps(4, end) forwards;
}
@keyframes cobrinha-flash-fade {
  from { opacity: 0.4; }
  to   { opacity: 0; }
}

.cobrinha-segmento {
  position: absolute;
  box-sizing: border-box;
  padding: 1.5px;
}
.cobrinha-segmento::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--roxo);
  border-radius: 0;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.cobrinha-segmento--par::before {
  background: var(--roxo-fundo);
}
.cobrinha-segmento--cabeca {
  z-index: 2;
  position: absolute;
}
.cobrinha-segmento--cabeca::before {
  background: var(--roxo-escuro);
  box-shadow: 3px 3px 0 var(--preto);
}
.cobrinha-segmento--pulso::before {
  animation: cobrinha-pop 0.15s steps(3, end);
}
@keyframes cobrinha-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.cobrinha-segmento--invulneravel::before {
  animation: cobrinha-piscar 0.15s steps(1, end) infinite;
}

.cobrinha-comida {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
}
.cobrinha-comida::before {
  content: '';
  position: absolute;
  inset: 2px;
  background: var(--roxo-escuro);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
.cobrinha-comida::after {
  content: '';
  position: absolute;
  inset: 5px;
  background: var(--amarelo);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  filter: drop-shadow(2px 2px 0 var(--roxo-escuro));
}
.cobrinha-comida--especial::after {
  background: var(--creme);
  animation: cobrinha-pulso 0.8s infinite alternate;
}
.cobrinha-comida :deep(svg) {
  position: relative;
  width: 13px;
  height: 13px;
  color: var(--roxo-escuro);
  z-index: 1;
}

@keyframes cobrinha-pulso {
  from { transform: scale(1); }
  to   { transform: scale(1.15); }
}

.cobrinha-obstaculo {
  position: absolute;
  box-sizing: border-box;
  padding: 1.5px;
}
.cobrinha-obstaculo::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--vermelho);
  border-radius: 0;
  box-shadow: 3px 3px 0 var(--preto);
}

.cobrinha-inimigo {
  position: absolute;
  box-sizing: border-box;
  padding: 1.5px;
}
.cobrinha-inimigo::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--preto);
  border-radius: 0;
  box-shadow: 3px 3px 0 var(--vermelho);
}
.cobrinha-inimigo--rapido::before {
  background: var(--vermelho);
  box-shadow: 3px 3px 0 var(--preto);
}
.cobrinha-inimigo--atirador::before {
  box-shadow: 3px 3px 0 var(--amarelo);
}

.cobrinha-projetil {
  position: absolute;
  box-sizing: border-box;
  padding: 9px;
}
.cobrinha-projetil::before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: var(--amarelo);
  box-shadow: 2px 2px 0 var(--preto);
}

.cobrinha-chefe {
  position: absolute;
  box-sizing: border-box;
}
.cobrinha-chefe::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 0;
  box-shadow: 4px 4px 0 var(--preto);
}
.cobrinha-chefe--perseguidor::before { background: var(--vermelho); }
.cobrinha-chefe--fantasma::before { background: var(--roxo-escuro); }
.cobrinha-chefe--agil::before { background: var(--amarelo); }
.cobrinha-chefe--pesado::before { background: var(--cinza); }

.cobrinha-chefe--atordoado::before {
  animation: cobrinha-piscar 0.15s steps(1, end) infinite;
}
@keyframes cobrinha-piscar {
  50% { opacity: 0.2; }
}

.cobrinha-chefe--buffado::before {
  box-shadow: 4px 4px 0 var(--amarelo);
}

.cobrinha-chefe-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  background: var(--preto);
  pointer-events: none;
}
.cobrinha-chefe-banner-linha {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
}
.cobrinha-chefe-nome {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.8rem;
  color: var(--creme);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cobrinha-chefe-barra {
  display: flex;
  gap: 3px;
}
.cobrinha-chefe-segmento {
  width: 34px;
  height: 8px;
  background: var(--vermelho);
  box-shadow: 1px 1px 0 rgba(0,0,0,0.4);
}
.cobrinha-chefe-segmento--perdido {
  background: rgba(242,230,196,0.15);
  box-shadow: none;
}

.cobrinha-transicao {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 100vmax var(--preto);
  z-index: 20;
  pointer-events: none;
}
.cobrinha-transicao--fechando {
  animation: cobrinha-iris-fechar 0.4s steps(10, end) forwards;
}
.cobrinha-transicao--abrindo {
  animation: cobrinha-iris-abrir 0.4s steps(10, end) forwards;
}
@keyframes cobrinha-iris-fechar {
  from { width: 2200px; height: 2200px; }
  to   { width: 0; height: 0; }
}
@keyframes cobrinha-iris-abrir {
  from { width: 0; height: 0; }
  to   { width: 2200px; height: 2200px; }
}

.cobrinha-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: rgba(80,64,160,0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: center;
  padding: 1rem;
}
.cobrinha-overlay-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.3rem;
  color: var(--amarelo);
}
.cobrinha-overlay-sub { font-size: 0.9rem; color: var(--creme); }
.cobrinha-overlay-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
}

.cobrinha-info {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 1.4rem;
  background: rgba(80,64,160,0.06);
  border: 1px solid rgba(80,64,160,0.15);
  border-radius: 5px;
  padding: 0.6rem 1rem;
}

.cobrinha-legenda {
  display: flex;
  gap: 0.9rem;
  padding-right: 1.2rem;
  border-right: 1px solid rgba(80,64,160,0.2);
}
.cobrinha-legenda-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--roxo-escuro);
  opacity: 0.85;
}
.cobrinha-legenda-cor {
  width: 10px;
  height: 10px;
  border-radius: 0;
  display: inline-block;
  box-shadow: 1px 1px 0 rgba(0,0,0,0.2);
}

.cobrinha-controles {
  display: flex;
  gap: 1.1rem;
  flex-wrap: wrap;
}
.cobrinha-tecla-grupo {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--roxo-escuro);
  opacity: 0.85;
}
.cobrinha-tecla-grupo kbd {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.66rem;
  background: var(--roxo-escuro);
  color: var(--creme);
  border-radius: 3px;
  padding: 2px 6px;
  box-shadow: 0 2px 0 rgba(40,30,90,0.5);
  line-height: 1.3;
}
.cobrinha-ou {
  font-size: 0.68rem;
  opacity: 0.6;
  margin: 0 2px;
}

@media (max-width: 560px) {
  .cobrinha-legenda {
    border-right: none;
    padding-right: 0;
    width: 100%;
    justify-content: center;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(80,64,160,0.15);
  }
}
</style>

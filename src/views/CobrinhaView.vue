<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BackLink from '../components/BackLink.vue'
import { showToast } from '../stores/toast.js'
import capeloIcon from '../assets/icons/graduation-cap.svg?raw'

const router = useRouter()

const CELL = 24
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

const comida = reactive({ x: 0, y: 0, especial: false })
const obstaculos = ref([])

const score = ref(0)
const recorde = ref(Number(localStorage.getItem('caesi_cobrinha_recorde') || 0))
const estado = ref('jogando') // 'jogando' | 'pausado' | 'fim'

let tickId = null
let velocidade = 130
let comidasComidas = 0

function celulaOcupada(x, y) {
  if (obstaculos.value.some(o => o.x === x && o.y === y)) return true
  return cobra.value.some(seg => seg.x === x && seg.y === y)
}

const CENTRO_X = Math.floor(COLS / 2)
const CENTRO_Y = Math.floor(ROWS / 2)

function pertoDoCentro(x, y) {
  return Math.abs(x - CENTRO_X) <= 4 && Math.abs(y - CENTRO_Y) <= 3
}

function posicaoLivre(evitarCentro = false) {
  let x, y
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
  } while (celulaOcupada(x, y) || (evitarCentro && pertoDoCentro(x, y)))
  return { x, y }
}

function reposicionarComida() {
  const livre = posicaoLivre()
  comida.x = livre.x
  comida.y = livre.y
  comida.especial = comidasComidas > 0 && comidasComidas % 6 === 0
}

function gerarObstaculos(qtd, evitarCentro = false) {
  const novos = []
  for (let i = 0; i < qtd; i++) {
    const p = posicaoLivre(evitarCentro)
    novos.push(p)
    obstaculos.value = [...obstaculos.value, p]
  }
  return novos
}

function iniciar() {
  cobra.value = [
    { x: CENTRO_X, y: CENTRO_Y },
    { x: CENTRO_X - 1, y: CENTRO_Y },
    { x: CENTRO_X - 2, y: CENTRO_Y },
  ]
  direcao.value = VETORES.direita
  filaDirecoes = []
  obstaculos.value = []
  score.value = 0
  comidasComidas = 0
  velocidade = 130
  estado.value = 'jogando'
  gerarObstaculos(6, true)
  reposicionarComida()
}

function reiniciar() {
  clearInterval(tickId)
  iniciar()
  tickId = setInterval(tick, velocidade)
}

function trocarVelocidade() {
  clearInterval(tickId)
  tickId = setInterval(tick, velocidade)
}

function tick() {
  if (estado.value !== 'jogando') return

  if (filaDirecoes.length) direcao.value = filaDirecoes.shift()
  const cabeca = cobra.value[0]
  const novaCabeca = { x: cabeca.x + direcao.value.x, y: cabeca.y + direcao.value.y }

  const bateuParede = novaCabeca.x < 0 || novaCabeca.x >= COLS || novaCabeca.y < 0 || novaCabeca.y >= ROWS
  const bateuObstaculo = obstaculos.value.some(o => o.x === novaCabeca.x && o.y === novaCabeca.y)
  const bateuNoProprioCorpo = cobra.value.some((seg, i) => i < cobra.value.length - 1 && seg.x === novaCabeca.x && seg.y === novaCabeca.y)

  if (bateuParede || bateuObstaculo || bateuNoProprioCorpo) {
    estado.value = 'fim'
    if (score.value > recorde.value) {
      recorde.value = score.value
      localStorage.setItem('caesi_cobrinha_recorde', String(recorde.value))
    }
    return
  }

  const comeu = novaCabeca.x === comida.x && novaCabeca.y === comida.y
  cobra.value = [novaCabeca, ...cobra.value]
  if (!comeu) {
    cobra.value.pop()
  } else {
    comidasComidas += 1
    if (comida.especial) {
      score.value += 30
      showToast('O professor Dalton aprovou sua manobra! +30', 'success')
    } else {
      score.value += 10
    }
    reposicionarComida()
    if (comidasComidas % 5 === 0) gerarObstaculos(1)
    velocidade = Math.max(65, 130 - comidasComidas * 3)
    trocarVelocidade()
  }
}

function onKeydown(e) {
  if (estado.value === 'fim' && (e.key === 'Enter' || e.key === 'r' || e.key === 'R')) { reiniciar(); return }
  if (e.key === 'Escape') { router.push('/'); return }
  if (e.key === 'p' || e.key === 'P') {
    if (e.repeat) return
    if (estado.value === 'jogando') estado.value = 'pausado'
    else if (estado.value === 'pausado') estado.value = 'jogando'
    return
  }
  const teclaNormalizada = e.key.length === 1 ? e.key.toLowerCase() : e.key
  const nomeDirecao = TECLA_PARA_DIRECAO[teclaNormalizada]
  if (!nomeDirecao) return
  const nova = VETORES[nomeDirecao]
  e.preventDefault()
  if (filaDirecoes.length >= 2) return
  const ultima = filaDirecoes.length ? filaDirecoes[filaDirecoes.length - 1] : direcao.value
  // impede reverter direto pro próprio pescoço, e ignora repetir a mesma direção
  if (nova.x === -ultima.x && nova.y === -ultima.y) return
  if (nova.x === ultima.x && nova.y === ultima.y) return
  filaDirecoes.push(nova)
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  iniciar()
  tickId = setInterval(tick, velocidade)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  clearInterval(tickId)
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
        <div class="cobrinha-hud">
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

      <div class="paper cobrinha-paper">
        <div class="cobrinha-area" :style="{ width: COLS * CELL + 'px', height: ROWS * CELL + 'px' }">
          <div
            v-for="o in obstaculos"
            :key="'o' + o.x + '-' + o.y"
            class="cobrinha-obstaculo"
            :style="{ left: o.x * CELL + 'px', top: o.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div
            class="cobrinha-comida"
            :class="{ 'cobrinha-comida--especial': comida.especial }"
            :style="{ left: comida.x * CELL + 'px', top: comida.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
            v-html="comida.especial ? capeloIcon : ''"
          ></div>

          <div
            v-for="(seg, i) in cobra"
            :key="'s' + i"
            class="cobrinha-segmento"
            :class="{ 'cobrinha-segmento--cabeca': i === 0 }"
            :style="{ left: seg.x * CELL + 'px', top: seg.y * CELL + 'px', width: CELL + 'px', height: CELL + 'px' }"
          ></div>

          <div v-if="estado === 'fim'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">A cobrinha foi capturada!</p>
            <p class="cobrinha-overlay-sub">
              Pontuação: {{ score }}
              <template v-if="score > 0 && score >= recorde"> — novo recorde!</template>
            </p>
            <button class="btn btn-amarelo" @click="reiniciar">Jogar de novo (Enter ou R)</button>
          </div>

          <div v-if="estado === 'pausado'" class="cobrinha-overlay">
            <p class="cobrinha-overlay-titulo">Pausado</p>
            <p class="cobrinha-overlay-sub">Aperte P pra continuar</p>
          </div>
        </div>

        <div class="cobrinha-info">
          <div class="cobrinha-legenda">
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--roxo)"></span>você</span>
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--amarelo)"></span>comida</span>
            <span class="cobrinha-legenda-item"><span class="cobrinha-legenda-cor" style="background:var(--vermelho)"></span>obstáculo</span>
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
    </div>
  </div>
</template>

<style scoped>
.cobrinha-hud {
  display: flex;
  align-items: center;
  gap: 0.7rem;
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
    linear-gradient(to right, rgba(80,64,160,0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(80,64,160,0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  border: 1px solid rgba(80,64,160,0.3);
  border-radius: 2px;
  overflow: hidden;
  max-width: 100%;
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
  border-radius: 3px;
  box-shadow: 2px 2px 0 var(--roxo-escuro);
}
.cobrinha-segmento--cabeca {
  z-index: 2;
  position: absolute;
}
.cobrinha-segmento--cabeca::before {
  background: var(--roxo-escuro);
  box-shadow: 2px 2px 0 var(--preto);
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
  inset: 3px;
  background: var(--amarelo);
  border-radius: 50%;
  box-shadow: 2px 2px 0 var(--roxo-escuro);
}
.cobrinha-comida--especial::before {
  background: var(--creme);
  border: 2px solid var(--amarelo);
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
  to   { transform: scale(1.2); }
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
  border-radius: 2px;
  box-shadow: 2px 2px 0 var(--preto);
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
  border-radius: 3px;
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

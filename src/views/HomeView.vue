<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { addMensagem } from '../stores/mensagens.js'
import { isAdmin } from '../stores/auth.js'
import { eventos, proximosEventos } from '../stores/calendario.js'
import { estruturas, CENTRO_PADRAO } from '../stores/mapa.js'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import calendarIcon from '../assets/icons/calendar.svg?raw'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function diaMes(data) {
  const [, mes, dia] = data.split('-').map(Number)
  return { dia, mes: MESES_ABREV[mes - 1] }
}

const form = ref({ tipo: '', periodo: '', mensagem: '', nome: '', email: '' })
const errors = ref({})
const charCount = ref(0)
const enviado = ref(false)
const protocolo = ref('')
const emailEnviado = ref(false)

function onInput(e) {
  charCount.value = e.target.value.length
}

function submit() {
  const e = {}
  if (!form.value.tipo)                       e.tipo = true
  if (!form.value.periodo.trim())             e.periodo = true
  if (form.value.mensagem.trim().length < 20) e.mensagem = true
  errors.value = e
  if (Object.keys(e).length === 0) {
    const nova = addMensagem({
      tipo:    form.value.tipo,
      periodo: form.value.periodo.trim(),
      corpo:   form.value.mensagem,
      nome:    form.value.nome.trim() || null,
      email:   form.value.email.trim() || null,
    })
    protocolo.value = nova.protocolo
    emailEnviado.value = !!form.value.email.trim()
    enviado.value = true
  }
}

function resetForm() {
  form.value = { tipo: '', periodo: '', mensagem: '', nome: '', email: '' }
  charCount.value = 0
  enviado.value = false
  emailEnviado.value = false
}

// ── Mapa do campus ──────────────────────────────────────
const route = useRoute()
const mapaEl = ref(null)
let mapa = null
const mapaMarkers = new Map()

const buscaMapa = ref('')
const estruturaModal = ref(null)
const imagemAtivaIdx = ref(0)

const resultadosBusca = computed(() => {
  const t = buscaMapa.value.toLowerCase().trim()
  if (!t) return []
  return estruturas.value.filter(e => e.nome.toLowerCase().includes(t))
})

function rotaUrl(e) {
  return `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
}

function abrirEstrutura(e) {
  estruturaModal.value = e
  imagemAtivaIdx.value = 0
  if (mapa) {
    mapa.flyTo([e.lat, e.lng], 18, { duration: 0.6 })
  }
}

function fecharModal() { estruturaModal.value = null }

function renderMapaMarkers() {
  if (!mapa) return
  mapaMarkers.forEach(m => m.remove())
  mapaMarkers.clear()
  for (const e of estruturas.value) {
    const marker = L.marker([e.lat, e.lng]).addTo(mapa)
    marker.on('click', () => abrirEstrutura(e))
    mapaMarkers.set(e.id, marker)
  }
}

onMounted(() => {
  if (!mapaEl.value) return
  mapa = L.map(mapaEl.value).setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapa)
  renderMapaMarkers()

  // Vindo de um link "Ver localização" (Professores/Laboratórios): abre a modal direto.
  const estruturaId = Number(route.query.estrutura)
  if (estruturaId) {
    const alvo = estruturas.value.find(e => e.id === estruturaId)
    if (alvo) abrirEstrutura(alvo)
  }
})

watch(estruturas, () => renderMapaMarkers())

onBeforeUnmount(() => { mapa?.remove() })

// ── Calendário ────────────────────────────────────────────
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES_EXT   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const padCal = n => String(n).padStart(2, '0')
const fmtISOCal = d => `${d.getFullYear()}-${padCal(d.getMonth() + 1)}-${padCal(d.getDate())}`

const agoraCal = new Date()
const anoAtualCal = ref(agoraCal.getFullYear())
const mesAtualCal = ref(agoraCal.getMonth())
const hojeISOCal  = fmtISOCal(agoraCal)

function mesAnteriorCal() {
  if (mesAtualCal.value === 0) { mesAtualCal.value = 11; anoAtualCal.value-- } else mesAtualCal.value--
}
function mesSeguinteCal() {
  if (mesAtualCal.value === 11) { mesAtualCal.value = 0; anoAtualCal.value++ } else mesAtualCal.value++
}

const eventosPorDiaCal = computed(() => {
  const mapa = {}
  for (const e of eventos.value) {
    if (!mapa[e.data]) mapa[e.data] = []
    mapa[e.data].push(e)
  }
  return mapa
})

const celulasCal = computed(() => {
  const primeiroDia = new Date(anoAtualCal.value, mesAtualCal.value, 1)
  const offset = primeiroDia.getDay()
  const inicio = new Date(anoAtualCal.value, mesAtualCal.value, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const iso = fmtISOCal(d)
    return {
      iso,
      dia: d.getDate(),
      outroMes: d.getMonth() !== mesAtualCal.value,
      hoje: iso === hojeISOCal,
      eventos: eventosPorDiaCal.value[iso] ?? [],
    }
  })
})

const buscaCalendario = ref('')
const resultadosBuscaCalendario = computed(() => {
  const t = buscaCalendario.value.toLowerCase().trim()
  if (!t) return []
  return eventos.value.filter(e => e.nome.toLowerCase().includes(t))
})

// Preenche os quadradinhos vazios com eventos passados recentes quando
// não há próximos suficientes, pra seção nunca ficar com sobra de espaço.
const passadosCal = computed(() =>
  eventos.value
    .filter(e => e.data < hojeISOCal)
    .sort((a, b) => b.data.localeCompare(a.data))
)

const teasersRealCal = computed(() => {
  const prox = proximosEventos.value.slice(0, 6).map(e => ({ ...e, passado: false }))
  if (prox.length >= 6) return prox
  const passadosPreenchimento = passadosCal.value.slice(0, 6 - prox.length).map(e => ({ ...e, passado: true }))
  return [...prox, ...passadosPreenchimento]
})

// Completa até 6 quadradinhos com placeholders vazios (sem esticar/centralizar
// o pouco conteúdo real) quando há menos de 6 eventos reais no total.
const teasersGridCal = computed(() => {
  const reais = teasersRealCal.value
  if (reais.length === 0) return []
  const faltam = 6 - reais.length
  const placeholders = Array.from({ length: faltam }, (_, i) => ({ id: `placeholder-${i}`, placeholder: true }))
  return [...reais, ...placeholders]
})

const eventoModal = ref(null)
const diaModal = ref(null)

function abrirEvento(e) {
  diaModal.value = null
  eventoModal.value = e
}
function abrirDia(celula) {
  if (celula.eventos.length === 0) return
  if (celula.eventos.length === 1) { abrirEvento(celula.eventos[0]); return }
  diaModal.value = celula
}
function fecharEventoModal() { eventoModal.value = null }
function fecharDiaModal() { diaModal.value = null }

function formatDataExtCal(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${dia} de ${MESES_EXT[mes - 1]} de ${ano}`
}

function baixarIcs(evento) {
  const [ano, mes, dia] = evento.data.split('-')
  const dtstart = `${ano}${mes}${dia}`
  const uid = `evento-${evento.id}@caesi.ufcg`
  const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CAESI UFCG//Calendario//PT-BR',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstart}T000000Z`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${esc(evento.nome)}`,
    `DESCRIPTION:${esc(evento.descricao)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${evento.nome.toLowerCase().replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Modais: fechar com Esc e travar o scroll enquanto algum estiver aberto ──
useEscapeKey(() => { fecharModal(); fecharEventoModal(); fecharDiaModal() })

const algumModalAberto = computed(() => !!estruturaModal.value || !!eventoModal.value || !!diaModal.value)
watch(algumModalAberto, (aberto) => {
  document.body.style.overflow = aberto ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })

// ── Carrossel do Instagram (setas + arraste no clique) ───────
const instaScrollEl = ref(null)
const instaDragging = ref(false)
let instaStartX = 0
let instaScrollStart = 0
let instaMoved = false

function instaScrollBy(dir) {
  const el = instaScrollEl.value
  if (!el) return
  const card = el.querySelector('.insta-card')
  const passo = card ? card.offsetWidth + 16 : 260
  const maxScroll = el.scrollWidth - el.clientWidth

  // Carrossel cíclico: no fim, "próximo" volta pro início (e vice-versa).
  if (dir > 0 && el.scrollLeft >= maxScroll - 20) {
    el.scrollTo({ left: 0, behavior: 'smooth' })
    return
  }
  if (dir < 0 && el.scrollLeft <= 20) {
    el.scrollTo({ left: maxScroll, behavior: 'smooth' })
    return
  }
  el.scrollBy({ left: dir * passo, behavior: 'smooth' })
}

function instaDragStart(e) {
  if (!instaScrollEl.value) return
  instaDragging.value = true
  instaMoved = false
  instaStartX = e.pageX
  instaScrollStart = instaScrollEl.value.scrollLeft
}
function instaDragMove(e) {
  if (!instaDragging.value) return
  const dx = e.pageX - instaStartX
  if (Math.abs(dx) > 4) instaMoved = true
  instaScrollEl.value.scrollLeft = instaScrollStart - dx
}
function instaDragEnd() {
  instaDragging.value = false
}
function instaClickGuard(e) {
  if (instaMoved) { e.preventDefault(); instaMoved = false }
}

const posts = [
  { cor: 'rgba(80,64,160,0.28)',  icon: '📢', caption: 'Semana de Boas-Vindas 2026! Recepção aos calouros de CC — sábado, 8h, no SPLAB. Venha com a galera!', data: '12 mai' },
  { cor: 'rgba(245,197,66,0.32)', icon: '🏆', caption: 'Parabéns ao time que representou a UFCG na Maratona de Programação ICPC! Orgulho do CAESI.', data: '3 mai' },
  { cor: 'rgba(78,170,119,0.28)', icon: '📌', caption: 'Seletivo CAESI 2026.1 aberto! Inscrições até 15/02. Venha fazer parte da gestão.', data: '28 abr' },
  { cor: 'rgba(217,85,85,0.22)',  icon: '🎓', caption: 'Formatura 2025.2 — celebrando mais uma turma de bacharéis em Ciência da Computação pela UFCG!', data: '10 abr' },
  { cor: 'rgba(40,160,140,0.28)', icon: '💡', caption: 'Palestra: IA Generativa na Prática. Quinta-feira, 14h, auditório da CEEI. Entrada franca.', data: '2 abr' },
  { cor: 'rgba(180,80,160,0.22)', icon: '🤝', caption: 'Feira de Estágios CAESI — conheça oportunidades em empresas parceiras. Próxima semana!', data: '24 mar' },
]
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.4rem;opacity:0.35;">✦</div>
    <div class="deco-star" style="top:420px;left:1.5%;font-size:0.9rem;opacity:0.25;">✦</div>
    <div class="deco-star" style="top:750px;right:3%;font-size:1.1rem;opacity:0.3;">✦</div>

    <Navbar />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-logo">
        <img src="/logo_caesi.png" alt="CAESI" style="width:100%;height:100%;object-fit:cover;display:block;">
      </div>
      <h1 class="hero-title">CAESI <span>Ouvidoria</span></h1>
      <p class="hero-sub">
        Fale com o Centro Acadêmico de Ciência da Computação da UFCG.<br>
        Envie sugestões, reclamações e elogios de forma anônima.
      </p>
      <div class="hero-actions">
        <a href="#enviar" class="btn btn-amarelo">Enviar mensagem →</a>
        <RouterLink to="/ouvidoria/consulta" class="btn btn-outline btn-outline-creme">
          Consultar protocolo →
        </RouterLink>
      </div>
    </section>

    <!-- Como funciona -->
    <section class="home-section">
      <div class="section-label">Ouvidoria</div>
      <h2 class="section-title">Como <span>funciona</span></h2>
      <div class="steps-grid">
        <div class="step-card">
          <span class="step-number">1</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </span>
          <div class="step-title">Escreva sua mensagem</div>
          <p class="step-desc">Preencha o formulário abaixo com o assunto, categoria e detalhes do que aconteceu.</p>
        </div>
        <div class="step-card">
          <span class="step-number">2</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </span>
          <div class="step-title">O CAESI recebe</div>
          <p class="step-desc">Nossa equipe lê e analisa cada mensagem com atenção. Você recebe um número de protocolo.</p>
        </div>
        <div class="step-card">
          <span class="step-number">3</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <div class="step-title">Acompanhe o status</div>
          <p class="step-desc">Use o número de protocolo para consultar o status e ver a resposta do CAESI a qualquer momento.</p>
        </div>
      </div>
    </section>

    <!-- Formulário de envio -->
    <section class="home-section" id="enviar" style="scroll-margin-top:80px;">
      <div class="section-label">Envio direto</div>
      <h2 class="section-title">Enviar <span>mensagem</span></h2>

      <div class="paper">

        <div v-if="enviado" class="anon-success">
          <div class="check-circle">✓</div>
          <h3 style="font-family:'Archivo Black',sans-serif;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
            Ticket enviado!
          </h3>
          <p style="font-size:0.9rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
            Guarde o protocolo abaixo para acompanhar o andamento e ver a resposta do CAESI.
            <template v-if="emailEnviado"> O protocolo também será enviado para o seu e-mail.</template>
          </p>
          <div class="protocolo-box">
            <div class="protocolo-label">Protocolo</div>
            <div class="protocolo-value">{{ protocolo }}</div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:1.2rem;">
            <RouterLink :to="`/ouvidoria/consulta?protocolo=${encodeURIComponent(protocolo)}`" class="btn btn-primary btn-sm">Consultar status →</RouterLink>
            <button class="btn btn-outline btn-sm" @click="resetForm">Enviar outro ticket</button>
          </div>
        </div>

        <div v-else-if="isAdmin" class="admin-no-msg">
          <div>
            <p class="admin-no-msg-title">Administradores não enviam tickets pela ouvidoria.</p>
            <p class="admin-no-msg-sub">Use o painel para gerenciar os tickets recebidos.</p>
          </div>
          <RouterLink to="/admin/mensagens" class="btn btn-outline btn-sm">
            Ir ao painel →
          </RouterLink>
        </div>

        <template v-else>
          <div class="alert-info">
            A identificação é <strong style="color:var(--roxo-escuro);">opcional</strong>.
            Após o envio você receberá um número de protocolo para acompanhar o status e a resposta do CAESI.
          </div>

          <form @submit.prevent="submit" novalidate>
            <div class="field">
              <label>Tipo de relato *</label>
              <select v-model="form.tipo" :class="{ invalid: errors.tipo }">
                <option value="" disabled>Selecione o tipo de relato</option>
                <option value="disciplina">Disciplina</option>
                <option value="professores">Professores</option>
                <option value="colegas">Colegas de curso</option>
                <option value="infraestrutura">Infraestrutura</option>
                <option value="ofertas">Ofertas e horários</option>
                <option value="grupos">Grupos estudantis</option>
                <option value="outros">Outros</option>
              </select>
              <span class="error-msg" role="alert">Selecione o tipo de relato.</span>
            </div>

            <div class="field">
              <label>
                Período em que ocorreu *
                <span class="field-hint">(ex.: 2025.2)</span>
              </label>
              <input v-model="form.periodo" type="text" placeholder="Ex.: 2025.2" maxlength="20"
                :class="{ invalid: errors.periodo }">
              <span class="error-msg" role="alert">Informe o período em que o problema ocorreu.</span>
            </div>

            <div class="field">
              <label>
                Mensagem *
                <span class="field-hint">(mín. 20 caracteres)</span>
              </label>
              <textarea
                v-model="form.mensagem"
                placeholder="Descreva com detalhes o que aconteceu ou o que você sugere…"
                rows="5"
                maxlength="2000"
                :class="{ invalid: errors.mensagem }"
                @input="onInput"
              ></textarea>
              <span class="error-msg" role="alert">
                {{ form.mensagem.trim().length === 0 ? 'A mensagem não pode estar vazia.' : 'Mínimo 20 caracteres.' }}
              </span>
              <div class="char-counter" :class="{ warn: charCount > 1800 }">{{ charCount }} / 2000</div>
            </div>

            <div class="field-section">
              <p class="label-sm">Identificação <span class="field-hint" style="font-size:0.8rem;text-transform:none;letter-spacing:0;">(opcional)</span></p>
              <p style="font-size:0.82rem;color:var(--cinza);margin-bottom:1rem;line-height:1.6;">
                Se identificado, o protocolo será enviado ao seu e-mail e você será notificado sobre atualizações.
              </p>
              <div class="ident-row">
                <div class="field">
                  <label>Nome</label>
                  <input v-model="form.nome" type="text" placeholder="Seu nome completo" maxlength="100">
                </div>
                <div class="field">
                  <label>E-mail</label>
                  <input v-model="form.email" type="email" placeholder="seu@email.com">
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-amarelo">Enviar ticket →</button>
            </div>
          </form>
        </template>
      </div>
    </section>

    <!-- Calendário -->
    <section class="home-section" id="calendario" style="scroll-margin-top:80px;">
      <div class="section-label">Agenda</div>
      <h2 class="section-title">Calendário do <span>CAESI</span></h2>

      <div class="cal-home-layout">
        <!-- Próximos eventos: quadradinhos à esquerda -->
        <div class="cal-home-teasers-col">
          <p class="cal-home-teasers-titulo">Eventos próximos</p>
          <div class="cal-home-teasers" :class="{ 'cal-home-teasers--vazio': teasersRealCal.length === 0 }">
            <div v-if="teasersRealCal.length === 0" class="cal-home-vazio">
              <span class="cal-home-vazio-icon" v-html="calendarIcon"></span>
              <p>Nenhum evento por aqui ainda.</p>
              <span>Fique de olho — novidades aparecem nesse espaço.</span>
            </div>
            <button
              v-for="e in teasersGridCal" :key="e.id"
              class="evento-teaser"
              :class="{ 'evento-teaser--passado': e.passado, 'evento-teaser--placeholder': e.placeholder }"
              :disabled="e.placeholder"
              @click="!e.placeholder && abrirEvento(e)"
            >
              <template v-if="!e.placeholder">
                <div class="evento-teaser-data">
                  <span class="evento-teaser-dia">{{ diaMes(e.data).dia }}</span>
                  <span class="evento-teaser-mes">{{ diaMes(e.data).mes }}</span>
                </div>
                <div class="evento-teaser-nome">{{ e.nome }}</div>
              </template>
              <span v-else class="evento-teaser-placeholder-dot"></span>
            </button>
          </div>
        </div>

        <!-- Grade de mês + busca à direita -->
        <div class="paper cal-home-paper">
          <input
            v-model="buscaCalendario" type="search" class="mapa-home-search"
            placeholder="Buscar evento…"
          >
          <div v-if="resultadosBuscaCalendario.length > 0" class="mapa-home-resultados">
            <button
              v-for="e in resultadosBuscaCalendario" :key="e.id"
              class="mapa-home-resultado-item"
              @click="abrirEvento(e); buscaCalendario = ''"
            >{{ e.nome }}</button>
          </div>
          <div v-else-if="buscaCalendario.trim()" class="mapa-home-resultados">
            <span class="mapa-home-sem-resultado">Nenhum evento encontrado.</span>
          </div>

          <div class="cal-home-header">
            <button class="cal-home-nav-btn" @click="mesAnteriorCal" aria-label="Mês anterior">←</button>
            <div class="cal-home-titulo">{{ MESES_EXT[mesAtualCal] }} {{ anoAtualCal }}</div>
            <button class="cal-home-nav-btn" @click="mesSeguinteCal" aria-label="Próximo mês">→</button>
          </div>

          <div class="cal-home-semana">
            <span v-for="d in DIAS_SEMANA" :key="d">{{ d }}</span>
          </div>
          <div class="cal-home-dias">
            <button
              v-for="c in celulasCal" :key="c.iso"
              class="cal-home-dia"
              :class="{ 'cal-home-dia--outro-mes': c.outroMes, 'cal-home-dia--hoje': c.hoje, 'cal-home-dia--com-evento': c.eventos.length > 0 }"
              :disabled="c.eventos.length === 0"
              @click="abrirDia(c)"
            >
              {{ c.dia }}
              <span v-if="c.eventos.length > 0" class="cal-home-dia-dot"></span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Mapa do campus -->
    <section class="home-section" id="mapa" style="scroll-margin-top:80px;">
      <div class="section-label">Onde fica</div>
      <h2 class="section-title">Mapa do <span>campus</span></h2>

      <div class="paper" style="padding:1.2rem;">
        <input
          v-model="buscaMapa" type="search" class="mapa-home-search"
          placeholder="Buscar estrutura… (ex.: Bloco CP, auditório)"
        >
        <div v-if="resultadosBusca.length > 0" class="mapa-home-resultados">
          <button
            v-for="e in resultadosBusca" :key="e.id"
            class="mapa-home-resultado-item"
            @click="abrirEstrutura(e); buscaMapa = ''"
          >{{ e.nome }}</button>
        </div>
        <div v-else-if="buscaMapa.trim()" class="mapa-home-resultados">
          <span class="mapa-home-sem-resultado">Nenhuma estrutura encontrada.</span>
        </div>

        <div ref="mapaEl" class="mapa-home-leaflet"></div>
        <p style="font-size:0.78rem;color:var(--cinza);margin-top:0.8rem;">
          Clique num ponto do mapa pra ver os detalhes da estrutura.
        </p>
      </div>
    </section>

    <!-- Instagram -->
    <section class="home-section">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:2rem;flex-wrap:wrap;gap:12px;">
        <div>
          <div class="section-label">Redes sociais</div>
          <h2 class="section-title" style="margin-bottom:0;">Últimas do <span>Instagram</span></h2>
        </div>
        <a href="https://instagram.com/caesiufcg" target="_blank" rel="noopener"
          class="btn btn-outline btn-sm btn-outline-creme">
          Ver perfil →
        </a>
      </div>
      <div class="insta-carrossel">
        <button class="insta-nav-btn insta-nav-btn--prev" aria-label="Posts anteriores" @click="instaScrollBy(-1)">&lt;</button>

        <div
          ref="instaScrollEl"
          class="insta-grid"
          :class="{ 'insta-grid--arrastando': instaDragging }"
          @mousedown="instaDragStart"
          @mousemove="instaDragMove"
          @mouseup="instaDragEnd"
          @mouseleave="instaDragEnd"
        >
          <a v-for="(post, i) in posts" :key="i"
            href="https://instagram.com/caesiufcg" target="_blank" rel="noopener"
            class="insta-card"
            @click="instaClickGuard"
            @dragstart.prevent>
            <div class="insta-thumb" :style="{ background: post.cor }">{{ post.icon }}</div>
            <div class="insta-caption">{{ post.caption }}</div>
            <div class="insta-date">{{ post.data }}</div>
          </a>
        </div>

        <button class="insta-nav-btn insta-nav-btn--next" aria-label="Próximos posts" @click="instaScrollBy(1)">&gt;</button>
      </div>
    </section>

    <SiteFooter />

    <!-- Modal: detalhe da estrutura -->
    <Teleport to="body">
      <div v-if="estruturaModal" class="modal-overlay" @click.self="fecharModal">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-estrutura-title" v-focus-trap>
          <div class="modal-title" id="modal-estrutura-title">{{ estruturaModal.nome }}</div>
          <div class="modal-body">
            <div v-if="estruturaModal.imagens?.length" class="mapa-modal-galeria">
              <img :src="estruturaModal.imagens[imagemAtivaIdx]" :alt="estruturaModal.nome" class="mapa-modal-hero">
              <div v-if="estruturaModal.imagens.length > 1" class="mapa-modal-thumbs">
                <button
                  v-for="(img, i) in estruturaModal.imagens" :key="i"
                  class="mapa-modal-thumb-btn"
                  :class="{ 'mapa-modal-thumb-btn--ativo': i === imagemAtivaIdx }"
                  @click="imagemAtivaIdx = i"
                >
                  <img :src="img" :alt="`Imagem ${i + 1}`" class="mapa-modal-thumb-img">
                </button>
              </div>
            </div>
            <p v-if="estruturaModal.descricao">{{ estruturaModal.descricao }}</p>
            <p v-else style="color:var(--cinza);font-style:italic;">Sem descrição cadastrada.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="fecharModal">Fechar</button>
            <a :href="rotaUrl(estruturaModal)" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
              Ver rota →
            </a>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: detalhe de um evento -->
    <Teleport to="body">
      <div v-if="eventoModal" class="modal-overlay" @click.self="fecharEventoModal">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-evento-title" v-focus-trap>
          <div class="modal-title" id="modal-evento-title">{{ eventoModal.nome }}</div>
          <div class="modal-body">
            <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:0.6rem;">{{ formatDataExtCal(eventoModal.data) }}</p>
            <p v-if="eventoModal.descricao">{{ eventoModal.descricao }}</p>
            <p v-else style="color:var(--cinza);font-style:italic;">Sem descrição cadastrada.</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="fecharEventoModal">Fechar</button>
            <RouterLink v-if="eventoModal.formularioId" :to="`/formularios/${eventoModal.formularioId}`" class="btn btn-outline btn-sm">
              Ver formulário →
            </RouterLink>
            <button class="btn btn-primary btn-sm" @click="baixarIcs(eventoModal)">
              <span class="btn-icon" v-html="calendarIcon"></span> Adicionar ao calendário
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: lista de eventos de um dia -->
    <Teleport to="body">
      <div v-if="diaModal" class="modal-overlay" @click.self="fecharDiaModal">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-dia-title" v-focus-trap>
          <div class="modal-title" id="modal-dia-title">{{ formatDataExtCal(diaModal.iso) }}</div>
          <div class="modal-body">
            <button
              v-for="e in diaModal.eventos" :key="e.id"
              class="cal-home-dia-evento-item"
              @click="abrirEvento(e)"
            >{{ e.nome }}</button>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="fecharDiaModal">Fechar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

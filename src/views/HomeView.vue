<script setup>
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import CalendarioSecao from '../components/CalendarioSecao.vue'
import MapaSecao from '../components/MapaSecao.vue'
import calendarIcon from '../assets/icons/calendar.svg?raw'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'

// ── Carrossel do Instagram (setas + arraste no clique) ───────
import { ref } from 'vue'
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

    <!-- Introdução -->
    <section class="home-hero-full">
      <div class="hero">
        <div class="hero-brand">
          <div class="hero-logo">
            <img src="/logo_caesi.png" alt="CAESI" style="width:100%;height:100%;object-fit:cover;display:block;">
          </div>
          <div class="hero-kicker">Centro Acadêmico · Ciência da Computação · UFCG</div>
          <h1 class="hero-title">Bem-vindo ao <span>CAESI</span></h1>
        </div>

        <div class="hero-divider"></div>

        <p class="hero-sub">
          Criado para descomplicar a vida do estudante e dar transparência à
          gestão, o portal do CAESI reúne mural, calendário, mapa do campus e
          muito mais em um só lugar — incluindo uma <strong>Ouvidoria</strong>
          direta via tickets pra qualquer demanda acadêmica.
        </p>

        <div class="steps-grid hero-steps">
          <a href="#calendario" class="step-card">
            <span class="step-icon" v-html="calendarIcon"></span>
            <div class="step-title">Calendário</div>
            <p class="step-desc">Fique por dentro dos eventos e prazos do curso, sempre atualizados.</p>
          </a>
          <a href="#mapa" class="step-card">
            <span class="step-icon" v-html="mapPinIcon"></span>
            <div class="step-title">Mapa do campus</div>
            <p class="step-desc">Encontre salas, laboratórios e blocos sem se perder pela UFCG.</p>
          </a>
          <a href="#instagram" class="step-card">
            <span class="step-icon" v-html="instagramIcon"></span>
            <div class="step-title">Instagram</div>
            <p class="step-desc">Acompanhe avisos, fotos e novidades do dia a dia do CAESI.</p>
          </a>
        </div>
      </div>
    </section>

    <!-- Instagram -->
    <section class="home-section" id="instagram" style="scroll-margin-top: 80px;">
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
          tabindex="0"
          role="region"
          aria-label="Carrossel de posts do Instagram"
          @mousedown="instaDragStart"
          @mousemove="instaDragMove"
          @mouseup="instaDragEnd"
          @mouseleave="instaDragEnd"
          @keydown.left="instaScrollBy(-1)"
          @keydown.right="instaScrollBy(1)"
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

    <!-- Calendário -->
    <div id="calendario" style="scroll-margin-top: 80px;">
      <CalendarioSecao />
    </div>

    <!-- Mapa do campus -->
    <div id="mapa" style="scroll-margin-top: 80px;">
      <MapaSecao />
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.home-hero-full {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-hero-full .hero {
  max-width: 800px;
  padding: 2rem;
}

.home-hero-full .hero-logo {
  width: 180px;
  height: 180px;
  cursor: pointer;
  transition: transform 0.2s;
}
.home-hero-full .hero-logo:hover {
  transform: translateY(-4px);
}

.hero-brand .hero-title {
  cursor: pointer;
  display: inline-block;
  transition: transform 0.2s;
}
.hero-brand .hero-title:hover {
  transform: translateY(-4px);
}

.hero-kicker {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--amarelo);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  margin-bottom: 1rem;
  display: inline-block;
  cursor: pointer;
  transition: transform 0.2s;
}
.hero-kicker:hover {
  transform: translateY(-4px);
}

.hero-divider {
  width: 48px;
  height: 4px;
  background: var(--amarelo);
  border-radius: 2px;
  margin: 0 auto 1rem;
}

.home-hero-full .hero-sub {
  color: rgba(242,230,196,0.8);
  font-weight: 500;
  margin-bottom: 2rem;
  text-align: justify;
}

.home-hero-full .hero-sub strong {
  color: var(--amarelo);
}

.hero-steps {
  text-decoration: none;
}
.hero-steps .step-card {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.hero-steps .step-icon :deep(svg) {
  width: 36px;
  height: 36px;
  stroke: currentColor;
}

@media (max-width: 640px) {
  .home-hero-full .hero-logo { width: 116px; height: 116px; }
  .hero-kicker { font-size: 0.68rem; letter-spacing: 0.1em; }
}
</style>

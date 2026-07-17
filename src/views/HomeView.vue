<script setup>
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import CalendarioSecao from '../components/CalendarioSecao.vue'
import calendarIcon from '../assets/icons/calendar.svg?raw'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
import bellIcon from '../assets/icons/bell.svg?raw'
import bookOpenIcon from '../assets/icons/book-open.svg?raw'
import messageIcon from '../assets/icons/message.svg?raw'
import clipboardIcon from '../assets/icons/clipboard.svg?raw'
import usersIcon from '../assets/icons/users.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'

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
          <a href="#contato" class="step-card">
            <span class="step-icon" v-html="mailIcon"></span>
            <div class="step-title">Fale com o CAESI</div>
            <p class="step-desc">Sala, e-mail e grupos da comunidade — veja como nos encontrar.</p>
          </a>
          <a href="#instagram" class="step-card">
            <span class="step-icon" v-html="instagramIcon"></span>
            <div class="step-title">Instagram</div>
            <p class="step-desc">Acompanhe avisos, fotos e novidades do dia a dia do CAESI.</p>
          </a>
        </div>
      </div>
    </section>

    <!-- Explore o site -->
    <section class="home-section">
      <div class="section-label">Explore o site</div>
      <h2 class="section-title">Tudo o que o <span>CAESI</span> oferece</h2>

      <div class="explore-list">
        <RouterLink to="/mural" class="explore-item">
          <div class="explore-icon explore-icon--roxo" v-html="bellIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Fique por dentro de tudo</h3>
            <p class="explore-desc">
              Acompanhe editais de monitoria, vagas de estágio, convocações
              para assembleias e comunicados oficiais da coordenação e do CAESI.
            </p>
            <span class="explore-cta">Acessar o Mural →</span>
          </div>
        </RouterLink>

        <RouterLink to="/informacoes" class="explore-item">
          <div class="explore-icon explore-icon--amarelo" v-html="bookOpenIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Sobrevivendo à Computação</h3>
            <p class="explore-desc">
              Guias práticos sobre disciplinas, professores, ementas e tudo o
              que você precisa saber para não ficar perdido no curso.
            </p>
            <span class="explore-cta">Ver Informações →</span>
          </div>
        </RouterLink>

        <RouterLink to="/ouvidoria" class="explore-item">
          <div class="explore-icon explore-icon--roxo" v-html="messageIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Sua voz no CAESI</h3>
            <p class="explore-desc">
              Problema em disciplina, infraestrutura dos laboratórios ou uma
              sugestão? Abra um ticket anônimo ou identificado com a gestão.
            </p>
            <span class="explore-cta">Falar com a Ouvidoria →</span>
          </div>
        </RouterLink>

        <RouterLink to="/formularios" class="explore-item">
          <div class="explore-icon explore-icon--amarelo" v-html="clipboardIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Burocracia descomplicada</h3>
            <p class="explore-desc">
              Links rápidos para trancamento, aproveitamento de disciplinas,
              reserva de salas e outras solicitações do departamento.
            </p>
            <span class="explore-cta">Ver Formulários →</span>
          </div>
        </RouterLink>

        <RouterLink to="/sobre" class="explore-item">
          <div class="explore-icon explore-icon--roxo" v-html="usersIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Quem faz o CAESI acontecer</h3>
            <p class="explore-desc">
              A gestão atual, o histórico de chapas, nossa missão e o
              estatuto do Centro Acadêmico — e como falar direto com a gente.
            </p>
            <span class="explore-cta">Ver Sobre Nós →</span>
          </div>
        </RouterLink>

        <RouterLink to="/mapa" class="explore-item">
          <div class="explore-icon explore-icon--amarelo" v-html="mapPinIcon"></div>
          <div class="explore-card">
            <h3 class="explore-title">Não se perca no campus</h3>
            <p class="explore-desc">
              Mapa interativo da UFCG com blocos, laboratórios e pontos de
              referência — busque um local e trace sua rota até lá.
            </p>
            <span class="explore-cta">Ver Mapa do Campus →</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Calendário -->
    <div id="calendario" style="scroll-margin-top: 80px;">
      <CalendarioSecao />
    </div>

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

    <!-- Contato -->
    <section class="home-section" id="contato" style="scroll-margin-top: 80px;">
      <div class="section-label">Contato</div>
      <h2 class="section-title" style="margin-bottom:0.6rem;">Fale com o <span>CAESI</span></h2>
      <p class="contato-sub">Dúvidas, parcerias ou só quer tomar um café? Veja como nos encontrar:</p>

      <div class="steps-grid">
        <div class="step-card">
          <span class="step-icon" v-html="mapPinIcon"></span>
          <div class="step-title">Dê uma passada lá!</div>
          <p class="step-desc">
            Nossa sala fica no Bloco CP. Sempre tem alguém da gestão por lá
            pra trocar uma ideia ou ajudar com o que precisar.
          </p>
        </div>

        <div class="step-card">
          <span class="step-icon" v-html="mailIcon"></span>
          <div class="step-title">Assuntos formais</div>
          <p class="step-desc">
            Para parcerias, convites institucionais e assuntos mais sérios,
            manda um e-mail pra gente.
          </p>
          <a href="mailto:caesi@ccc.ufcg.edu.br" class="contato-cta">caesi@ccc.ufcg.edu.br</a>
        </div>

        <div class="step-card">
          <span class="step-icon" v-html="messageIcon"></span>
          <div class="step-title">Redes e grupos</div>
          <p class="step-desc">
            Faça parte dos nossos grupos de comunicação pra não perder
            nenhum aviso de última hora.
          </p>
          <a href="#" class="contato-cta">Entrar na Comunidade →</a>
        </div>
      </div>
    </section>

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

/* ── Explore o site ───────────────────────────────────────── */
.explore-list {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.explore-item {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  text-decoration: none;
  color: inherit;
}

.explore-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.explore-icon :deep(svg) {
  width: 28px;
  height: 28px;
  stroke: currentColor;
}
.explore-icon--roxo    { background: var(--roxo-escuro); color: var(--amarelo); }
.explore-icon--amarelo { background: var(--amarelo);      color: var(--preto); }

.explore-item:hover .explore-icon {
  transform: translateY(-4px);
  box-shadow: 6px 6px 0 rgba(0,0,0,0.3);
}

.explore-card {
  flex: 1;
  min-width: 0;
  background: var(--creme);
  border-radius: 2px;
  padding: 0.9rem 1.2rem;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  transition: transform 0.15s, box-shadow 0.15s;
}
.explore-item:hover .explore-card {
  transform: translateY(-2px);
  box-shadow: 4px 5px 0 var(--roxo-escuro);
}

.explore-title {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  color: var(--roxo-escuro);
  margin-bottom: 0.3rem;
}
.explore-desc {
  font-size: 0.86rem;
  color: var(--preto);
  opacity: 0.75;
  line-height: 1.5;
  margin-bottom: 0.4rem;
}
.explore-cta {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--roxo-escuro);
  letter-spacing: 0.02em;
}

@media (max-width: 640px) {
  .explore-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  .explore-icon { width: 64px; height: 64px; }
  .explore-icon :deep(svg) { width: 30px; height: 30px; }
}

/* ── Contato ──────────────────────────────────────────────── */
.contato-sub {
  font-size: 0.95rem;
  color: rgba(242,230,196,0.8);
  margin-bottom: 1.8rem;
}

.contato-cta {
  display: inline-block;
  margin-top: 0.6rem;
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--roxo-escuro);
  text-decoration: none;
  word-break: break-word;
}
.contato-cta:hover {
  text-decoration: underline;
}
</style>

<script setup>
import { ref } from 'vue'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import CalendarioSecao from '../components/CalendarioSecao.vue'
import MapaSecao from '../components/MapaSecao.vue'
import { addMensagem } from '../stores/mensagens.js'
import { isAdmin } from '../stores/auth.js'

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
    <CalendarioSecao />

    <!-- Mapa do campus -->
    <MapaSecao />

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

  </div>
</template>

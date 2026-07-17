<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { membros, descricaoGestao, gestaoInfo, periodoFormatado, historicoGestoes, historicoVisivel, missaoTexto, contatoInfo } from '../stores/equipe.js'
import { CENTRO_PADRAO } from '../stores/mapa.js'
import { markdownParaHtmlSeguro } from '../utils/markdown.js'

const missaoHtml = computed(() => markdownParaHtmlSeguro(missaoTexto.value))
function descricaoHtml(texto) { return markdownParaHtmlSeguro(texto) }

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const expandido = ref(null)
function toggleGestao(id) { expandido.value = expandido.value === id ? null : id }

import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
import cameraIcon from '../assets/icons/camera.svg?raw'

const mapaMiniEl = ref(null)
let mapaMini = null

onMounted(() => {
  if (!mapaMiniEl.value) return
  mapaMini = L.map(mapaMiniEl.value, {
    zoomControl: false,
    scrollWheelZoom: false,
  }).setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 17)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapaMini)
  L.marker([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng]).addTo(mapaMini)
})

onBeforeUnmount(() => { mapaMini?.remove() })
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:2rem;flex:1;">
      <BackLink to="/" style="margin-bottom:1.2rem;" />
      <div class="section-label">Quem somos</div>
      <h1 class="section-title">Sobre o <span>CAESI</span></h1>

      <div class="paper paper-mb-lg">
        <h2 class="paper-title">Nossa história e missão</h2>
        <div class="sobre-missao-grid">
          <div class="sobre-missao-texto" v-html="missaoHtml"></div>
          <div class="sobre-img-placeholder">
            <span v-html="cameraIcon"></span>
            <p>Foto histórica ou da sala do CAESI</p>
          </div>
        </div>
      </div>

      <div class="paper paper-mb-lg paper--meio">
        <div class="gestao-header">
          <div>
            <h2 class="paper-title" style="margin-bottom:0;">Gestão atual</h2>
            <div v-if="gestaoInfo.nomeChapa" class="chapa-nome">{{ gestaoInfo.nomeChapa }}</div>
          </div>
          <div v-if="periodoFormatado" class="chapa-periodo">{{ periodoFormatado }}</div>
        </div>

        <div v-if="descricaoGestao" class="gestao-desc">
          <p class="gestao-texto">{{ descricaoGestao }}</p>
        </div>

        <h3 class="equipe-titulo">Conheça a gente</h3>

        <div v-if="membros.length === 0" style="font-size:0.9rem;color:var(--cinza);padding:0.5rem 0;">
          Nenhum membro cadastrado ainda.
        </div>
        <div v-else class="equipe-grid">
          <div v-for="a in membros" :key="a.id" class="membro-card">
            <div class="membro-avatar">
              <img v-if="a.foto" :src="a.foto" :alt="a.nome" class="membro-foto">
              <span v-else class="membro-inicial">{{ a.nome?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="membro-nome">{{ a.nome }}</div>
            <div v-if="a.diretoria" class="membro-periodo">{{ a.diretoria }}</div>
            <div v-else-if="a.periodo" class="membro-periodo">{{ a.periodo }}</div>
            <div v-if="a.email" class="membro-email">{{ a.email }}</div>
            <div v-if="a.descricao" class="membro-desc" v-html="descricaoHtml(a.descricao)"></div>
            <div v-if="a.linkedin || a.git || a.lattes" class="membro-links">
              <a v-if="a.linkedin" :href="a.linkedin" target="_blank" rel="noopener" class="membro-link">LinkedIn</a>
              <a v-if="a.git"      :href="a.git"      target="_blank" rel="noopener" class="membro-link">GitHub</a>
              <a v-if="a.lattes"   :href="a.lattes"   target="_blank" rel="noopener" class="membro-link">Lattes</a>
            </div>
          </div>
        </div>
      </div>

      <div v-if="historicoVisivel && historicoGestoes.length" class="paper paper-mb-lg paper--meio">
        <h2 class="paper-title" style="margin-bottom:1.2rem;">Gestões anteriores</h2>
        <div class="hist-lista">
          <div v-for="g in historicoGestoes" :key="g.id" class="hist-item">
            <button class="hist-header" @click="toggleGestao(g.id)">
              <div class="hist-header-info">
                <span v-if="g.periodo" class="hist-periodo">{{ g.periodo }}</span>
                <span class="hist-chapa">{{ g.periodo ? '—' : '' }} {{ g.nomeChapa }}</span>
              </div>
              <span class="hist-chevron" :class="{ aberto: expandido === g.id }">▾</span>
            </button>
            <div v-if="expandido === g.id" class="hist-body">
              <p v-if="g.descricao" class="hist-desc">{{ g.descricao }}</p>
              <div v-if="g.membros?.length" class="hist-membros">
                <div v-for="m in g.membros" :key="m.nome + m.diretoria" class="hist-membro">
                  <div class="hist-membro-avatar">
                    <img v-if="m.foto" :src="m.foto" :alt="m.nome" class="hist-membro-foto">
                    <span v-else class="hist-membro-inicial">{{ m.nome?.[0]?.toUpperCase() || '?' }}</span>
                  </div>
                  <div v-if="m.diretoria" class="label-sm" style="margin-bottom:2px;">{{ m.diretoria }}</div>
                  <div style="font-size:0.88rem;font-weight:600;color:var(--preto);">{{ m.nome }}</div>
                  <div v-if="m.periodo" style="font-size:0.76rem;color:var(--cinza);">{{ m.periodo }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="paper paper--fim">
        <h2 class="paper-title">Onde nos encontrar</h2>
        <div class="sobre-contato-grid">
          <div class="contato-info-lista">
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="mapPinIcon"></span>
              <span class="contato-info-texto">{{ contatoInfo.endereco }}</span>
            </div>
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="mailIcon"></span>
              <span class="contato-info-texto">
                <a :href="`mailto:${contatoInfo.email}`" class="contato-info-link">{{ contatoInfo.email }}</a>
              </span>
            </div>
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="instagramIcon"></span>
              <span class="contato-info-texto">
                <a :href="`https://instagram.com/${contatoInfo.instagram}`" target="_blank" rel="noopener" class="contato-info-link">@{{ contatoInfo.instagram }}</a>
                no Instagram
              </span>
            </div>
            <RouterLink to="/mapa" class="sobre-mapa-link">Ver mapa completo do campus →</RouterLink>
          </div>
          <div class="sobre-mapa-embed">
            <div ref="mapaMiniEl" class="sobre-mapa-leaflet"></div>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* ── Empilhamento de papers: rebarba só no topo do 1º e na base do último ── */
.paper--meio::before,
.paper--fim::before {
  content: none;
}

/* .paper--fim troca box-shadow por drop-shadow: precisa seguir o recorte
   irregular do ::after (rebarba de baixo), o que box-shadow não acompanha. */
.paper--fim {
  box-shadow: none;
  filter: drop-shadow(5px 5px 0 var(--roxo-escuro)) drop-shadow(0 8px 24px rgba(0,0,0,0.25));
}

.paper--fim::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 12px;
  background: var(--creme);
  transform: rotate(180deg);
  clip-path: polygon(
    0% 100%,
    0% 12%, 4% 88%, 8% 8%, 12% 92%, 16% 4%,
    20% 84%, 24% 10%, 28% 90%, 32% 6%, 36% 86%,
    40% 14%, 44% 90%, 48% 4%, 52% 88%, 56% 14%,
    60% 92%, 64% 6%, 68% 86%, 72% 8%, 76% 90%,
    80% 4%, 84% 88%, 88% 10%, 92% 90%, 96% 6%,
    100% 82%, 100% 100%
  );
}

/* ── Missão: texto + placeholder de imagem ────────────────── */
.sobre-missao-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.sobre-missao-texto { font-size: 0.95rem; color: var(--preto); line-height: 1.75; }
.sobre-missao-texto :deep(p) { margin: 0 0 1.2rem; }
.sobre-missao-texto :deep(p:last-child) { margin-bottom: 0; }
.sobre-missao-texto :deep(a) { color: var(--roxo-escuro); font-weight: 600; }
.sobre-missao-texto :deep(ul),
.sobre-missao-texto :deep(ol) { margin: 0 0 1.2rem; padding-left: 1.4rem; }

.sobre-img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 180px;
  background: rgba(80,64,160,0.04);
  border: 2px dashed var(--creme-escuro);
  border-radius: 2px;
  color: var(--cinza);
  text-align: center;
  padding: 1.2rem;
}
.sobre-img-placeholder :deep(svg) { width: 30px; height: 30px; stroke: currentColor; }
.sobre-img-placeholder p { font-size: 0.8rem; max-width: 200px; }

@media (max-width: 720px) {
  .sobre-missao-grid { grid-template-columns: 1fr; text-align: center; }
}

/* ── Equipe: grid responsivo (substitui o carrossel) ──────── */
.equipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 1rem;
  margin-top: 1.4rem;
}

.membro-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem 0.8rem 1rem;
  gap: 0.35rem;
  box-shadow: 2px 2px 0 var(--roxo-escuro);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.membro-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--roxo-escuro);
  border-color: var(--roxo);
}

.membro-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
}

.membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--creme);
  line-height: 1;
}

.membro-nome {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--preto);
  line-height: 1.3;
}

.membro-periodo {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  background: rgba(80,64,160,0.1);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.22);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.membro-email {
  font-size: 0.76rem;
  color: var(--cinza);
  margin-top: 4px;
  word-break: break-all;
}

.membro-desc {
  font-size: 0.78rem;
  color: var(--preto);
  opacity: 0.65;
  line-height: 1.5;
  margin-top: 6px;
  text-align: center;
}
.membro-desc :deep(p) { margin: 0 0 6px; }
.membro-desc :deep(p:last-child) { margin-bottom: 0; }

.membro-links {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.membro-link {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1.5px solid var(--roxo);
  color: var(--roxo-escuro);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}
.membro-link:hover { background: var(--roxo); color: var(--creme); }

.gestao-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.chapa-nome {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--roxo);
  margin-top: 4px;
}

.chapa-periodo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cinza);
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
}

.gestao-desc {
  margin-top: 1.2rem;
  padding-bottom: 1.4rem;
  border-bottom: 1.5px solid var(--creme-escuro);
}

.gestao-texto {
  font-size: 0.95rem;
  color: var(--preto);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
}

/* Gestões anteriores */
.hist-lista { display: flex; flex-direction: column; gap: 0.5rem; }

.hist-item {
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  overflow: hidden;
}

.hist-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px 16px;
  background: var(--branco);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.hist-header:hover { background: rgba(80,64,160,0.04); }

.hist-header-info { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.hist-chapa { font-size: 0.92rem; font-weight: 700; color: var(--roxo-escuro); }
.hist-periodo { font-size: 0.78rem; color: var(--cinza); }

.hist-chevron {
  font-size: 1.1rem;
  color: var(--cinza);
  flex-shrink: 0;
  transition: transform 0.2s;
  line-height: 1;
}
.hist-chevron.aberto { transform: rotate(180deg); }

.hist-body {
  padding: 1rem 1.2rem 1.2rem;
  border-top: 1.5px solid var(--creme-escuro);
  background: var(--creme);
}

.hist-desc {
  font-size: 0.88rem;
  color: var(--preto);
  line-height: 1.75;
  margin: 0 0 1rem;
  white-space: pre-line;
}

.hist-membros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
}

.hist-membro {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.hist-membro-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.hist-membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hist-membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  color: var(--creme);
  line-height: 1;
}

.equipe-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--roxo-escuro);
  margin: 1.2rem 0 0.8rem;
}

/* ── Contato: informações + mapa embed ────────────────────── */
.sobre-contato-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.contato-info-lista {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.contato-info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contato-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  margin-top: 2px;
  border-radius: 2px;
  background: rgba(80,64,160,0.08);
  color: var(--roxo-escuro);
}
.contato-info-icon :deep(svg) { width: 17px; height: 17px; }

.contato-info-texto {
  font-size: 0.92rem;
  color: var(--preto);
  line-height: 1.5;
  padding-top: 6px;
}

.contato-info-link {
  color: var(--roxo-escuro);
  font-weight: 700;
  text-decoration: none;
}
.contato-info-link:hover { text-decoration: underline; }

.contato-info-lista .sobre-mapa-link {
  margin-top: 0.4rem;
  padding-top: 1rem;
  border-top: 1.5px solid var(--creme-escuro);
}

.sobre-mapa-embed {
  min-height: 200px;
  border-radius: 2px;
  overflow: hidden;
  border: 1.5px solid var(--creme-escuro);
}

.sobre-mapa-leaflet {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.sobre-mapa-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--roxo-escuro);
  text-decoration: none;
  margin-top: 0.3rem;
}
.sobre-mapa-link:hover { text-decoration: underline; }

@media (max-width: 720px) {
  .sobre-contato-grid { grid-template-columns: 1fr; }
  .sobre-mapa-embed { min-height: 240px; }
}
</style>

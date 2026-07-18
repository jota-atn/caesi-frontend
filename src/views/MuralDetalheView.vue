<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { marked } from 'marked'
import { markdownParaHtmlSeguro } from '../utils/markdown.js'
import cameraIcon     from '../assets/icons/camera.svg?raw'
import paperclipIcon  from '../assets/icons/paperclip.svg?raw'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { publicacoes } from '../stores/mural.ts'

marked.use({ breaks: true, gfm: true })

const route  = useRoute()

const publicacao = computed(() =>
  publicacoes.value.find(p => p.id === Number(route.params.id))
)

const htmlContent = computed(() => {
  if (!publicacao.value) return ''
  return markdownParaHtmlSeguro(publicacao.value.mensagem)
})

const tituloPartes = computed(() => {
  const titulo = publicacao.value?.titulo?.trim() ?? ''
  const i = titulo.lastIndexOf(' ')
  if (i === -1) return { inicio: '', ultimo: titulo }
  return { inicio: titulo.slice(0, i), ultimo: titulo.slice(i + 1) }
})

// Lightbox
const lightboxImgs = ref(null)
const lightboxIdx  = ref(0)

function abrirLightbox(imgs, i) {
  lightboxImgs.value = imgs
  lightboxIdx.value  = i
}
function fecharLightbox() { lightboxImgs.value = null }
function prevImg() { lightboxIdx.value = (lightboxIdx.value - 1 + lightboxImgs.value.length) % lightboxImgs.value.length }
function nextImg() { lightboxIdx.value = (lightboxIdx.value + 1) % lightboxImgs.value.length }

function onKey(e) {
  if (!lightboxImgs.value) return
  if (e.key === 'Escape')     fecharLightbox()
  if (e.key === 'ArrowLeft')  prevImg()
  if (e.key === 'ArrowRight') nextImg()
}
</script>

<template>
  <div class="page" @keydown="onKey" tabindex="-1">
    <div class="deco-star" style="top:200px;right:2%;font-size:1.4rem;opacity:0.25;">✦</div>
    <div class="deco-star" style="top:600px;left:1%;font-size:1rem;opacity:0.18;">✦</div>

    <Navbar />

    <div v-if="!publicacao" class="page-content">
      <BackLink to="/mural" style="margin-bottom:1.4rem;" />
      <div class="empty-state">
        <p>Publicação não encontrada.</p>
        <span>Ela pode ter sido removida.</span>
      </div>
    </div>

    <template v-else>
      <!-- ── Cabeçalho editorial ─────────────────────── -->
      <div class="pub-capa">
        <div class="pub-capa-inner">
          <BackLink to="/mural" class="back-link--light" />

          <div class="pub-capa-label">
            <span v-if="publicacao.tipo">{{ publicacao.tipo }}</span>
            <span v-else>Publicação</span>
          </div>

          <h1 class="pub-capa-titulo">
            {{ tituloPartes.inicio }} <span>{{ tituloPartes.ultimo }}</span>
          </h1>

          <div class="pub-capa-meta">
            <span class="pub-capa-data">{{ publicacao.criadoEm }}</span>
            <span v-if="publicacao.editadoEm" class="pub-capa-editado">· atualizado {{ publicacao.editadoEm }}</span>
          </div>
        </div>
      </div>

      <div class="page-content">
        <!-- Hero image -->
        <div
          v-if="publicacao.imagens?.length > 0"
          class="pub-hero"
          role="button"
          tabindex="0"
          :title="publicacao.imagens.length > 1 ? `Ver galeria (${publicacao.imagens.length} fotos)` : 'Ampliar'"
          @click="abrirLightbox(publicacao.imagens, 0)"
          @keydown.enter="abrirLightbox(publicacao.imagens, 0)"
          @keydown.space.prevent="abrirLightbox(publicacao.imagens, 0)"
        >
          <img :src="publicacao.imagens[0]" :alt="publicacao.titulo" class="pub-hero-img">
          <div v-if="publicacao.imagens.length > 1" class="pub-hero-label">
            <span v-html="cameraIcon" class="pub-hero-icon"></span>
            {{ publicacao.imagens.length }} fotos — clique para ver
          </div>
        </div>

        <!-- Artigo com markdown -->
        <article class="pub-artigo">
          <div class="pub-md" v-html="htmlContent"></div>
        </article>

        <!-- Galeria (demais imagens) -->
        <div v-if="publicacao.imagens?.length > 1" class="pub-galeria-section">
          <div class="pub-galeria-topo">
            <span class="section-label" style="margin:0;">Galeria de fotos</span>
            <span class="pub-galeria-count">{{ publicacao.imagens.length }} imagens</span>
          </div>
          <div class="pub-galeria-grid">
            <div
              v-for="(img, i) in publicacao.imagens"
              :key="i"
              class="pub-galeria-item"
              role="button"
              tabindex="0"
              :aria-label="`Ver foto ${i + 1}`"
              @click="abrirLightbox(publicacao.imagens, i)"
              @keydown.enter="abrirLightbox(publicacao.imagens, i)"
              @keydown.space.prevent="abrirLightbox(publicacao.imagens, i)"
            >
              <img :src="img" :alt="`Foto ${i + 1}`" class="pub-galeria-img">
              <div v-if="i === 0" class="pub-galeria-capa">capa</div>
            </div>
          </div>
        </div>

        <!-- Anexos -->
        <div v-if="publicacao.anexos?.length" class="paper pub-anexos-wrap">
          <div class="label-sm" style="margin-bottom:0.8rem;">Anexos</div>
          <ul class="pub-anexos">
            <li v-for="(a, i) in publicacao.anexos" :key="i" class="pub-anexo-item">
              <span v-html="paperclipIcon" class="pub-anexo-icon"></span>
              <span>{{ a }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <!-- Lightbox -->
    <Teleport to="body">
      <div v-if="lightboxImgs" class="lightbox" @click.self="fecharLightbox">
        <button class="lightbox-close" @click="fecharLightbox">×</button>
        <button v-if="lightboxImgs.length > 1" class="lightbox-nav lightbox-nav--prev" @click="prevImg">‹</button>
        <img :src="lightboxImgs[lightboxIdx]" :alt="`Foto ${lightboxIdx + 1}`" class="lightbox-img">
        <button v-if="lightboxImgs.length > 1" class="lightbox-nav lightbox-nav--next" @click="nextImg">›</button>
        <div v-if="lightboxImgs.length > 1" class="lightbox-counter">
          {{ lightboxIdx + 1 }} / {{ lightboxImgs.length }}
        </div>
      </div>
    </Teleport>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* ── Cabeçalho editorial ──────────────────────────────── */
.pub-capa {
  background: var(--roxo-escuro, #3B2F88);
  color: var(--branco, #fff);
  padding: 0;
}

.pub-capa-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 2.4rem 2rem 2rem;
}

.back-link--light {
  background: none;
  border: none;
  color: rgba(255,255,255,0.65);
  font-family: 'Archivo', sans-serif;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.8rem;
  display: block;
  transition: color 0.15s;
}
.back-link--light:hover { color: #fff; }

.pub-capa-topo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.pub-capa-label {
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--creme);
  margin-bottom: 0.5rem;
}

.pub-capa-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(1.7rem, 4vw, 2.6rem);
  font-weight: 800;
  color: var(--creme);
  line-height: 1.15;
  margin: 0 0 0.8rem;
  letter-spacing: -0.01em;
}
.pub-capa-titulo span { color: var(--amarelo); }

.pub-capa-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pub-capa-data {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.4);
  font-family: 'Archivo', sans-serif;
}

.pub-capa-editado {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.3);
  font-family: 'Archivo', sans-serif;
}

/* ── Hero image ─────────────────────────────────────── */
.pub-hero {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 2px;
  margin-bottom: 1.6rem;
  cursor: pointer;
  background: var(--creme-escuro);
  box-shadow: 6px 6px 0 var(--roxo-escuro);
  border: 1.5px solid var(--creme-escuro);
}

.pub-hero-img {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.pub-hero:hover .pub-hero-img { transform: scale(1.025); }

.pub-hero-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%);
  color: #fff;
  font-size: 0.78rem;
  font-family: 'Archivo', sans-serif;
  padding: 1.2rem 1rem 0.7rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pub-hero-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.pub-hero-icon :deep(svg) { width: 14px; height: 14px; }

/* ── Artigo com markdown ────────────────────────────── */
.pub-artigo {
  background: var(--branco, #fff);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 2rem;
  box-shadow: 4px 4px 0 var(--roxo-escuro);
  margin-bottom: 1.6rem;
}

/* Markdown deep styles */
.pub-md :deep(h1),
.pub-md :deep(h2),
.pub-md :deep(h3),
.pub-md :deep(h4) {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  color: var(--roxo-escuro, #3B2F88);
  line-height: 1.2;
  margin: 1.8em 0 0.6em;
}

.pub-md :deep(h1) { font-size: 1.6rem; }
.pub-md :deep(h2) {
  font-size: 1.2rem;
  border-left: 4px solid var(--roxo, #6B4FBB);
  padding-left: 12px;
}
.pub-md :deep(h3) { font-size: 1rem; color: var(--roxo, #6B4FBB); }
.pub-md :deep(h4) { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.06em; }

.pub-md :deep(p) {
  font-size: 0.97rem;
  color: var(--preto);
  line-height: 1.9;
  margin: 0 0 1em;
}

.pub-md :deep(p:first-child) { margin-top: 0; }
.pub-md :deep(p:last-child)  { margin-bottom: 0; }

.pub-md :deep(strong) {
  font-weight: 700;
  color: var(--preto);
}

.pub-md :deep(em) { font-style: italic; }

.pub-md :deep(blockquote) {
  border-left: 4px solid var(--roxo, #6B4FBB);
  background: rgba(80,64,160,0.06);
  margin: 1.2em 0;
  padding: 0.9em 1.4em;
  border-radius: 0 2px 2px 0;
  font-style: italic;
  color: var(--preto);
}
.pub-md :deep(blockquote p) { margin: 0; font-size: 1rem; line-height: 1.75; }

.pub-md :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.86em;
  background: rgba(80,64,160,0.09);
  color: var(--roxo-escuro);
  padding: 2px 5px;
  border-radius: 2px;
}

.pub-md :deep(pre) {
  background: var(--preto);
  color: #e6e1f5;
  border-radius: 2px;
  padding: 1.2em 1.4em;
  overflow-x: auto;
  margin: 1.2em 0;
}
.pub-md :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.88rem;
}

.pub-md :deep(ul),
.pub-md :deep(ol) {
  padding-left: 1.4em;
  margin: 0.8em 0 1em;
  color: var(--preto);
}
.pub-md :deep(li) {
  font-size: 0.97rem;
  line-height: 1.75;
  margin-bottom: 0.25em;
}

.pub-md :deep(ul li)::marker { color: var(--roxo); }
.pub-md :deep(ol li)::marker { color: var(--roxo); font-weight: 700; }

.pub-md :deep(a) {
  color: var(--roxo, #6B4FBB);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.pub-md :deep(a:hover) { color: var(--roxo-escuro); }

.pub-md :deep(hr) {
  border: none;
  border-top: 2px solid var(--creme-escuro);
  margin: 2em 0;
}

.pub-md :deep(img) {
  max-width: 100%;
  border-radius: 2px;
  display: block;
  margin: 1em auto;
}

.pub-md :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.9rem;
}
.pub-md :deep(th) {
  background: var(--roxo-escuro);
  color: #fff;
  font-family: 'Archivo Black', sans-serif;
  padding: 8px 12px;
  text-align: left;
}
.pub-md :deep(td) {
  padding: 7px 12px;
  border-bottom: 1px solid var(--creme-escuro);
}
.pub-md :deep(tr:nth-child(even) td) { background: var(--creme); }

/* ── Galeria ──────────────────────────────────────── */
.pub-galeria-section {
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem;
  background: var(--creme);
  box-shadow: 4px 4px 0 var(--roxo-escuro);
  margin-bottom: 1.2rem;
}

.pub-galeria-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.pub-galeria-count {
  font-size: 0.76rem;
  color: var(--cinza);
}

.pub-galeria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 7px;
}

.pub-galeria-item {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 2px;
  cursor: pointer;
  background: var(--creme-escuro);
  border: 1.5px solid var(--creme-escuro);
}

.pub-galeria-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s;
}
.pub-galeria-item:hover .pub-galeria-img { transform: scale(1.08); }

.pub-galeria-capa {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(80,64,160,0.8);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  text-align: center;
  padding: 2px 0;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── Anexos ───────────────────────────────────────── */
.pub-anexos-wrap { margin-bottom: 1.2rem; }
.pub-anexos { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.pub-anexo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  font-size: 0.86rem;
  color: var(--preto);
}
.pub-anexo-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--cinza);
}
.pub-anexo-icon :deep(svg) { width: 15px; height: 15px; }

/* ── Lightbox ─────────────────────────────────────── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-img {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}

.lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 2.4rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.lightbox-close:hover { opacity: 1; }

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  font-size: 2.8rem;
  line-height: 1;
  padding: 0.3rem 1rem;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.15s;
}
.lightbox-nav:hover    { background: rgba(255,255,255,0.2); }
.lightbox-nav--prev    { left: 12px; }
.lightbox-nav--next    { right: 12px; }

.lightbox-counter {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.6);
  font-size: 0.82rem;
  font-family: 'Archivo', sans-serif;
}

/* ── Empty ────────────────────────────────────────── */
.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p    { font-size: 1rem; font-weight: 600; color: var(--preto); margin-bottom: 0.4rem; }
.empty-state span { font-size: 0.85rem; color: var(--cinza); }
</style>

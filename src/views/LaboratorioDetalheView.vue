<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import cameraIcon   from '../assets/icons/camera.svg?raw'
import mapPinIcon   from '../assets/icons/map-pin.svg?raw'
import mailIcon     from '../assets/icons/mail.svg?raw'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import EmptyState from '../components/EmptyState.vue'
import Lightbox from '../components/Lightbox.vue'
import { laboratorios } from '../stores/informacoes.ts'
import { estruturas } from '../stores/mapa.ts'

const route = useRoute()

const laboratorio = computed(() =>
  laboratorios.value.find(l => l.id === Number(route.params.id))
)

const nomeEstrutura = computed(() =>
  estruturas.value.find(e => e.id === laboratorio.value?.estruturaId)?.nome ?? null
)

const todasImagens = computed(() => {
  if (!laboratorio.value) return []
  return [laboratorio.value.imagem, ...(laboratorio.value.imagens ?? [])].filter(Boolean) as string[]
})

const lightboxIdx = ref<number | null>(null)
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:200px;right:2%;font-size:1.4rem;opacity:0.25;">✦</div>
    <div class="deco-star" style="top:600px;left:1%;font-size:1rem;opacity:0.18;">✦</div>

    <Navbar />

    <div v-if="!laboratorio" class="page-content">
      <BackLink to="/informacoes/laboratorios" style="margin-bottom:1.4rem;" />
      <EmptyState title="Laboratório não encontrado." subtitle="Ele pode ter sido removido." />
    </div>

    <template v-else>
      <!-- ── Cabeçalho editorial ─────────────────────── -->
      <div class="pub-capa">
        <div class="pub-capa-inner">
          <BackLink to="/informacoes/laboratorios" class="back-link--light" />

          <div v-if="laboratorio.sigla" class="pub-capa-label">{{ laboratorio.sigla }}</div>

          <h1 class="pub-capa-titulo">{{ laboratorio.nome }}</h1>
        </div>
      </div>

      <div class="page-content">
        <!-- Hero image -->
        <div
          v-if="todasImagens.length > 0"
          class="pub-hero"
          role="button"
          tabindex="0"
          :title="todasImagens.length > 1 ? `Ver galeria (${todasImagens.length} fotos)` : 'Ampliar'"
          @click="lightboxIdx = 0"
          @keydown.enter="lightboxIdx = 0"
          @keydown.space.prevent="lightboxIdx = 0"
        >
          <img :src="todasImagens[0]" :alt="laboratorio.nome" class="pub-hero-img">
          <div v-if="todasImagens.length > 1" class="pub-hero-label">
            <span v-html="cameraIcon" class="pub-hero-icon"></span>
            {{ todasImagens.length }} fotos — clique para ver
          </div>
        </div>

        <!-- Descrição + contato -->
        <div class="paper pub-artigo">
          <p v-if="laboratorio.descricao" class="lab-descricao">{{ laboratorio.descricao }}</p>
          <p v-else class="lab-descricao lab-descricao--vazia">Sem descrição cadastrada ainda.</p>

          <div v-if="laboratorio.email || laboratorio.linkExterno || nomeEstrutura" class="lab-contato-row">
            <a v-if="laboratorio.email" :href="`mailto:${laboratorio.email}`" class="lab-contato-item">
              <span v-html="mailIcon" class="lab-contato-icon"></span> {{ laboratorio.email }}
            </a>
            <a v-if="laboratorio.linkExterno" :href="laboratorio.linkExterno" target="_blank" rel="noopener" class="lab-contato-item">
              Site do laboratório →
            </a>
            <RouterLink v-if="nomeEstrutura" :to="`/mapa?estrutura=${laboratorio.estruturaId}`" class="lab-contato-item">
              <span v-html="mapPinIcon" class="lab-contato-icon"></span> Ver localização →
            </RouterLink>
          </div>
        </div>

        <!-- Galeria -->
        <div v-if="todasImagens.length > 1" class="pub-galeria-section">
          <div class="pub-galeria-topo">
            <span class="section-label" style="margin:0;">Galeria de fotos</span>
            <span class="pub-galeria-count">{{ todasImagens.length }} imagens</span>
          </div>
          <div class="pub-galeria-grid">
            <div
              v-for="(img, i) in todasImagens"
              :key="i"
              class="pub-galeria-item"
              role="button"
              tabindex="0"
              :aria-label="`Ver foto ${i + 1}`"
              @click="lightboxIdx = i"
              @keydown.enter="lightboxIdx = i"
              @keydown.space.prevent="lightboxIdx = i"
            >
              <img :src="img" :alt="`Foto ${i + 1}`" class="pub-galeria-img">
              <div v-if="i === 0" class="pub-galeria-capa">capa</div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <Lightbox :imagens="todasImagens" :index="lightboxIdx" @update:index="lightboxIdx = $event" />

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
  margin: 0;
  letter-spacing: -0.01em;
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
  max-height: 420px;
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
.pub-hero-icon { display: flex; align-items: center; flex-shrink: 0; }
.pub-hero-icon :deep(svg) { width: 14px; height: 14px; }

/* ── Descrição + contato ────────────────────────────── */
.pub-artigo {
  margin-bottom: 1.6rem;
}

.lab-descricao {
  font-size: 0.97rem;
  color: var(--preto);
  line-height: 1.85;
  white-space: pre-wrap;
  margin: 0 0 1.2rem;
}
.lab-descricao--vazia { color: var(--cinza); font-style: italic; }

.lab-contato-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1.5px solid var(--creme-escuro);
}
.lab-contato-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
  text-decoration: none;
}
.lab-contato-item:hover { text-decoration: underline; }
.lab-contato-icon { display: flex; align-items: center; }
.lab-contato-icon :deep(svg) { width: 14px; height: 14px; }

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

.pub-galeria-count { font-size: 0.76rem; color: var(--cinza); }

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

</style>

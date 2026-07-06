<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination.js'
import { usePersistedFilter } from '../composables/usePersistedFilter.js'
import { publicacoes } from '../stores/mural.js'

const busca   = usePersistedFilter('mural-busca', '')
const filtro  = usePersistedFilter('mural-filtro', 'todas')
const ordenar = usePersistedFilter('mural-ordem', 'recentes')

const tiposUnicos = computed(() => {
  const set = new Set(publicacoes.value.map(p => p.tipo).filter(Boolean))
  return [...set].sort()
})

const lista = computed(() => {
  let result = publicacoes.value.filter(p => {
    const matchFiltro = filtro.value === 'todas' || p.tipo === filtro.value
    const termo = busca.value.toLowerCase()
    const matchBusca = !termo ||
      p.titulo.toLowerCase().includes(termo) ||
      p.mensagem.toLowerCase().includes(termo) ||
      (p.tipo ?? '').toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  if (ordenar.value === 'antigas')    result = [...result].reverse()
  else if (ordenar.value === 'az')    result = [...result].sort((a, b) => a.titulo.localeCompare(b.titulo))
  else if (ordenar.value === 'za')    result = [...result].sort((a, b) => b.titulo.localeCompare(a.titulo))

  return result
})

const { page, totalPages, paginated, next, prev, goTo } = usePagination(lista, 12)

function textoPlano(md) {
  const html = String(marked.parse(md || ''))
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.22;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Mural do <span>CAESI</span></h2>
      </div>

      <!-- Filtros -->
      <div class="mural-toolbar">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar publicações…">
        <select v-model="ordenar" class="mural-select">
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      <div v-if="tiposUnicos.length > 0" class="mural-tipos">
        <button class="filter-btn" :class="{ active: filtro === 'todas' }" @click="filtro = 'todas'">Todas</button>
        <button
          v-for="tipo in tiposUnicos" :key="tipo"
          class="filter-btn"
          :class="{ active: filtro === tipo }"
          @click="filtro = tipo"
        >{{ tipo }}</button>
      </div>

      <!-- Lista vazia -->
      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ publicacoes.length === 0 ? 'Nenhuma publicação ainda.' : 'Nenhuma publicação encontrada.' }}</p>
        <span v-if="publicacoes.length > 0">Tente outro filtro ou termo de busca.</span>
      </div>

      <!-- Grid -->
      <div class="mural-grid">
        <RouterLink
          v-for="p in paginated"
          :key="p.id"
          :to="`/mural/${p.id}`"
          class="mural-card"
          :class="{ 'mural-card--com-img': p.imagens?.length > 0 }"
        >
          <!-- Capa -->
          <div v-if="p.imagens?.length > 0" class="mural-card-capa">
            <img :src="p.imagens[0]" :alt="p.titulo" class="mural-card-capa-img">
            <div v-if="p.imagens.length > 1" class="mural-capa-mais">+{{ p.imagens.length - 1 }}</div>
          </div>

          <div class="mural-card-body">
            <div class="mural-card-top">
              <span v-if="p.tipo" class="mural-tipo">{{ p.tipo }}</span>
              <span class="mural-data">{{ p.criadoEm }}</span>
            </div>
            <div class="mural-card-titulo">{{ p.titulo }}</div>
            <div class="mural-card-preview">{{ textoPlano(p.mensagem) }}</div>
            <div class="mural-card-footer">
              <span v-if="p.anexos?.length" class="mural-anexos-hint">{{ p.anexos.length }} anexo{{ p.anexos.length > 1 ? 's' : '' }}</span>
              <span class="mural-card-arrow">Ler mais →</span>
            </div>
          </div>
        </RouterLink>
      </div>

      <Pagination :page="page" :totalPages="totalPages" @prev="prev" @next="next" @goto="goTo" />
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.mural-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.mural-search {
  flex: 1;
  min-width: 180px;
  padding: 9px 14px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.92rem;
  color: var(--preto);
  outline: none;
  transition: border-color 0.2s;
}
.mural-search:focus { border-color: var(--roxo); }

.mural-select {
  padding: 9px 12px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.88rem;
  color: var(--preto);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.mural-select:focus { border-color: var(--roxo); }

.mural-tipos {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

/* Grid principal */
.mural-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.1rem;
  margin-bottom: 1.4rem;
}

/* Card base */
.mural-card {
  background: var(--creme);
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mural-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}

/* Card sem imagem mantém a borda lateral roxa */
.mural-card:not(.mural-card--com-img) {
  border-left: 4px solid var(--roxo);
}

/* Capa da imagem */
.mural-card-capa {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--creme-escuro);
  flex-shrink: 0;
}

.mural-card-capa-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.mural-card:hover .mural-card-capa-img {
  transform: scale(1.04);
}

.mural-capa-mais {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
}

/* Body do card */
.mural-card-body {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.mural-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.mural-tipo {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.mural-data {
  font-size: 0.74rem;
  color: var(--cinza);
  flex-shrink: 0;
}

.mural-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--preto);
  line-height: 1.3;
}

.mural-card-preview {
  font-size: 0.84rem;
  color: var(--preto);
  opacity: 0.6;
  line-height: 1.55;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
}

.mural-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
}

.mural-anexos-hint {
  font-size: 0.73rem;
  color: var(--cinza);
}

.mural-card-arrow {
  font-size: 0.77rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
}

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
  margin-bottom: 1.4rem;
}
.empty-state p   { font-size: 1rem; font-weight: 600; color: var(--preto); margin-bottom: 0.4rem; }
.empty-state span { font-size: 0.85rem; color: var(--cinza); }
</style>

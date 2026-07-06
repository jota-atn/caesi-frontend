<script setup>
import { computed, watch } from 'vue'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination.js'
import { usePersistedFilter } from '../composables/usePersistedFilter.js'
import { artefatos } from '../stores/portal.js'

const busca  = usePersistedFilter('portal-busca', '')
const filtro = usePersistedFilter('portal-filtro', 'todos')

const tiposUnicos = computed(() => {
  const set = new Set(artefatos.value.map(a => a.tipo).filter(Boolean))
  return [...set].sort()
})

// Se o tipo filtrado deixar de existir (artefato apagado/editado), volta pra "todos"
// em vez de deixar o filtro preso sem UI capaz de resetá-lo.
watch(tiposUnicos, (tipos) => {
  if (filtro.value !== 'todos' && !tipos.includes(filtro.value)) filtro.value = 'todos'
})

const lista = computed(() => {
  return artefatos.value
    .filter(a => {
      const matchFiltro = filtro.value === 'todos' || a.tipo === filtro.value
      const termo = busca.value.toLowerCase()
      const matchBusca = !termo ||
        a.descricao.toLowerCase().includes(termo) ||
        (a.tipo ?? '').toLowerCase().includes(termo)
      return matchFiltro && matchBusca
    })
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
})

const { page, totalPages, paginated, next, prev, goTo } = usePagination(lista, 12)

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
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
        <h2>Portal do <span>CAESI</span></h2>
      </div>

      <!-- Filtros -->
      <div class="mural-toolbar">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar artefatos…">
      </div>

      <div v-if="tiposUnicos.length > 0" class="mural-tipos">
        <button class="filter-btn" :class="{ active: filtro === 'todos' }" @click="filtro = 'todos'">Todos</button>
        <button
          v-for="tipo in tiposUnicos" :key="tipo"
          class="filter-btn"
          :class="{ active: filtro === tipo }"
          @click="filtro = tipo"
        >{{ tipo }}</button>
      </div>

      <!-- Lista vazia -->
      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ artefatos.length === 0 ? 'Nenhum artefato publicado ainda.' : 'Nenhum artefato encontrado.' }}</p>
        <span v-if="artefatos.length > 0">Tente outro filtro ou termo de busca.</span>
      </div>

      <!-- Grid -->
      <div class="portal-grid">
        <RouterLink
          v-for="a in paginated"
          :key="a.id"
          :to="`/portal/${a.id}`"
          class="portal-card"
        >
          <div class="portal-card-top">
            <span v-if="a.tipo" class="mural-tipo">{{ a.tipo }}</span>
            <span class="mural-data">{{ formatData(a.criadoEm) }}</span>
          </div>
          <div class="portal-card-desc">{{ a.descricao }}</div>
          <div class="portal-card-footer">
            <span v-if="a.valor != null" class="portal-card-valor">{{ formatValor(a.valor) }}</span>
            <span v-else></span>
            <span class="mural-card-arrow">Ver mais →</span>
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

.mural-tipos {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
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

.mural-data { font-size: 0.74rem; color: var(--cinza); flex-shrink: 0; }

.mural-card-arrow {
  font-size: 0.77rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
}

/* Grid principal */
.portal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.1rem;
  margin-bottom: 1.4rem;
}

.portal-card {
  background: var(--creme);
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.2rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.portal-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}

.portal-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.portal-card-desc {
  font-size: 0.88rem;
  color: var(--preto);
  line-height: 1.55;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
}

.portal-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
}

.portal-card-valor {
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--verde);
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

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import { laboratorios } from '../stores/informacoes.js'

const route = useRoute()
const busca = ref(route.query.busca ?? '')

const lista = computed(() => {
  const t = busca.value.toLowerCase().trim()
  const base = [...laboratorios.value].sort((a, b) => a.nome.localeCompare(b.nome))
  if (!t) return base
  return base.filter(l => l.nome.toLowerCase().includes(t) || (l.sigla ?? '').toLowerCase().includes(t))
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <RouterLink to="/informacoes" class="back-link">← Informações</RouterLink>
      <div class="page-heading">
        <h2>Laboratórios do <span>Departamento</span></h2>
      </div>

      <input v-model="busca" type="search" class="mural-search" placeholder="Buscar laboratório…" style="margin-bottom:1.2rem;">

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ laboratorios.length === 0 ? 'Nenhum laboratório cadastrado ainda.' : 'Nenhum laboratório encontrado.' }}</p>
      </div>

      <div class="lab-grid">
        <div v-for="l in lista" :key="l.id" class="lab-card">
          <div v-if="l.imagem" class="lab-card-img-wrap">
            <img :src="l.imagem" :alt="l.nome" class="lab-card-img">
          </div>
          <div class="lab-card-body">
            <div class="lab-card-top">
              <span class="lab-card-nome">{{ l.nome }}</span>
              <span v-if="l.sigla" class="diretorio-pill">{{ l.sigla }}</span>
            </div>
            <p v-if="l.descricao" class="lab-card-desc">{{ l.descricao }}</p>
            <div class="lab-card-footer">
              <a v-if="l.linkExterno" :href="l.linkExterno" target="_blank" rel="noopener" class="diretorio-local">Site do laboratório →</a>
              <RouterLink v-if="l.estruturaId" :to="`/?estrutura=${l.estruturaId}#mapa`" class="diretorio-local">
                <span v-html="mapPinIcon" class="diretorio-local-icon"></span> Ver localização →
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.mural-search {
  width: 100%; padding: 9px 14px; background: var(--branco); border: 2px solid var(--creme-escuro);
  border-radius: 2px; font-family: 'Archivo', sans-serif; font-size: 0.92rem; color: var(--preto);
  outline: none; transition: border-color 0.2s;
}
.mural-search:focus { border-color: var(--roxo); }

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.1rem;
}

.lab-card {
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lab-card-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--creme-escuro);
  overflow: hidden;
}
.lab-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.lab-card-body { padding: 1rem 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
.lab-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.lab-card-nome { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 0.98rem; color: var(--preto); }

.diretorio-pill {
  font-size: 0.67rem; font-weight: 700; font-family: 'Archivo Black', sans-serif; padding: 2px 7px;
  border-radius: 2px; border: 1px solid rgba(80,64,160,0.25); background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro); text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
}

.lab-card-desc {
  font-size: 0.84rem; color: var(--preto); opacity: 0.75; line-height: 1.55;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; flex: 1;
}

.lab-card-footer { display: flex; flex-direction: column; gap: 4px; margin-top: 0.2rem; }
.diretorio-local {
  display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 700;
  font-family: 'Archivo Black', sans-serif; color: var(--roxo-escuro); text-decoration: none; width: fit-content;
}
.diretorio-local-icon { display: flex; align-items: center; }
.diretorio-local-icon :deep(svg) { width: 13px; height: 13px; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro); margin-bottom: 1.4rem;
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

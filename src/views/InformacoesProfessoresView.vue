<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import { professores } from '../stores/informacoes.js'

const route = useRoute()
const busca = ref(route.query.busca ?? '')

const lista = computed(() => {
  const t = busca.value.toLowerCase().trim()
  const base = [...professores.value].sort((a, b) => a.nome.localeCompare(b.nome))
  if (!t) return base
  return base.filter(p => p.nome.toLowerCase().includes(t))
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Professores do <span>Curso</span></h2>
      </div>

      <input v-model="busca" type="search" class="mural-search" placeholder="Buscar professor…" style="margin-bottom:1.2rem;">

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ professores.length === 0 ? 'Nenhum professor cadastrado ainda.' : 'Nenhum professor encontrado.' }}</p>
      </div>

      <div class="diretorio-grid">
        <div v-for="p in lista" :key="p.id" class="diretorio-card">
          <div class="diretorio-top-row">
            <img v-if="p.foto" :src="p.foto" class="diretorio-avatar" :alt="p.nome">
            <span v-else class="diretorio-avatar diretorio-avatar--inicial">{{ p.nome?.[0]?.toUpperCase() || '?' }}</span>
            <div>
              <div class="diretorio-nome">{{ p.nome }}</div>
              <div v-if="p.sala" class="diretorio-sala">{{ p.sala }}</div>
            </div>
          </div>
          <p v-if="p.descricao" class="diretorio-desc">{{ p.descricao }}</p>
          <a v-if="p.email" :href="`mailto:${p.email}`" class="diretorio-email">{{ p.email }}</a>
          <div v-if="p.lattes || p.googleAcademico || p.linkedin" class="diretorio-links">
            <a v-if="p.lattes"          :href="p.lattes"          target="_blank" rel="noopener" class="diretorio-pill">Lattes</a>
            <a v-if="p.googleAcademico" :href="p.googleAcademico" target="_blank" rel="noopener" class="diretorio-pill">Google Acadêmico</a>
            <a v-if="p.linkedin"        :href="p.linkedin"        target="_blank" rel="noopener" class="diretorio-pill">LinkedIn</a>
          </div>
          <RouterLink v-if="p.estruturaId" :to="`/mapa?estrutura=${p.estruturaId}`" class="diretorio-local">
            <span v-html="mapPinIcon" class="diretorio-local-icon"></span> Ver localização →
          </RouterLink>
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

.diretorio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.diretorio-card {
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  padding: 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.diretorio-top-row { display: flex; align-items: center; gap: 10px; }
.diretorio-avatar {
  width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
  border: 1.5px solid var(--creme-escuro);
}
.diretorio-avatar--inicial {
  display: flex; align-items: center; justify-content: center;
  background: var(--roxo-escuro); color: var(--creme);
  font-family: 'Archivo Black', sans-serif; font-weight: 800; font-size: 1.1rem;
}

.diretorio-nome {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.98rem;
  color: var(--preto);
}
.diretorio-sala { font-size: 0.78rem; color: var(--cinza); margin-top: 2px; }
.diretorio-desc { font-size: 0.84rem; color: var(--preto); opacity: 0.75; line-height: 1.55; }
.diretorio-email { font-size: 0.8rem; color: var(--roxo-escuro); font-weight: 600; text-decoration: none; word-break: break-all; }
.diretorio-email:hover { text-decoration: underline; }

.diretorio-links { display: flex; gap: 6px; flex-wrap: wrap; }
.diretorio-pill {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  color: var(--roxo-escuro);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: border-color 0.15s;
}
.diretorio-pill:hover { border-color: var(--roxo); }

.diretorio-local {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
  text-decoration: none;
  margin-top: 0.2rem;
}
.diretorio-local-icon { display: flex; align-items: center; }
.diretorio-local-icon :deep(svg) { width: 13px; height: 13px; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro); margin-bottom: 1.4rem;
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

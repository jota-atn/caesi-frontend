<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import paperclipIcon from '../assets/icons/paperclip.svg?raw'
import { editais } from '../stores/informacoes.js'

const route = useRoute()
const busca = ref(route.query.busca ?? '')
const expandidoId = ref(null)

const lista = computed(() => {
  const t = busca.value.toLowerCase().trim()
  const base = [...editais.value].sort((a, b) => (b.data ?? b.criadoEm).localeCompare(a.data ?? a.criadoEm))
  if (!t) return base
  return base.filter(e => e.titulo.toLowerCase().includes(t) || e.descricao.toLowerCase().includes(t))
})

function toggleExpandir(id) { expandidoId.value = expandidoId.value === id ? null : id }

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Editais do <span>CAESI</span></h2>
      </div>

      <input v-model="busca" type="search" class="mural-search" placeholder="Buscar edital…" style="margin-bottom:1.2rem;">

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ editais.length === 0 ? 'Nenhum edital publicado ainda.' : 'Nenhum edital encontrado.' }}</p>
      </div>

      <div class="evento-lista">
        <div v-for="e in lista" :key="e.id" class="evento-card" @click="toggleExpandir(e.id)">
          <div class="evento-corpo">
            <div class="evento-top">
              <span class="evento-nome">{{ e.titulo }}</span>
              <span v-if="e.data" class="mural-data">{{ formatData(e.data) }}</span>
            </div>
            <p v-if="expandidoId === e.id && e.descricao" class="evento-desc">{{ e.descricao }}</p>
            <div v-if="expandidoId === e.id && e.anexo" class="editais-anexo">
              <span v-html="paperclipIcon" class="editais-anexo-icon"></span>{{ e.anexo.nome }}
            </div>
          </div>
          <span class="evento-toggle">{{ expandidoId === e.id ? '−' : '+' }}</span>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.mural-search {
  width: 100%;
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
.mural-data { font-size: 0.78rem; color: var(--cinza); }

.evento-lista { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1rem; }

.evento-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  padding: 0.9rem 1.1rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.evento-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--roxo-escuro); }

.evento-corpo { flex: 1; min-width: 0; }
.evento-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.evento-nome { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 0.98rem; color: var(--preto); }
.evento-desc { font-size: 0.85rem; color: var(--preto); opacity: 0.75; line-height: 1.55; margin-top: 0.5rem; white-space: pre-wrap; }
.evento-toggle { flex-shrink: 0; font-family: 'Archivo Black', sans-serif; font-size: 1.1rem; color: var(--roxo-escuro); line-height: 1; }

.editais-anexo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: var(--cinza);
}
.editais-anexo-icon { display: flex; align-items: center; }
.editais-anexo-icon :deep(svg) { width: 14px; height: 14px; }

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
  margin-bottom: 1.4rem;
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

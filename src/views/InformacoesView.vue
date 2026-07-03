<script setup>
import { ref, computed } from 'vue'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import clipboardIcon from '../assets/icons/clipboard.svg?raw'
import usersIcon     from '../assets/icons/users.svg?raw'
import userIcon      from '../assets/icons/user.svg?raw'
import flaskIcon     from '../assets/icons/flask.svg?raw'
import bookOpenIcon  from '../assets/icons/book-open.svg?raw'
import archiveIcon   from '../assets/icons/archive.svg?raw'
import { editais, professores, laboratorios } from '../stores/informacoes.js'
import { artefatos } from '../stores/portal.js'

function plural(n, singular, pluralForm) { return `${n} ${n === 1 ? singular : pluralForm}` }

const secoes = computed(() => [
  { to: '/informacoes/editais',      titulo: 'Editais',       icon: clipboardIcon, cor: 'roxo',        info: plural(editais.value.length, 'edital', 'editais') },
  { to: '/informacoes/tamburetei',   titulo: 'Tamburetei',    icon: usersIcon,     cor: 'amarelo',      info: 'Mantido pela OpenDev UFCG' },
  { to: '/informacoes/professores',  titulo: 'Professores',   icon: userIcon,      cor: 'verde',        info: plural(professores.value.length, 'professor', 'professores') },
  { to: '/informacoes/laboratorios', titulo: 'Laboratórios',  icon: flaskIcon,     cor: 'vermelho',     info: plural(laboratorios.value.length, 'laboratório', 'laboratórios') },
  { to: '/estatuto',                 titulo: 'Estatuto',      icon: bookOpenIcon,  cor: 'roxo-escuro',  info: '50 artigos' },
  { to: '/portal',                   titulo: 'Portal',        icon: archiveIcon,   cor: 'kraft',        info: plural(artefatos.value.length, 'artefato', 'artefatos') },
])

const busca = ref('')
const termo = computed(() => busca.value.trim().toLowerCase())

const resultados = computed(() => {
  if (termo.value.length < 2) return []
  const t = termo.value
  const rota = `?busca=${encodeURIComponent(busca.value.trim())}`

  const deEditais = editais.value
    .filter(e => e.titulo.toLowerCase().includes(t) || e.descricao.toLowerCase().includes(t))
    .map(e => ({ tipo: 'Edital', nome: e.titulo, to: `/informacoes/editais${rota}` }))

  const deProfessores = professores.value
    .filter(p => p.nome.toLowerCase().includes(t))
    .map(p => ({ tipo: 'Professor', nome: p.nome, to: `/informacoes/professores${rota}` }))

  const deLaboratorios = laboratorios.value
    .filter(l => l.nome.toLowerCase().includes(t) || (l.sigla ?? '').toLowerCase().includes(t))
    .map(l => ({ tipo: 'Laboratório', nome: l.nome, to: `/informacoes/laboratorios${rota}` }))

  return [...deEditais, ...deProfessores, ...deLaboratorios]
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Informações do <span>CAESI</span></h2>
      </div>

      <input
        v-model="busca"
        type="search"
        class="mural-search"
        placeholder="Buscar editais, professores, laboratórios…"
        style="margin-bottom:1.2rem;"
      >

      <template v-if="termo.length >= 2">
        <div v-if="resultados.length === 0" class="empty-state">
          <p>Nenhum resultado para "{{ busca.trim() }}".</p>
        </div>
        <div v-else class="busca-resultados">
          <RouterLink v-for="(r, i) in resultados" :key="i" :to="r.to" class="busca-resultado-item">
            <span class="busca-resultado-tipo">{{ r.tipo }}</span>
            <span class="busca-resultado-nome">{{ r.nome }}</span>
            <span class="busca-resultado-arrow">→</span>
          </RouterLink>
        </div>
      </template>

      <div v-else class="info-hub-grid">
        <RouterLink v-for="s in secoes" :key="s.to" :to="s.to" class="info-hub-card" :class="`info-hub-card--${s.cor}`">
          <div class="info-hub-card-icon" v-html="s.icon"></div>
          <div class="info-hub-card-body">
            <div class="info-hub-card-titulo">{{ s.titulo }}</div>
            <p class="info-hub-card-info">{{ s.info }}</p>
          </div>
          <span class="info-hub-card-arrow">→</span>
        </RouterLink>
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

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro); margin-bottom: 1.4rem;
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }

.busca-resultados { display: flex; flex-direction: column; gap: 0.6rem; }

.busca-resultado-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  padding: 0.8rem 1rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.busca-resultado-item:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--roxo-escuro); }

.busca-resultado-tipo {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid rgba(80,64,160,0.25);
  background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.busca-resultado-nome { flex: 1; min-width: 0; font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 0.95rem; color: var(--preto); }
.busca-resultado-arrow { flex-shrink: 0; font-family: 'Archivo Black', sans-serif; font-size: 1.1rem; color: var(--roxo-escuro); opacity: 0.5; }

.info-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.1rem;
}

.info-hub-card {
  background: var(--creme);
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  box-shadow: 4px 4px 0 var(--roxo-escuro);
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.3rem 1.3rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.info-hub-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--roxo-escuro);
}

.info-hub-card-icon {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--branco);
}
.info-hub-card-icon :deep(svg) { width: 22px; height: 22px; }

.info-hub-card--roxo        .info-hub-card-icon { background: var(--roxo); }
.info-hub-card--amarelo     .info-hub-card-icon { background: var(--amarelo); color: var(--roxo-escuro); }
.info-hub-card--verde       .info-hub-card-icon { background: var(--verde); }
.info-hub-card--vermelho    .info-hub-card-icon { background: var(--vermelho); }
.info-hub-card--roxo-escuro .info-hub-card-icon { background: var(--roxo-escuro); }
.info-hub-card--kraft       .info-hub-card-icon { background: var(--kraft); color: var(--roxo-escuro); }

.info-hub-card--roxo        { border-left: 4px solid var(--roxo); }
.info-hub-card--amarelo     { border-left: 4px solid var(--amarelo); }
.info-hub-card--verde       { border-left: 4px solid var(--verde); }
.info-hub-card--vermelho    { border-left: 4px solid var(--vermelho); }
.info-hub-card--roxo-escuro { border-left: 4px solid var(--roxo-escuro); }
.info-hub-card--kraft       { border-left: 4px solid var(--kraft); }

.info-hub-card-body { flex: 1; min-width: 0; }

.info-hub-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--roxo-escuro);
}

.info-hub-card-info {
  font-size: 0.82rem;
  color: var(--preto);
  opacity: 0.65;
  margin-top: 2px;
}

.info-hub-card-arrow {
  flex-shrink: 0;
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.2rem;
  color: var(--roxo-escuro);
  opacity: 0.5;
}
</style>

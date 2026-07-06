<script setup>
import { computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import clipboardIcon from '../../assets/icons/clipboard.svg?raw'
import usersIcon     from '../../assets/icons/users.svg?raw'
import userIcon      from '../../assets/icons/user.svg?raw'
import flaskIcon     from '../../assets/icons/flask.svg?raw'
import archiveIcon   from '../../assets/icons/archive.svg?raw'
import { editais, professores, laboratorios } from '../../stores/informacoes.js'
import { artefatos } from '../../stores/portal.js'

function plural(n, singular, pluralForm) { return `${n} ${n === 1 ? singular : pluralForm}` }

const secoes = computed(() => [
  { to: '/admin/informacoes/editais',      titulo: 'Editais',      icon: clipboardIcon, cor: 'roxo',       info: plural(editais.value.length, 'edital', 'editais') },
  { to: '/admin/informacoes/tamburetei',   titulo: 'Tamburetei',   icon: usersIcon,     cor: 'amarelo',     info: 'Editar texto e link' },
  { to: '/admin/informacoes/professores',  titulo: 'Professores',  icon: userIcon,      cor: 'verde',       info: plural(professores.value.length, 'professor', 'professores') },
  { to: '/admin/informacoes/laboratorios', titulo: 'Laboratórios', icon: flaskIcon,     cor: 'vermelho',    info: plural(laboratorios.value.length, 'laboratório', 'laboratórios') },
  { to: '/admin/portal',                   titulo: 'Portal',       icon: archiveIcon,   cor: 'kraft',       info: plural(artefatos.value.length, 'artefato', 'artefatos') },
])
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/painel" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Gestão de <span>Informações</span></h2>
      </div>

      <div class="info-hub-grid">
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
  </div>
</template>

<style scoped>
.info-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.1rem;
}

.info-hub-card {
  background: var(--branco);
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

.info-hub-card--roxo     .info-hub-card-icon { background: var(--roxo); }
.info-hub-card--amarelo  .info-hub-card-icon { background: var(--amarelo); color: var(--roxo-escuro); }
.info-hub-card--verde    .info-hub-card-icon { background: var(--verde); }
.info-hub-card--vermelho .info-hub-card-icon { background: var(--vermelho); }
.info-hub-card--kraft    .info-hub-card-icon { background: var(--kraft); color: var(--roxo-escuro); }

.info-hub-card--roxo     { border-left: 4px solid var(--roxo); }
.info-hub-card--amarelo  { border-left: 4px solid var(--amarelo); }
.info-hub-card--verde    { border-left: 4px solid var(--verde); }
.info-hub-card--vermelho { border-left: 4px solid var(--vermelho); }
.info-hub-card--kraft    { border-left: 4px solid var(--kraft); }

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

<script setup>
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const secoes = [
  { to: '/informacoes/editais',       titulo: 'Editais',       desc: 'Editais e comunicados oficiais do CAESI e do curso.' },
  { to: '/informacoes/tamburetei',    titulo: 'Tamburetei',    desc: 'Resumos, provas antigas e materiais colaborativos — mantido pela OpenDev UFCG.' },
  { to: '/informacoes/professores',   titulo: 'Professores',   desc: 'Corpo docente do curso, com links de Lattes e localização.' },
  { to: '/informacoes/laboratorios',  titulo: 'Laboratórios',  desc: 'Laboratórios de pesquisa e extensão do departamento.' },
]
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Informações do <span>CAESI</span></h2>
      </div>

      <div class="info-hub-grid">
        <RouterLink v-for="s in secoes" :key="s.to" :to="s.to" class="info-hub-card">
          <div class="info-hub-card-titulo">{{ s.titulo }}</div>
          <p class="info-hub-card-desc">{{ s.desc }}</p>
          <span class="mural-card-arrow">Ver mais →</span>
        </RouterLink>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.info-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.1rem;
}

.info-hub-card {
  background: var(--creme);
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.4rem 1.3rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.info-hub-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}

.info-hub-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--roxo-escuro);
}

.info-hub-card-desc {
  font-size: 0.85rem;
  color: var(--preto);
  opacity: 0.75;
  line-height: 1.55;
  flex: 1;
}

.mural-card-arrow {
  font-size: 0.77rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
}
</style>

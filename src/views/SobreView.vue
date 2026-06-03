<script setup>
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { equipe, descricaoGestao, gestaoInfo } from '../stores/equipe.js'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/') }
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:3.5rem;flex:1;">
      <button class="back-link" style="margin-bottom:1.2rem;" @click="voltar">← Voltar</button>
      <div class="section-label">Quem somos</div>
      <h1 class="section-title">Sobre o <span>CAESI</span></h1>

      <div class="paper paper-mb-lg">
        <h2 class="paper-title">Missão</h2>
        <p style="font-size:0.95rem;color:var(--preto);line-height:1.75;margin-bottom:1.2rem;">
          O CAESI, Centro Acadêmico de Ciência da Computação, é a entidade estudantil
          que representa os alunos do curso de Ciência da Computação da UFCG. Nossa missão é defender
          os direitos e interesses dos estudantes, promover a integração acadêmica e facilitar a comunicação
          entre o corpo discente e a instituição.
        </p>
        <p style="font-size:0.95rem;color:var(--preto);line-height:1.75;">
          A ouvidoria é um dos nossos canais mais importantes: um espaço para que qualquer aluno possa
          relatar problemas, sugerir melhorias ou entrar em contato com o CAESI de forma segura, inclusive anônima.
        </p>
      </div>

      <div class="paper paper-mb-lg">
        <div class="gestao-header">
          <div>
            <h2 class="paper-title" style="margin-bottom:0;">Gestão atual</h2>
            <div v-if="gestaoInfo.nomeChapa" class="chapa-nome">{{ gestaoInfo.nomeChapa }}</div>
          </div>
          <div v-if="gestaoInfo.periodo" class="chapa-periodo">{{ gestaoInfo.periodo }}</div>
        </div>
        <div class="equipe-grid">
          <div v-for="m in equipe" :key="m.diretoria" class="membro-card">
            <div class="membro-avatar">
              <img v-if="m.foto" :src="m.foto" :alt="m.presidente" class="membro-foto">
              <span v-else class="membro-inicial">{{ m.presidente?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="label-sm" style="margin-bottom:3px;">Diretoria {{ m.diretoria }}</div>
            <div class="membro-nome">{{ m.presidente || '—' }}</div>
          </div>
        </div>

        <div v-if="descricaoGestao" class="gestao-desc">
          <div class="label-sm" style="margin-bottom:0.6rem;">Sobre a gestão</div>
          <p class="gestao-texto">{{ descricaoGestao }}</p>
        </div>
      </div>

      <div class="paper">
        <h2 class="paper-title">Onde nos encontrar</h2>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;color:var(--preto);">
            <span v-html="mapPinIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            Sala do CAESI — Bloco CP, UFCG, Campina Grande – PB
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;">
            <span v-html="mailIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            <a href="mailto:caesi@ccc.ufcg.edu.br"
              style="color:var(--roxo-escuro);font-weight:600;text-decoration:none;">caesi@ccc.ufcg.edu.br</a>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;color:var(--preto);">
            <span v-html="instagramIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            <a href="https://instagram.com/caesiufcg" target="_blank" rel="noopener"
              style="color:var(--roxo-escuro);font-weight:600;text-decoration:none;">@caesiufcg</a>&nbsp;no Instagram
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.equipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.membro-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem 0.8rem 1rem;
  gap: 0.35rem;
}

.membro-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
}

.membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.membro-inicial {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--creme);
  line-height: 1;
}

.membro-nome {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--preto);
  line-height: 1.3;
}

.gestao-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.chapa-nome {
  font-family: 'Syne', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--roxo);
  margin-top: 4px;
}

.chapa-periodo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cinza);
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
}

.gestao-desc {
  margin-top: 1.6rem;
  padding-top: 1.4rem;
  border-top: 1.5px solid var(--creme-escuro);
}

.gestao-texto {
  font-size: 0.95rem;
  color: var(--preto);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
}
</style>

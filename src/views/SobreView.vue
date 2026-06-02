<script setup>
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { equipe } from '../stores/equipe.js'

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
        <h2 class="paper-title" style="margin-bottom:1.2rem;">Gestão atual</h2>
        <div class="field-grid">
          <div v-for="m in equipe" :key="m.diretoria"
            style="background:var(--branco);border:2px solid var(--creme-escuro);border-radius:2px;padding:14px 16px;">
            <div class="label-sm" style="margin-bottom:4px;">Diretoria {{ m.diretoria }}</div>
            <div style="font-size:0.95rem;color:var(--preto);font-weight:600;">
              {{ m.presidente || '—' }}
            </div>
          </div>
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

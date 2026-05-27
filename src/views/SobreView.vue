<script setup>
import PublicNavbar from '../components/PublicNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { equipe } from '../stores/equipe.js'
</script>

<template>
  <div style="min-height:100vh;display:flex;flex-direction:column;">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <PublicNavbar />

    <div class="home-section" style="padding-top:3.5rem;flex:1;">
      <div class="section-label">Quem somos</div>
      <h1 class="section-title">Sobre o <span>CAESI</span></h1>

      <div class="paper" style="margin-bottom:1.5rem;">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--roxo-escuro);margin-bottom:1rem;">
          Missão
        </h2>
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

      <div class="paper" style="margin-bottom:1.5rem;">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--roxo-escuro);margin-bottom:1.2rem;">
          Gestão atual
        </h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div v-for="m in equipe" :key="m.diretoria"
            style="background:var(--branco);border:2px solid var(--creme-escuro);border-radius:2px;padding:14px 16px;">
            <div style="font-size:0.72rem;font-weight:700;color:var(--roxo-escuro);text-transform:uppercase;letter-spacing:0.06em;font-family:'Syne',sans-serif;margin-bottom:4px;">
              Diretoria {{ m.diretoria }}
            </div>
            <div style="font-size:0.95rem;color:var(--preto);font-weight:600;">
              {{ m.presidente || '—' }}
            </div>
          </div>
        </div>
      </div>

      <div class="paper">
        <h2 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;color:var(--roxo-escuro);margin-bottom:1rem;">
          Onde nos encontrar
        </h2>
        <p style="font-size:0.92rem;color:var(--preto);line-height:1.7;margin-bottom:0.6rem;">
          📍 Sala do CAESI — Bloco CP, UFCG, Campina Grande – PB
        </p>
        <p style="font-size:0.92rem;color:var(--preto);line-height:1.7;margin-bottom:0.6rem;">
          📧 caesi@ccc.ufcg.edu.br
        </p>
        <p style="font-size:0.92rem;color:var(--preto);line-height:1.7;">
          📷 <a href="https://instagram.com/caesiufcg" target="_blank" rel="noopener"
            style="color:var(--roxo-escuro);font-weight:600;text-decoration:none;">@caesiufcg</a> no Instagram
        </p>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

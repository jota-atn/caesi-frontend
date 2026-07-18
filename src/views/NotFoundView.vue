<script setup lang="ts">
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:180px;right:3%;font-size:1.4rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:420px;left:2%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="not-found-wrap">
      <div class="not-found-inner">
        <div class="not-found-code">404</div>
        <h1 style="font-family:'Archivo Black',sans-serif;font-weight:800;font-size:1.6rem;color:var(--branco);margin-bottom:1rem;">
          Página não encontrada
        </h1>
        <p style="color:rgba(255,255,255,0.7);font-size:0.95rem;line-height:1.7;margin-bottom:2rem;">
          Esse endereço não existe no CAESI Ouvidoria.<br>
          Talvez o link esteja errado ou a página tenha sido movida.
        </p>
        <RouterLink to="/" class="btn btn-amarelo">← Voltar para o início</RouterLink>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

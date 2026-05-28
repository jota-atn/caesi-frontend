<script setup>
import PublicNavbar from '../components/PublicNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
</script>

<template>
  <div style="min-height:100vh;display:flex;flex-direction:column;">
    <div class="deco-star" style="top:180px;right:3%;font-size:1.4rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:420px;left:2%;font-size:1rem;opacity:0.25;">✦</div>

    <PublicNavbar />

    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:4rem 1rem;">
      <div style="text-align:center;max-width:480px;">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:6rem;color:var(--amarelo);line-height:1;margin-bottom:0.5rem;">
          404
        </div>
        <h1 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.6rem;color:var(--branco);margin-bottom:1rem;">
          Página não encontrada
        </h1>
        <p style="color:rgba(255,255,255,0.7);font-size:0.95rem;line-height:1.7;margin-bottom:2rem;">
          Esse endereço não existe no CAESI Ouvidoria.<br>
          Talvez o link esteja errado ou a página tenha sido movida.
        </p>
        <RouterLink to="/"
          style="display:inline-block;background:var(--amarelo);color:var(--preto);font-family:'Syne',sans-serif;font-weight:700;font-size:0.95rem;padding:0.7rem 1.6rem;border-radius:2px;text-decoration:none;">
          ← Voltar para o início
        </RouterLink>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/') }
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:3.5rem;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <button class="back-link" style="align-self:flex-start;margin-bottom:1.2rem;" @click="voltar">← Voltar</button>
      <div class="paper" style="max-width:480px;width:100%;">
        <div style="font-size:3rem;margin-bottom:1rem;">🏗️</div>
        <h1 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.5rem;color:var(--roxo-escuro);margin-bottom:0.8rem;">
          Em construção
        </h1>
        <p style="font-size:0.92rem;color:var(--cinza);line-height:1.7;margin-bottom:1.5rem;">
          O estatuto do CAESI estará disponível em breve. Enquanto isso, você pode entrar em
          contato com a gestão pelo formulário de contato.
        </p>
        <RouterLink to="/contato" class="btn btn-amarelo btn-sm">Entrar em contato</RouterLink>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

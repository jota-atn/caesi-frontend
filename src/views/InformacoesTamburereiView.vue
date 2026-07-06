<script setup>
import { marked } from 'marked'
import { computed } from 'vue'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { tamburetei } from '../stores/informacoes.js'

const html = computed(() => marked.parse(tamburetei.value.descricao || ''))
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>{{ tamburetei.titulo }}</h2>
      </div>

      <div class="paper">
        <div class="tamburetei-md" v-html="html"></div>
        <a
          v-if="tamburetei.linkExterno"
          :href="tamburetei.linkExterno" target="_blank" rel="noopener"
          class="btn btn-amarelo"
          style="margin-top:1.4rem;"
        >Acessar o Tamburetei →</a>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.tamburetei-md :deep(p) { font-size: 0.95rem; color: var(--preto); line-height: 1.8; margin: 0 0 1em; }
.tamburetei-md :deep(p:last-child) { margin-bottom: 0; }
.tamburetei-md :deep(a) { color: var(--roxo); font-weight: 600; text-decoration: underline; }
.tamburetei-md :deep(strong) { font-weight: 700; }
</style>

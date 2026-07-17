<script setup>
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import MapaSecao from '../components/MapaSecao.vue'
</script>

<template>
  <div class="page">
    <Navbar />

    <div class="home-section" style="padding-top:2rem; padding-bottom:0;">
      <BackLink to="/" />
    </div>

    <MapaSecao />

    <SiteFooter />
  </div>
</template>

<style scoped>
:deep(.mapa-home-leaflet) {
  height: auto;
  aspect-ratio: 4 / 3;
}

@media (max-width: 640px) {
  :deep(.mapa-home-leaflet) {
    aspect-ratio: 1 / 1;
  }
}
</style>

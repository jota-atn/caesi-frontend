<script setup lang="ts">
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
import { contatoInfo } from '../stores/equipe.ts'
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <div class="footer-brand">CAESI <span>Ouvidoria</span></div>
        <div class="footer-brand-sub">
          Centro Acadêmico de Ciência da Computação<br>
          Universidade Federal de Campina Grande
        </div>
      </div>

      <div class="footer-group">
        <div class="footer-group-label">Navegação</div>
        <div class="footer-links">
          <RouterLink to="/sobre" class="footer-link">Sobre</RouterLink>
          <RouterLink to="/ouvidoria" class="footer-link">Ouvidoria</RouterLink>
          <RouterLink to="/mural" class="footer-link">Mural</RouterLink>
          <RouterLink to="/mapa" class="footer-link">Mapa</RouterLink>
          <RouterLink to="/informacoes" class="footer-link">Informações</RouterLink>
          <RouterLink to="/formularios" class="footer-link">Formulários</RouterLink>
        </div>
      </div>

      <div class="footer-group">
        <div class="footer-group-label">Contato</div>
        <div class="footer-links">
          <a :href="`mailto:${contatoInfo.email}`" class="footer-link footer-link--icon">
            <span v-html="mailIcon" class="footer-link-icon"></span> {{ contatoInfo.email }}
          </a>
          <a :href="`https://instagram.com/${contatoInfo.instagram}`" target="_blank" rel="noopener" class="footer-link footer-link--icon">
            <span v-html="instagramIcon" class="footer-link-icon"></span> @{{ contatoInfo.instagram }}
          </a>
          <span class="footer-link footer-link--icon footer-link--static">
            <span v-html="mapPinIcon" class="footer-link-icon"></span> {{ contatoInfo.endereco }}
          </span>
        </div>
      </div>
    </div>
    <div class="footer-copy">© {{ new Date().getFullYear() }} CAESI · Desenvolvido pelo Centro Acadêmico</div>
  </footer>
</template>

<script setup>
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
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
          <RouterLink to="/informacoes" class="footer-link">Informações</RouterLink>
        </div>
      </div>

      <div class="footer-group">
        <div class="footer-group-label">Contato</div>
        <div class="footer-links">
          <a href="mailto:caesi@ccc.ufcg.edu.br" class="footer-link footer-link--icon">
            <span v-html="mailIcon" class="footer-link-icon"></span> caesi@ccc.ufcg.edu.br
          </a>
          <a href="https://instagram.com/caesiufcg" target="_blank" rel="noopener" class="footer-link footer-link--icon">
            <span v-html="instagramIcon" class="footer-link-icon"></span> @caesiufcg
          </a>
          <span class="footer-link footer-link--icon footer-link--static">
            <span v-html="mapPinIcon" class="footer-link-icon"></span> Sala do CAESI — Bloco CP, UFCG
          </span>
        </div>
      </div>
    </div>
    <div class="footer-copy">© {{ new Date().getFullYear() }} CAESI · Desenvolvido pelo Centro Acadêmico</div>
  </footer>
</template>

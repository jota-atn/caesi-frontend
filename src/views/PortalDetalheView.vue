<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import paperclipIcon from '../assets/icons/paperclip.svg?raw'
import { artefatos } from '../stores/portal.js'

const route  = useRoute()

const artefato = computed(() => artefatos.value.find(a => a.id === Number(route.params.id)))

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/portal" />

      <div v-if="!artefato" class="empty-state">
        <p>Artefato não encontrado.</p>
        <span>Ele pode ter sido removido.</span>
      </div>

      <template v-else>
        <div class="paper paper-mb">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
            <span v-if="artefato.tipo" class="mural-tipo">{{ artefato.tipo }}</span>
            <span class="mural-data">Criado em {{ formatData(artefato.criadoEm) }}</span>
            <span v-if="artefato.editadoEm" class="mural-data">· atualizado em {{ formatData(artefato.editadoEm) }}</span>
          </div>

          <p style="font-size:0.97rem;color:var(--preto);line-height:1.7;white-space:pre-wrap;">{{ artefato.descricao }}</p>

          <template v-if="artefato.valor != null || artefato.anexo">
            <hr class="divider">
            <div class="msg-meta">
              <div v-if="artefato.valor != null" class="msg-meta-item">
                <span class="msg-meta-label">Valor:</span> {{ formatValor(artefato.valor) }}
              </div>
            </div>
            <div v-if="artefato.anexo" class="portal-anexo-item">
              <span v-html="paperclipIcon" class="portal-anexo-icon"></span>
              <span>{{ artefato.anexo.nome }}</span>
            </div>
          </template>
        </div>

        <!-- Histórico -->
        <div class="paper">
          <p class="label-sm" style="margin-bottom:1rem;">Histórico</p>
          <div class="portal-historico">
            <div v-for="(h, i) in [...artefato.historico].reverse()" :key="i" class="portal-historico-item">
              <span class="portal-historico-dot"></span>
              <div>
                <div class="portal-historico-resumo">{{ h.resumo }}</div>
                <div class="portal-historico-data">{{ formatData(h.data) }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.mural-tipo {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.mural-data { font-size: 0.78rem; color: var(--cinza); }

.portal-anexo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 0.8rem;
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  font-size: 0.86rem;
  color: var(--preto);
}
.portal-anexo-icon { display: flex; align-items: center; flex-shrink: 0; color: var(--cinza); }
.portal-anexo-icon :deep(svg) { width: 15px; height: 15px; }

.portal-historico { display: flex; flex-direction: column; gap: 1rem; }
.portal-historico-item { display: flex; gap: 12px; align-items: flex-start; }
.portal-historico-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--roxo);
  flex-shrink: 0;
  margin-top: 5px;
}
.portal-historico-resumo { font-size: 0.9rem; color: var(--preto); font-weight: 600; }
.portal-historico-data { font-size: 0.78rem; color: var(--cinza); margin-top: 2px; }

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p    { font-size: 1rem; font-weight: 600; color: var(--preto); margin-bottom: 0.4rem; }
.empty-state span { font-size: 0.85rem; color: var(--cinza); }
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 320
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <Transition name="back-top">
    <button
      v-if="visible"
      class="back-to-top"
      @click="toTop"
      aria-label="Voltar ao topo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 500;
  width: 44px;
  height: 44px;
  border-radius: 2px;
  background: var(--roxo-escuro);
  color: var(--amarelo);
  border: 2px solid var(--amarelo);
  box-shadow: 3px 3px 0 var(--amarelo);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.back-to-top:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--amarelo);
}
.back-to-top:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--amarelo);
}

.back-top-enter-active,
.back-top-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.back-top-enter-from,
.back-top-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>

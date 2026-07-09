<script setup>
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import BackToTop from './components/BackToTop.vue'
import ToastContainer from './components/ToastContainer.vue'
import { isAdmin } from './stores/auth.js'
import { useKonamiCode } from './composables/useKonamiCode.js'

watchEffect(() => {
  document.documentElement.classList.toggle('is-admin', isAdmin.value)
})

const router = useRouter()
useKonamiCode(() => router.push('/cobrinha-caesi'))
</script>

<template>
  <RouterView />
  <BackToTop />
  <ToastContainer />
</template>

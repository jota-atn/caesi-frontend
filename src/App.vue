<script setup>
import { watchEffect } from 'vue'
import BackToTop from './components/BackToTop.vue'
import ToastContainer from './components/ToastContainer.vue'
import { isAdmin } from './stores/auth.js'

watchEffect(() => {
  document.documentElement.classList.toggle('is-admin', isAdmin.value)
})
</script>

<template>
  <RouterView />
  <BackToTop />
  <ToastContainer />
</template>

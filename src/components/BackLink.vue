<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  to: { type: String, default: '/' },
  label: { type: String, default: 'Voltar' },
})

const router = useRouter()
function voltar() {
  window.history.state?.back ? router.back() : router.push(props.to)
}
</script>

<template>
  <button class="back-link" @click="voltar">← {{ label }}</button>
</template>

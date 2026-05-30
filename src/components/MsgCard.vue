<script setup>
import Badge from './Badge.vue'
import Tag from './Tag.vue'

defineProps({
  mensagem: { type: Object, required: true },
  to: { type: String, required: true },
})
</script>

<template>
  <RouterLink :to="to" class="msg-card" :class="mensagem.status">
    <div class="msg-card-info">
      <div class="msg-card-tag-row">
        <Tag :categoria="mensagem.categoria" />
        <span v-if="mensagem.anonimo" class="msg-card-anon">anônimo</span>
      </div>
      <div class="msg-card-title">{{ mensagem.assunto }}</div>
      <div class="msg-card-meta">{{ mensagem.autor }} · {{ mensagem.data }}</div>
      <div class="msg-card-preview">{{ mensagem.preview }}</div>
    </div>
    <div class="msg-card-right">
      <Badge :status="mensagem.status" />
      <span class="msg-card-arrow">→</span>
    </div>
  </RouterLink>
</template>

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
        <Tag :tipo="mensagem.tipo" />
        <span v-if="mensagem.periodo" class="msg-card-periodo">{{ mensagem.periodo }}</span>
      </div>
      <div class="msg-card-preview">{{ mensagem.preview }}</div>
      <div class="msg-card-meta">{{ mensagem.nome ?? 'Anônimo' }} · {{ mensagem.data }}</div>
    </div>
    <div class="msg-card-right">
      <Badge :status="mensagem.status" />
      <span class="msg-card-arrow">→</span>
    </div>
  </RouterLink>
</template>

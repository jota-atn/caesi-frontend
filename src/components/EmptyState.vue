<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="empty-state">
    <p>{{ title }}</p>
    <span v-if="subtitle">{{ subtitle }}</span>
  </div>
</template>

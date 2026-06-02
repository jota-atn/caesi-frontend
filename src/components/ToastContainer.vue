<script setup>
import { toasts } from '../stores/toast.js'
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-item"
          :class="`toast-${t.tipo}`"
          role="status"
        >{{ t.mensagem }}</div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

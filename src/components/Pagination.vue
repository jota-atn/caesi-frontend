<script setup lang="ts">
const props = defineProps<{
  page: number
  totalPages: number
}>()

defineEmits<{
  prev: []
  next: []
  goto: [page: number]
}>()

function visiblePages(): (number | '...')[] {
  const pages: (number | '...')[] = []
  for (let i = 1; i <= props.totalPages; i++) {
    if (i === 1 || i === props.totalPages || Math.abs(i - props.page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
}
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="pag-btn" :disabled="page === 1" @click="$emit('prev')" aria-label="Página anterior">←</button>
    <template v-for="p in visiblePages()" :key="String(p) + page">
      <button
        v-if="p !== '...'"
        class="pag-btn"
        :class="{ 'pag-btn--active': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        @click="$emit('goto', p)"
      >{{ p }}</button>
      <span v-else class="pag-dots">…</span>
    </template>
    <button class="pag-btn" :disabled="page === totalPages" @click="$emit('next')" aria-label="Próxima página">→</button>
  </div>
</template>

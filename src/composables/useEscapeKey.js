import { onMounted, onUnmounted } from 'vue'

export function useEscapeKey(handler) {
  function onKeydown(e) {
    if (e.key === 'Escape') handler()
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}

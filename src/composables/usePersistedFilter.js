import { ref, watch } from 'vue'

export function usePersistedFilter(key, defaultValue) {
  const stored = sessionStorage.getItem(key)
  const value  = ref(stored !== null ? stored : defaultValue)

  watch(value, (v) => {
    if (v === defaultValue) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, v)
    }
  })

  return value
}

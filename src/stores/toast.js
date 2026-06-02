import { ref } from 'vue'

let _id = 0
const _list = ref([])
export const toasts = _list

export function showToast(mensagem, tipo = 'success') {
  const id = ++_id
  _list.value.push({ id, mensagem, tipo })
  setTimeout(() => {
    _list.value = _list.value.filter(t => t.id !== id)
  }, 3500)
}

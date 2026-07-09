import { ref } from 'vue'

// Conquistas são 100% localStorage, de propósito — não tem relação com o backend
// e não deve virar uma feature de servidor quando ele existir.
const CHAVE_COBRINHA_ZERADA = 'caesi_cobrinha_zerou'

export const cobrinhaZerada = ref(localStorage.getItem(CHAVE_COBRINHA_ZERADA) === 'true')

// retorna true só quando desbloqueia agora (pra quem chama poder avisar o usuário só uma vez)
export function marcarCobrinhaZerada() {
  if (cobrinhaZerada.value) return false
  cobrinhaZerada.value = true
  localStorage.setItem(CHAVE_COBRINHA_ZERADA, 'true')
  return true
}

<script setup>
import { watch } from 'vue'
import BackToTop from './components/BackToTop.vue'
import ToastContainer from './components/ToastContainer.vue'
import { user } from './stores/auth.js'
import { formularios, inscricoes } from './stores/formularios.js'
import { addNotificacao } from './stores/notificacoes.js'

watch(user, (u) => {
  if (!u || u.role === 'admin') return

  const hoje    = new Date()
  const em3dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000)

  inscricoes.value
    .filter(i => i.userEmail === u.email)
    .forEach(i => {
      const f = formularios.value.find(f => f.id === i.formularioId)
      if (!f || f.status !== 'aberto' || !f.prazoInscricao) return

      const prazo = new Date(f.prazoInscricao + 'T23:59:59')
      if (prazo > hoje && prazo <= em3dias) {
        addNotificacao({
          userEmail: u.email,
          tipo: 'prazo-proximo',
          titulo: 'Prazo de inscrição se aproximando',
          subtitulo: f.titulo,
          link: `/aluno/formularios/${f.id}`,
          dedupeKey: `prazo-proximo-${f.id}-${f.prazoInscricao}`,
        })
      }
    })
}, { immediate: true })
</script>

<template>
  <RouterView />
  <BackToTop />
  <ToastContainer />
</template>

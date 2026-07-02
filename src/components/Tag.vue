<script setup>
defineProps({
  tipo: { type: String, required: true },
})

const classMap = {
  disciplina:     'tag-disciplina',
  professores:    'tag-professores',
  colegas:        'tag-colegas',
  infraestrutura: 'tag-infraestrutura',
  ofertas:        'tag-ofertas',
  grupos:         'tag-grupos',
  outros:         'tag-outros',
}

const labelMap = {
  disciplina:     'Disciplina',
  professores:    'Professores',
  colegas:        'Colegas de curso',
  infraestrutura: 'Infraestrutura',
  ofertas:        'Ofertas e horários',
  grupos:         'Grupos estudantis',
  outros:         'Outros',
}
</script>

<template>
  <span class="tag" :class="classMap[tipo] ?? 'tag-outros'">
    {{ labelMap[tipo] ?? tipo }}
  </span>
</template>

<script setup>
import { ref } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { equipe, saveEquipe } from '../../stores/equipe.js'

const form = ref(equipe.value.map(d => ({ ...d })))
const msg = ref({ tipo: '', texto: '' })

function salvar() {
  msg.value = { tipo: '', texto: '' }

  for (const d of form.value) {
    if (!d.presidente.trim()) {
      msg.value = { tipo: 'erro', texto: `Preencha o presidente da Diretoria ${d.diretoria}.` }
      return
    }
  }

  saveEquipe(form.value.map(d => ({ ...d, presidente: d.presidente.trim() })))
  msg.value = { tipo: 'ok', texto: 'Equipe atualizada com sucesso!' }
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar :admin="true" />

    <div class="page-content">
      <div class="page-heading">
        <h2>Gestão da <span>Equipe</span></h2>
      </div>

      <div class="paper">
        <p style="font-size:0.88rem;color:var(--cinza);margin-bottom:1.8rem;line-height:1.6;">
          Edite os nomes dos presidentes de cada diretoria. As alterações serão refletidas imediatamente na página <strong>Sobre</strong> do site.
        </p>

        <div v-for="(d, i) in form" :key="d.diretoria" class="field">
          <label :for="`diretoria-${i}`">Diretoria {{ d.diretoria }}</label>
          <input
            :id="`diretoria-${i}`"
            v-model="form[i].presidente"
            type="text"
            :placeholder="`Nome do presidente — Diretoria ${d.diretoria}`"
          >
        </div>

        <div v-if="msg.texto" class="feedback-msg" :class="msg.tipo" style="margin-bottom:1rem;">
          {{ msg.texto }}
        </div>

        <button class="btn btn-primary" @click="salvar">
          Salvar equipe →
        </button>
      </div>
    </div>
  </div>
</template>

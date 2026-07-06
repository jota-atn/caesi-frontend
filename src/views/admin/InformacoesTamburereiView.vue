<script setup>
import { ref } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { tamburetei, saveTamburetei } from '../../stores/informacoes.js'
import { showToast } from '../../stores/toast.js'

const form = ref({ ...tamburetei.value })
const salvo = ref(false)

function salvar() {
  if (!form.value.titulo.trim()) return
  saveTamburetei({
    titulo: form.value.titulo.trim(),
    descricao: form.value.descricao.trim(),
    linkExterno: form.value.linkExterno.trim(),
  })
  salvo.value = true
  showToast('Página do Tamburetei atualizada.', 'success')
  setTimeout(() => { salvo.value = false }, 2000)
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Tamburetei <span>Admin</span></h2>
      </div>

      <div class="paper">
        <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
          Esse é um bloco de texto único (não uma lista) — edite o conteúdo que aparece na página pública "Tamburetei". Suporta Markdown.
        </p>

        <div class="field">
          <label class="label">Título *</label>
          <input v-model="form.titulo" type="text" class="input">
        </div>

        <div class="field">
          <label class="label">Descrição <span class="field-hint">(Markdown)</span></label>
          <textarea v-model="form.descricao" class="input textarea" rows="10"></textarea>
        </div>

        <div class="field">
          <label class="label">Link externo</label>
          <input v-model="form.linkExterno" type="url" class="input" placeholder="https://tamburetei.opendevufcg.org/">
        </div>

        <button class="btn btn-primary" :style="salvo ? 'background:var(--verde);border-color:var(--verde);' : ''" @click="salvar">
          {{ salvo ? '✓ Salvo' : 'Salvar →' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.textarea { min-height: 220px; resize: vertical; }
</style>

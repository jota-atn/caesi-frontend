<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { markdownParaHtmlSeguro } from '../utils/markdown.js'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { tamburetei, saveTamburetei } from '../stores/informacoes.js'
import { isAdmin } from '../stores/auth.js'
import { showToast } from '../stores/toast.js'
import { isUrl } from '../utils/validation.js'

const route = useRoute()
const html = computed(() => markdownParaHtmlSeguro(tamburetei.value.descricao))

const editando = ref(isAdmin.value && route.query.editar === '1')
const form = ref({ ...tamburetei.value })
const salvo = ref(false)
const erros = ref({})

function iniciarEdicao() {
  form.value = { ...tamburetei.value }
  erros.value = {}
  editando.value = true
}

function salvar() {
  if (!form.value.titulo.trim()) { showToast('Informe o título da página.', 'error'); return }
  const linkInvalido = form.value.linkExterno.trim() && !isUrl(form.value.linkExterno)
  erros.value = { linkExterno: linkInvalido }
  if (linkInvalido) return
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
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>{{ tamburetei.titulo }}</h2>
        <button v-if="isAdmin" type="button" class="btn btn-outline btn-outline-creme btn-sm" @click="editando ? (editando = false) : iniciarEdicao()">
          {{ editando ? 'Sair da edição' : '✎ Editar página' }}
        </button>
      </div>

      <div v-if="!editando" class="paper">
        <div class="tamburetei-md" v-html="html"></div>
        <a
          v-if="tamburetei.linkExterno"
          :href="tamburetei.linkExterno" target="_blank" rel="noopener"
          class="btn btn-amarelo"
          style="margin-top:1.4rem;"
        >Acessar o Tamburetei →</a>
      </div>

      <!-- Admin: edição do bloco único -->
      <div v-else class="paper">
        <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
          Esse é um bloco de texto único (não uma lista) — edite o conteúdo que aparece nesta página. Suporta Markdown.
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
          <input v-model="form.linkExterno" type="url" class="input" placeholder="https://tamburetei.opendevufcg.org/" :class="{ invalid: erros.linkExterno }">
          <span v-if="erros.linkExterno" class="error-msg" style="display:block;">Informe um link válido.</span>
        </div>

        <button class="btn btn-primary" :style="salvo ? 'background:var(--verde);border-color:var(--verde);' : ''" @click="salvar">
          {{ salvo ? '✓ Salvo' : 'Salvar →' }}
        </button>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.tamburetei-md :deep(p) { font-size: 0.95rem; color: var(--preto); line-height: 1.8; margin: 0 0 1em; }
.tamburetei-md :deep(p:last-child) { margin-bottom: 0; }
.tamburetei-md :deep(a) { color: var(--roxo); font-weight: 600; text-decoration: underline; }
.tamburetei-md :deep(strong) { font-weight: 700; }

.textarea { min-height: 220px; resize: vertical; max-height: 600px; }
</style>

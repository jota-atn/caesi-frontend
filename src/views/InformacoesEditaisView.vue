<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import paperclipIcon from '../assets/icons/paperclip.svg?raw'
import { editais, addEdital, updateEdital, deleteEdital } from '../stores/informacoes.js'
import { isAdmin } from '../stores/auth.js'
import { showToast } from '../stores/toast.js'
import { isTodayOrFuture } from '../utils/validation.js'

const route = useRoute()
const busca = ref(route.query.busca ?? '')
const expandidoId = ref(null)

const lista = computed(() => {
  const t = busca.value.toLowerCase().trim()
  const base = [...editais.value].sort((a, b) => (b.data ?? b.criadoEm).localeCompare(a.data ?? a.criadoEm))
  if (!t) return base
  return base.filter(e => e.titulo.toLowerCase().includes(t) || e.descricao.toLowerCase().includes(t))
})

function toggleExpandir(id) {
  if (editandoId.value !== null) return
  expandidoId.value = expandidoId.value === id ? null : id
}

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function validarTitulo(titulo) {
  return titulo.trim().length < 3 ? 'Título obrigatório (mín. 3 caracteres).' : ''
}

// ── Admin: novo edital ────────────────────────────────────
const mostrarForm = ref(false)
const fileAddRef  = ref(null)
const formAdd = reactive({ titulo: '', descricao: '', data: '', anexoNome: '' })
const erros   = reactive({ titulo: '', data: '' })

function onArquivoAdd(e) { formAdd.anexoNome = e.target.files?.[0]?.name ?? '' }

function publicar() {
  erros.titulo = validarTitulo(formAdd.titulo)
  erros.data   = !isTodayOrFuture(formAdd.data) ? 'A data não pode estar no passado.' : ''
  if (erros.titulo || erros.data) return
  addEdital({
    titulo: formAdd.titulo.trim(),
    descricao: formAdd.descricao.trim(),
    data: formAdd.data || null,
    anexo: formAdd.anexoNome ? { nome: formAdd.anexoNome } : null,
  })
  Object.assign(formAdd, { titulo: '', descricao: '', data: '', anexoNome: '' })
  mostrarForm.value = false
  showToast('Edital publicado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { titulo: '', descricao: '', data: '', anexoNome: '' })
  Object.assign(erros, { titulo: '', data: '' })
  mostrarForm.value = false
}

// ── Admin: editar/excluir edital ──────────────────────────
const editandoId  = ref(null)
const fileEditRef = ref(null)
const formEdit  = reactive({ titulo: '', descricao: '', data: '', anexoNome: '' })
const errosEdit = reactive({ titulo: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(e) {
  editandoId.value = e.id
  expandidoId.value = null
  errosEdit.titulo = ''
  Object.assign(formEdit, { titulo: e.titulo, descricao: e.descricao, data: e.data ?? '', anexoNome: e.anexo?.nome ?? '' })
}
function onArquivoEdit(e) { formEdit.anexoNome = e.target.files?.[0]?.name ?? '' }

function salvarEdit(id) {
  errosEdit.titulo = validarTitulo(formEdit.titulo)
  if (errosEdit.titulo) return
  updateEdital(id, {
    titulo: formEdit.titulo.trim(),
    descricao: formEdit.descricao.trim(),
    data: formEdit.data || null,
    anexo: formEdit.anexoNome ? { nome: formEdit.anexoNome } : null,
  })
  editandoId.value = null
  showToast('Edital atualizado.', 'success')
}
function cancelarEdit() { editandoId.value = null }

function excluir(e) {
  if (!confirm(`Remover o edital "${e.titulo}"?`)) return
  deleteEdital(e.id)
  showToast('Edital removido.', 'info')
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Editais do <span>CAESI</span></h2>
        <button v-if="isAdmin" type="button" class="btn btn-outline btn-outline-creme btn-sm" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo edital' }}
        </button>
      </div>

      <!-- Admin: novo edital -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Novo edital</div>

        <div class="field">
          <label class="label">Título *</label>
          <input v-model="formAdd.titulo" type="text" class="input" placeholder="Título do edital">
          <span v-if="erros.titulo" class="error-msg" style="display:block;">{{ erros.titulo }}</span>
        </div>

        <div class="field">
          <label class="label">Data <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.data" type="date" class="input" style="max-width:180px;" :class="{ invalid: erros.data }">
          <span v-if="erros.data" class="error-msg" style="display:block;">{{ erros.data }}</span>
        </div>

        <div class="field">
          <label class="label">Descrição</label>
          <textarea v-model="formAdd.descricao" class="input textarea" rows="5" placeholder="Descrição do edital…"></textarea>
        </div>

        <div class="field">
          <label class="label">Anexo <span class="field-hint">(opcional)</span></label>
          <button type="button" class="btn-foto" @click="fileAddRef.click()">{{ formAdd.anexoNome || '+ Anexar arquivo' }}</button>
          <input ref="fileAddRef" type="file" accept=".pdf,image/*" style="display:none" @change="onArquivoAdd">
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="cancelarAdd">Cancelar</button>
          <button class="btn btn-primary" @click="publicar">Publicar</button>
        </div>
      </div>

      <input v-model="busca" type="search" class="mural-search" placeholder="Buscar edital…" style="margin-bottom:1.2rem;">

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ editais.length === 0 ? 'Nenhum edital publicado ainda.' : 'Nenhum edital encontrado.' }}</p>
      </div>

      <div class="evento-lista">
        <div v-for="e in lista" :key="e.id">
          <!-- Edição inline (admin) -->
          <div v-if="editandoId === e.id" class="evento-card evento-card--edit">
            <div style="flex:1;">
              <div class="label-sm" style="margin-bottom:0.8rem;">Editando edital</div>
              <div class="field">
                <label class="label">Título *</label>
                <input v-model="formEdit.titulo" type="text" class="input">
                <span v-if="errosEdit.titulo" class="error-msg" style="display:block;">{{ errosEdit.titulo }}</span>
              </div>
              <div class="field">
                <label class="label">Data</label>
                <input v-model="formEdit.data" type="date" class="input" style="max-width:180px;">
              </div>
              <div class="field">
                <label class="label">Descrição</label>
                <textarea v-model="formEdit.descricao" class="input textarea" rows="5"></textarea>
              </div>
              <div class="field">
                <label class="label">Anexo</label>
                <button type="button" class="btn-foto" @click="triggerFileEdit()">{{ formEdit.anexoNome || '+ Anexar arquivo' }}</button>
                <input ref="fileEditRef" type="file" accept=".pdf,image/*" style="display:none" @change="onArquivoEdit">
              </div>
              <div class="form-actions">
                <button class="btn btn-outline" @click="cancelarEdit">Cancelar</button>
                <button class="btn btn-primary" @click="salvarEdit(e.id)">Salvar</button>
              </div>
            </div>
          </div>

          <!-- Leitura / expansão -->
          <div
            v-else
            class="evento-card"
            role="button"
            tabindex="0"
            :aria-expanded="expandidoId === e.id"
            @click="toggleExpandir(e.id)"
            @keydown.enter="toggleExpandir(e.id)"
            @keydown.space.prevent="toggleExpandir(e.id)"
          >
            <div class="evento-corpo">
              <div class="evento-top">
                <span class="evento-nome">{{ e.titulo }}</span>
                <span v-if="e.data" class="mural-data">{{ formatData(e.data) }}</span>
              </div>
              <p v-if="expandidoId === e.id && e.descricao" class="evento-desc">{{ e.descricao }}</p>
              <div v-if="expandidoId === e.id && e.anexo" class="editais-anexo">
                <span v-html="paperclipIcon" class="editais-anexo-icon"></span>{{ e.anexo.nome }}
              </div>
              <div v-if="expandidoId === e.id && isAdmin" class="pub-card-actions" @click.stop>
                <button type="button" class="btn btn-outline pub-card-btn" @click="abrirEdit(e)">Editar</button>
                <button type="button" class="btn btn-outline pub-card-btn pub-card-btn--danger" @click="excluir(e)">Excluir</button>
              </div>
            </div>
            <span class="evento-toggle">{{ expandidoId === e.id ? '−' : '+' }}</span>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.mural-search {
  width: 100%;
  padding: 9px 14px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.92rem;
  color: var(--preto);
  outline: none;
  transition: border-color 0.2s;
}
.mural-search:focus { border-color: var(--roxo); }
.mural-data { font-size: 0.78rem; color: var(--cinza); }

.evento-lista { display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1rem; }

.evento-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  padding: 0.9rem 1.1rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.evento-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--roxo-escuro); }

.evento-corpo { flex: 1; min-width: 0; }
.evento-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.evento-nome { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 0.98rem; color: var(--preto); }
.evento-desc { font-size: 0.85rem; color: var(--preto); opacity: 0.75; line-height: 1.55; margin-top: 0.5rem; white-space: pre-wrap; }
.evento-toggle { flex-shrink: 0; font-family: 'Archivo Black', sans-serif; font-size: 1.1rem; color: var(--roxo-escuro); line-height: 1; }

.editais-anexo {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: var(--cinza);
}
.editais-anexo-icon { display: flex; align-items: center; }
.editais-anexo-icon :deep(svg) { width: 14px; height: 14px; }

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
  margin-bottom: 1.4rem;
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }

/* ── Admin: form, edição inline e ações ───────────────────── */
.evento-card--edit { cursor: default; }
.evento-card--edit:hover { transform: none; box-shadow: 3px 3px 0 var(--roxo-escuro); }

.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.btn-foto {
  padding: 7px 14px;
  background: var(--branco);
  border: 2px dashed var(--roxo);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.84rem;
  color: var(--roxo-escuro);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-foto:hover { background: rgba(80,64,160,0.07); }

.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.6rem; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }
</style>

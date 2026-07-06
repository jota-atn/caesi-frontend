<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { editais, addEdital, updateEdital, deleteEdital } from '../../stores/informacoes.js'
import { showToast } from '../../stores/toast.js'
import paperclipIcon from '../../assets/icons/paperclip.svg?raw'

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

// --------------- Formulário adicionar ---------------
const mostrarForm = ref(false)
const fileAddRef  = ref(null)
const formAdd = reactive({ titulo: '', descricao: '', data: '', anexoNome: '' })
const erros   = reactive({ titulo: '' })

function validarTitulo(titulo) {
  return titulo.trim().length < 3 ? 'Título obrigatório (mín. 3 caracteres).' : ''
}

function validar(form) {
  erros.titulo = validarTitulo(form.titulo)
  return !erros.titulo
}

function onArquivoAdd(e) { formAdd.anexoNome = e.target.files?.[0]?.name ?? '' }

function publicar() {
  if (!validar(formAdd)) return
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
  erros.titulo = ''
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)
const formEdit = reactive({ titulo: '', descricao: '', data: '', anexoNome: '' })
const errosEdit = reactive({ titulo: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(e) {
  editandoId.value = e.id
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

// --------------- Exclusão ---------------
const confirmarDeleteId = ref(null)
function pedirDelete(id)  { confirmarDeleteId.value = id }
function cancelarDelete() { confirmarDeleteId.value = null }
function confirmarDelete(id) {
  deleteEdital(id)
  confirmarDeleteId.value = null
  showToast('Edital removido.', 'info')
}

// --------------- Busca ---------------
const busca = ref('')
const lista = computed(() => {
  const t = busca.value.toLowerCase()
  const base = [...editais.value].sort((a, b) => (b.data ?? b.criadoEm).localeCompare(a.data ?? a.criadoEm))
  if (!t) return base
  return base.filter(e => e.titulo.toLowerCase().includes(t) || e.descricao.toLowerCase().includes(t))
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Editais <span>Admin</span></h2>
        <button class="btn btn-primary" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo edital' }}
        </button>
      </div>

      <!-- Formulário adicionar -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Novo edital</div>

        <div class="field">
          <label class="label">Título *</label>
          <input v-model="formAdd.titulo" type="text" class="input" placeholder="Título do edital">
          <span v-if="erros.titulo" class="error-msg" style="display:block;">{{ erros.titulo }}</span>
        </div>

        <div class="field">
          <label class="label">Data <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.data" type="date" class="input" style="max-width:180px;">
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

      <!-- Busca -->
      <div class="mural-search-row">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar editais…">
        <span class="mural-count">{{ editais.length }} edital{{ editais.length === 1 ? '' : 'is' }}</span>
      </div>

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ editais.length === 0 ? 'Nenhum edital publicado ainda.' : 'Nenhum edital encontrado.' }}</p>
      </div>

      <div v-for="e in lista" :key="e.id" class="pub-card">
        <template v-if="editandoId !== e.id">
          <div class="pub-card-top">
            <span v-if="e.data" class="pub-tipo">{{ formatData(e.data) }}</span>
            <span class="pub-card-data">Criado em {{ formatData(e.criadoEm) }}</span>
          </div>
          <div class="pub-card-titulo">{{ e.titulo }}</div>
          <div class="pub-card-preview">{{ e.descricao }}</div>
          <div v-if="e.anexo" class="editais-admin-anexo">
            <span v-html="paperclipIcon" class="editais-admin-anexo-icon"></span>{{ e.anexo.nome }}
          </div>

          <div class="pub-card-actions">
            <button class="btn btn-outline pub-card-btn" @click="abrirEdit(e)">Editar</button>
            <button v-if="confirmarDeleteId === e.id" class="btn btn-danger pub-card-btn" @click="confirmarDelete(e.id)">Confirmar exclusão</button>
            <button v-else class="btn btn-outline pub-card-btn pub-card-btn--danger" @click="pedirDelete(e.id)">Excluir</button>
            <button v-if="confirmarDeleteId === e.id" class="btn btn-outline pub-card-btn" @click="cancelarDelete">Cancelar</button>
          </div>
        </template>

        <template v-else>
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
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mural-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1.2rem; flex-wrap: wrap; }
.mural-search {
  flex: 1; min-width: 180px; padding: 9px 14px; background: var(--branco);
  border: 2px solid var(--creme-escuro); border-radius: 2px; font-family: 'Archivo', sans-serif;
  font-size: 0.92rem; color: var(--preto); outline: none; transition: border-color 0.2s;
}
.mural-search:focus { border-color: var(--roxo); }
.mural-count { font-size: 0.8rem; color: var(--cinza); flex-shrink: 0; }

.btn-foto {
  padding: 7px 14px; background: var(--branco); border: 2px dashed var(--roxo); border-radius: 2px;
  font-family: 'Archivo', sans-serif; font-size: 0.84rem; color: var(--roxo-escuro); cursor: pointer; transition: background 0.15s;
}
.btn-foto:hover { background: rgba(80,64,160,0.07); }

.pub-card {
  background: var(--branco); border: 1.5px solid var(--creme-escuro); border-left: 4px solid var(--roxo);
  border-radius: 2px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.pub-card-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 0.5rem; }
.pub-tipo {
  font-size: 0.69rem; font-weight: 700; font-family: 'Archivo Black', sans-serif; padding: 2px 8px; border-radius: 2px;
  background: rgba(80,64,160,0.12); color: var(--roxo-escuro); border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.pub-card-data { font-size: 0.74rem; color: var(--cinza); }
.pub-card-titulo { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 1rem; color: var(--preto); margin-bottom: 0.4rem; }
.pub-card-preview { font-size: 0.84rem; color: var(--preto); opacity: 0.6; line-height: 1.55; margin-bottom: 0.6rem; white-space: pre-wrap; }
.editais-admin-anexo { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--cinza); margin-bottom: 0.6rem; }
.editais-admin-anexo-icon { display: flex; align-items: center; }
.editais-admin-anexo-icon :deep(svg) { width: 13px; height: 13px; }
.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

.textarea { min-height: 120px; resize: vertical; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

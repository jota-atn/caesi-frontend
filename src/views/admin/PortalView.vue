<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { artefatos, addArtefato, updateArtefato, deleteArtefato } from '../../stores/portal.js'
import { showToast } from '../../stores/toast.js'
import paperclipIcon from '../../assets/icons/paperclip.svg?raw'

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

// --------------- Formulário adicionar ---------------
const mostrarForm = ref(false)
const fileAddRef  = ref(null)
const formAdd = reactive({ tipo: '', descricao: '', valor: '', anexoNome: '' })
const erros   = reactive({ descricao: '', valor: '' })

function parseValor(str) {
  if (str === '' || str == null) return { valor: null, error: null }
  const num = Number(String(str).replace(',', '.'))
  if (Number.isNaN(num) || num < 0) return { valor: null, error: 'Valor inválido.' }
  return { valor: num, error: null }
}

function validar(form) {
  erros.descricao = form.descricao.trim().length < 5 ? 'Descrição obrigatória (mín. 5 caracteres).' : ''
  erros.valor = parseValor(form.valor).error ?? ''
  return !erros.descricao && !erros.valor
}

function onArquivoAdd(e) {
  formAdd.anexoNome = e.target.files?.[0]?.name ?? ''
}

function publicar() {
  if (!validar(formAdd)) return
  addArtefato({
    tipo: formAdd.tipo.trim(),
    descricao: formAdd.descricao.trim(),
    valor: parseValor(formAdd.valor).valor,
    anexo: formAdd.anexoNome ? { nome: formAdd.anexoNome } : null,
  })
  Object.assign(formAdd, { tipo: '', descricao: '', valor: '', anexoNome: '' })
  mostrarForm.value = false
  showToast('Artefato adicionado ao portal.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { tipo: '', descricao: '', valor: '', anexoNome: '' })
  erros.descricao = ''
  erros.valor = ''
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)
const formEdit = reactive({ tipo: '', descricao: '', valor: '', anexoNome: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(a) {
  editandoId.value = a.id
  confirmarDeleteId.value = null
  Object.assign(formEdit, {
    tipo: a.tipo ?? '',
    descricao: a.descricao,
    valor: a.valor ?? '',
    anexoNome: a.anexo?.nome ?? '',
  })
}

function onArquivoEdit(e) {
  formEdit.anexoNome = e.target.files?.[0]?.name ?? ''
}

function salvarEdit(id) {
  if (formEdit.descricao.trim().length < 5) {
    showToast('Descrição obrigatória (mín. 5 caracteres).', 'error')
    return
  }
  const { valor, error } = parseValor(formEdit.valor)
  if (error) { showToast(error, 'error'); return }
  updateArtefato(id, {
    tipo: formEdit.tipo.trim(),
    descricao: formEdit.descricao.trim(),
    valor,
    anexo: formEdit.anexoNome ? { nome: formEdit.anexoNome } : null,
  })
  editandoId.value = null
  showToast('Artefato atualizado.', 'success')
}

function cancelarEdit() { editandoId.value = null }

// --------------- Exclusão ---------------
const confirmarDeleteId = ref(null)
function pedirDelete(id)  { confirmarDeleteId.value = id }
function cancelarDelete() { confirmarDeleteId.value = null }
function confirmarDelete(id) {
  deleteArtefato(id)
  confirmarDeleteId.value = null
  showToast('Artefato removido.', 'info')
}

// --------------- Busca ---------------
const busca = ref('')
const lista = computed(() => {
  const t = busca.value.toLowerCase()
  const base = [...artefatos.value].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  if (!t) return base
  return base.filter(a =>
    a.descricao.toLowerCase().includes(t) ||
    (a.tipo ?? '').toLowerCase().includes(t)
  )
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/painel" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Portal <span>Admin</span></h2>
        <button class="btn btn-primary" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo artefato' }}
        </button>
      </div>

      <!-- Formulário adicionar -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Novo artefato</div>

        <div class="field">
          <label class="label">Tipo <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.tipo" type="text" class="input" placeholder="Ex.: Nota Fiscal, Ata de Reunião, Ofício…">
        </div>

        <div class="field">
          <label class="label">Descrição / Objeto *</label>
          <textarea v-model="formAdd.descricao" class="input textarea" rows="5" placeholder="Descreva o artefato…" :class="{ invalid: erros.descricao }"></textarea>
          <span class="error-msg">{{ erros.descricao }}</span>
        </div>

        <div class="field">
          <label class="label">Valor (R$) <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.valor" type="text" inputmode="decimal" class="input" placeholder="0,00" style="max-width:180px;" :class="{ invalid: erros.valor }">
          <span class="error-msg">{{ erros.valor }}</span>
        </div>

        <div class="field">
          <label class="label">Documento comprobatório <span class="field-hint">(opcional)</span></label>
          <button type="button" class="btn-foto" @click="fileAddRef.click()">
            {{ formAdd.anexoNome || '+ Anexar documento' }}
          </button>
          <input ref="fileAddRef" type="file" accept="image/*,.pdf" style="display:none" @change="onArquivoAdd">
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="cancelarAdd">Cancelar</button>
          <button class="btn btn-primary" @click="publicar">Publicar</button>
        </div>
      </div>

      <!-- Busca -->
      <div class="mural-search-row">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar artefatos…">
        <span class="mural-count">{{ artefatos.length }} artefato{{ artefatos.length === 1 ? '' : 's' }}</span>
      </div>

      <!-- Lista vazia -->
      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ artefatos.length === 0 ? 'Nenhum artefato cadastrado ainda.' : 'Nenhum artefato encontrado.' }}</p>
      </div>

      <!-- Cards -->
      <div v-for="a in lista" :key="a.id" class="pub-card">

        <!-- Sumário -->
        <template v-if="editandoId !== a.id">
          <div class="pub-card-top">
            <span v-if="a.tipo" class="pub-tipo">{{ a.tipo }}</span>
            <span class="pub-card-data">{{ a.criadoEm }}<template v-if="a.editadoEm"> · editado {{ a.editadoEm }}</template></span>
          </div>
          <div class="pub-card-preview">{{ a.descricao }}</div>
          <div v-if="a.valor != null || a.anexo" style="display:flex;gap:12px;align-items:center;margin-bottom:0.8rem;">
            <span v-if="a.valor != null" class="portal-valor">{{ formatValor(a.valor) }}</span>
            <span v-if="a.anexo" class="portal-anexo-inline">
              <span v-html="paperclipIcon" class="portal-anexo-inline-icon"></span>{{ a.anexo.nome }}
            </span>
          </div>

          <div class="pub-card-actions">
            <RouterLink :to="`/portal/${a.id}`" class="btn btn-outline pub-card-btn" target="_blank">Ver →</RouterLink>
            <button class="btn btn-outline pub-card-btn" @click="abrirEdit(a)">Editar</button>
            <button
              v-if="confirmarDeleteId === a.id"
              class="btn btn-danger pub-card-btn"
              @click="confirmarDelete(a.id)"
            >Confirmar exclusão</button>
            <button
              v-else
              class="btn btn-outline pub-card-btn pub-card-btn--danger"
              @click="pedirDelete(a.id)"
            >Excluir</button>
            <button v-if="confirmarDeleteId === a.id" class="btn btn-outline pub-card-btn" @click="cancelarDelete">Cancelar</button>
          </div>
        </template>

        <!-- Inline edit -->
        <template v-else>
          <div class="label-sm" style="margin-bottom:0.8rem;">Editando artefato</div>

          <div class="field">
            <label class="label">Tipo</label>
            <input v-model="formEdit.tipo" type="text" class="input" placeholder="Ex.: Nota Fiscal, Ata de Reunião, Ofício…">
          </div>

          <div class="field">
            <label class="label">Descrição / Objeto *</label>
            <textarea v-model="formEdit.descricao" class="input textarea" rows="5"></textarea>
          </div>

          <div class="field">
            <label class="label">Valor (R$)</label>
            <input v-model="formEdit.valor" type="text" inputmode="decimal" class="input" placeholder="0,00" style="max-width:180px;">
          </div>

          <div class="field">
            <label class="label">Documento comprobatório</label>
            <button type="button" class="btn-foto" @click="triggerFileEdit()">
              {{ formEdit.anexoNome || '+ Anexar documento' }}
            </button>
            <input ref="fileEditRef" type="file" accept="image/*,.pdf" style="display:none" @change="onArquivoEdit">
          </div>

          <div class="form-actions">
            <button class="btn btn-outline" @click="cancelarEdit">Cancelar</button>
            <button class="btn btn-primary" @click="salvarEdit(a.id)">Salvar</button>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<style scoped>
.mural-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.mural-search {
  flex: 1;
  min-width: 180px;
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

.mural-count { font-size: 0.8rem; color: var(--cinza); flex-shrink: 0; }

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

.pub-card {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  padding: 1.2rem 1.4rem;
  margin-bottom: 0.8rem;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
}

.pub-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.pub-tipo {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pub-card-data { font-size: 0.74rem; color: var(--cinza); }

.pub-card-preview {
  font-size: 0.84rem;
  color: var(--preto);
  opacity: 0.75;
  line-height: 1.55;
  margin-bottom: 0.6rem;
  white-space: pre-wrap;
}

.portal-valor {
  font-size: 0.82rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--verde);
}

.portal-anexo-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--cinza);
}
.portal-anexo-inline-icon { display: flex; align-items: center; }
.portal-anexo-inline-icon :deep(svg) { width: 13px; height: 13px; }

.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

.textarea { min-height: 120px; resize: vertical; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

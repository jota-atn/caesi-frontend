<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { laboratorios, addLaboratorio, updateLaboratorio, deleteLaboratorio } from '../../stores/informacoes.js'
import { estruturas } from '../../stores/mapa.js'
import { showToast } from '../../stores/toast.js'

function nomeEstrutura(id) { return estruturas.value.find(e => e.id === id)?.nome ?? null }

function comprimirImagem(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        else if (h > MAX)     { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

// --------------- Formulário adicionar ---------------
const mostrarForm = ref(false)
const fileAddRef  = ref(null)
const formAdd = reactive({ nome: '', sigla: '', descricao: '', imagem: '', linkExterno: '', estruturaId: '' })
const erros   = reactive({ nome: '' })

function validar(form) {
  erros.nome = form.nome.trim().length < 2 ? 'Nome obrigatório.' : ''
  return !erros.nome
}

async function onImagemAdd(e) {
  const file = e.target.files?.[0]
  if (file) formAdd.imagem = await comprimirImagem(file)
  e.target.value = ''
}
function removerImagemAdd() { formAdd.imagem = '' }

function publicar() {
  if (!validar(formAdd)) return
  addLaboratorio({
    nome: formAdd.nome.trim(),
    sigla: formAdd.sigla.trim(),
    descricao: formAdd.descricao.trim(),
    imagem: formAdd.imagem || null,
    linkExterno: formAdd.linkExterno.trim(),
    estruturaId: formAdd.estruturaId ? Number(formAdd.estruturaId) : null,
  })
  Object.assign(formAdd, { nome: '', sigla: '', descricao: '', imagem: '', linkExterno: '', estruturaId: '' })
  mostrarForm.value = false
  showToast('Laboratório cadastrado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { nome: '', sigla: '', descricao: '', imagem: '', linkExterno: '', estruturaId: '' })
  erros.nome = ''
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)
const formEdit = reactive({ nome: '', sigla: '', descricao: '', imagem: '', linkExterno: '', estruturaId: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(l) {
  editandoId.value = l.id
  Object.assign(formEdit, {
    nome: l.nome, sigla: l.sigla ?? '', descricao: l.descricao ?? '',
    imagem: l.imagem ?? '', linkExterno: l.linkExterno ?? '', estruturaId: l.estruturaId ?? '',
  })
}

async function onImagemEdit(e) {
  const file = e.target.files?.[0]
  if (file) formEdit.imagem = await comprimirImagem(file)
  e.target.value = ''
}
function removerImagemEdit() { formEdit.imagem = '' }

function salvarEdit(id) {
  if (!formEdit.nome.trim()) { showToast('Nome não pode ficar vazio.', 'error'); return }
  updateLaboratorio(id, {
    nome: formEdit.nome.trim(),
    sigla: formEdit.sigla.trim(),
    descricao: formEdit.descricao.trim(),
    imagem: formEdit.imagem || null,
    linkExterno: formEdit.linkExterno.trim(),
    estruturaId: formEdit.estruturaId ? Number(formEdit.estruturaId) : null,
  })
  editandoId.value = null
  showToast('Laboratório atualizado.', 'success')
}
function cancelarEdit() { editandoId.value = null }

// --------------- Exclusão ---------------
const confirmarDeleteId = ref(null)
function pedirDelete(id)  { confirmarDeleteId.value = id }
function cancelarDelete() { confirmarDeleteId.value = null }
function confirmarDelete(id) {
  deleteLaboratorio(id)
  confirmarDeleteId.value = null
  showToast('Laboratório removido.', 'info')
}

// --------------- Busca ---------------
const busca = ref('')
const lista = computed(() => {
  const t = busca.value.toLowerCase()
  const base = [...laboratorios.value].sort((a, b) => a.nome.localeCompare(b.nome))
  if (!t) return base
  return base.filter(l => l.nome.toLowerCase().includes(t) || (l.sigla ?? '').toLowerCase().includes(t))
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Laboratórios <span>Admin</span></h2>
        <button class="btn btn-primary" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo laboratório' }}
        </button>
      </div>

      <!-- Formulário adicionar -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Novo laboratório</div>

        <div class="field">
          <label class="label">Nome *</label>
          <input v-model="formAdd.nome" type="text" class="input" placeholder="Ex.: Laboratório de Sistemas Distribuídos">
          <span v-if="erros.nome" class="error-msg" style="display:block;">{{ erros.nome }}</span>
        </div>
        <div class="field">
          <label class="label">Sigla <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.sigla" type="text" class="input" placeholder="Ex.: LSD" style="max-width:160px;">
        </div>
        <div class="field">
          <label class="label">Descrição</label>
          <textarea v-model="formAdd.descricao" class="input textarea" rows="4" placeholder="Áreas de atuação, atividades…"></textarea>
        </div>
        <div class="field">
          <label class="label">Link externo <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.linkExterno" type="url" class="input" placeholder="https://...">
        </div>
        <div class="field">
          <label class="label">Sala / Localização <span class="field-hint">(opcional — linka com o Mapa)</span></label>
          <select v-model="formAdd.estruturaId" class="input">
            <option value="">Nenhuma</option>
            <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Imagem / logo <span class="field-hint">(opcional)</span></label>
          <div v-if="formAdd.imagem" class="imagens-preview">
            <div class="img-thumb-wrap">
              <img :src="formAdd.imagem" class="img-thumb" alt="">
              <button type="button" class="img-thumb-remove" @click="removerImagemAdd">×</button>
            </div>
          </div>
          <button type="button" class="btn-foto" @click="fileAddRef.click()" style="margin-top:8px;">
            {{ formAdd.imagem ? 'Trocar imagem' : '+ Adicionar imagem' }}
          </button>
          <input ref="fileAddRef" type="file" accept="image/*" style="display:none" @change="onImagemAdd">
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="cancelarAdd">Cancelar</button>
          <button class="btn btn-primary" @click="publicar">Cadastrar</button>
        </div>
      </div>

      <!-- Busca -->
      <div class="mural-search-row">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar laboratórios…">
        <span class="mural-count">{{ laboratorios.length }} laboratório{{ laboratorios.length === 1 ? '' : 's' }}</span>
      </div>

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ laboratorios.length === 0 ? 'Nenhum laboratório cadastrado ainda.' : 'Nenhum laboratório encontrado.' }}</p>
      </div>

      <div v-for="l in lista" :key="l.id" class="pub-card">
        <template v-if="editandoId !== l.id">
          <div v-if="l.imagem" class="pub-card-imgs">
            <img :src="l.imagem" class="pub-card-thumb" alt="">
          </div>
          <div class="pub-card-top">
            <span class="pub-card-titulo" style="margin:0;">{{ l.nome }}</span>
            <span v-if="l.sigla" class="pub-tipo">{{ l.sigla }}</span>
          </div>
          <div v-if="l.estruturaId" style="font-size:0.8rem;color:var(--cinza);margin-bottom:0.4rem;">
            Localização: {{ nomeEstrutura(l.estruturaId) }}
          </div>
          <div class="pub-card-preview">{{ l.descricao }}</div>
          <div class="pub-card-actions">
            <button class="btn btn-outline pub-card-btn" @click="abrirEdit(l)">Editar</button>
            <button v-if="confirmarDeleteId === l.id" class="btn btn-danger pub-card-btn" @click="confirmarDelete(l.id)">Confirmar exclusão</button>
            <button v-else class="btn btn-outline pub-card-btn pub-card-btn--danger" @click="pedirDelete(l.id)">Excluir</button>
            <button v-if="confirmarDeleteId === l.id" class="btn btn-outline pub-card-btn" @click="cancelarDelete">Cancelar</button>
          </div>
        </template>

        <template v-else>
          <div class="label-sm" style="margin-bottom:0.8rem;">Editando laboratório</div>
          <div class="field">
            <label class="label">Nome *</label>
            <input v-model="formEdit.nome" type="text" class="input">
          </div>
          <div class="field">
            <label class="label">Sigla</label>
            <input v-model="formEdit.sigla" type="text" class="input" style="max-width:160px;">
          </div>
          <div class="field">
            <label class="label">Descrição</label>
            <textarea v-model="formEdit.descricao" class="input textarea" rows="4"></textarea>
          </div>
          <div class="field">
            <label class="label">Link externo</label>
            <input v-model="formEdit.linkExterno" type="url" class="input">
          </div>
          <div class="field">
            <label class="label">Sala / Localização</label>
            <select v-model="formEdit.estruturaId" class="input">
              <option value="">Nenhuma</option>
              <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Imagem / logo</label>
            <div v-if="formEdit.imagem" class="imagens-preview">
              <div class="img-thumb-wrap">
                <img :src="formEdit.imagem" class="img-thumb" alt="">
                <button type="button" class="img-thumb-remove" @click="removerImagemEdit">×</button>
              </div>
            </div>
            <button type="button" class="btn-foto" @click="triggerFileEdit()" style="margin-top:8px;">
              {{ formEdit.imagem ? 'Trocar imagem' : '+ Adicionar imagem' }}
            </button>
            <input ref="fileEditRef" type="file" accept="image/*" style="display:none" @change="onImagemEdit">
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" @click="cancelarEdit">Cancelar</button>
            <button class="btn btn-primary" @click="salvarEdit(l.id)">Salvar</button>
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

.imagens-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.img-thumb-wrap { position: relative; flex-shrink: 0; }
.img-thumb { width: 90px; height: 60px; object-fit: cover; border-radius: 2px; border: 1.5px solid var(--creme-escuro); display: block; }
.img-thumb-remove {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--preto); color: var(--branco); border: none; font-size: 0.75rem; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.pub-card {
  background: var(--branco); border: 1.5px solid var(--creme-escuro); border-left: 4px solid var(--roxo);
  border-radius: 2px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.pub-card-imgs { margin-bottom: 0.8rem; }
.pub-card-thumb { width: 100px; height: 64px; object-fit: cover; border-radius: 2px; border: 1.5px solid var(--creme-escuro); }
.pub-card-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 0.3rem; }
.pub-tipo {
  font-size: 0.69rem; font-weight: 700; font-family: 'Archivo Black', sans-serif; padding: 2px 8px; border-radius: 2px;
  background: rgba(80,64,160,0.12); color: var(--roxo-escuro); border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.pub-card-titulo { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 1rem; color: var(--preto); }
.pub-card-preview { font-size: 0.84rem; color: var(--preto); opacity: 0.6; line-height: 1.55; margin-bottom: 0.6rem; }
.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

.textarea { min-height: 100px; resize: vertical; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

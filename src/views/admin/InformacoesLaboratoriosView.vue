<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { laboratorios, addLaboratorio, updateLaboratorio, deleteLaboratorio } from '../../stores/informacoes.js'
import { estruturas } from '../../stores/mapa.js'
import { showToast } from '../../stores/toast.js'
import { isEmail, isUrl, isValidImageFile } from '../../utils/validation.js'

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
const fileGaleriaAddRef = ref(null)
const formAdd = reactive({ nome: '', sigla: '', descricao: '', imagem: '', imagens: [], email: '', linkExterno: '', estruturaId: '' })
const erros   = reactive({ nome: '', email: '', linkExterno: '' })

function validarNome(nome) {
  return nome.trim().length < 2 ? 'Nome obrigatório (mínimo 2 caracteres).' : ''
}

function validarEmailOpcional(email) {
  return email.trim() && !isEmail(email) ? 'Informe um e-mail válido.' : ''
}

function validarUrlOpcional(url) {
  return url.trim() && !isUrl(url) ? 'Informe um link válido.' : ''
}

function validar(form) {
  erros.nome        = validarNome(form.nome)
  erros.email       = validarEmailOpcional(form.email)
  erros.linkExterno = validarUrlOpcional(form.linkExterno)
  return !erros.nome && !erros.email && !erros.linkExterno
}

async function onImagemAdd(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  formAdd.imagem = await comprimirImagem(file)
  e.target.value = ''
}
function removerImagemAdd() { formAdd.imagem = '' }

async function onGaleriaAdd(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formAdd.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}
function removerGaleriaAdd(i) { formAdd.imagens.splice(i, 1) }

function publicar() {
  if (!validar(formAdd)) return
  addLaboratorio({
    nome: formAdd.nome.trim(),
    sigla: formAdd.sigla.trim(),
    descricao: formAdd.descricao.trim(),
    imagem: formAdd.imagem || null,
    imagens: [...formAdd.imagens],
    email: formAdd.email.trim(),
    linkExterno: formAdd.linkExterno.trim(),
    estruturaId: formAdd.estruturaId ? Number(formAdd.estruturaId) : null,
  })
  Object.assign(formAdd, { nome: '', sigla: '', descricao: '', imagem: '', imagens: [], email: '', linkExterno: '', estruturaId: '' })
  mostrarForm.value = false
  showToast('Laboratório cadastrado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { nome: '', sigla: '', descricao: '', imagem: '', imagens: [], email: '', linkExterno: '', estruturaId: '' })
  Object.assign(erros, { nome: '', email: '', linkExterno: '' })
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)
const fileGaleriaEditRef = ref(null)

function triggerGaleriaEdit() {
  const el = Array.isArray(fileGaleriaEditRef.value) ? fileGaleriaEditRef.value[0] : fileGaleriaEditRef.value
  el?.click()
}
const formEdit = reactive({ nome: '', sigla: '', descricao: '', imagem: '', imagens: [], email: '', linkExterno: '', estruturaId: '' })
const errosEdit = reactive({ nome: '', email: '', linkExterno: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(l) {
  editandoId.value = l.id
  Object.assign(errosEdit, { nome: '', email: '', linkExterno: '' })
  Object.assign(formEdit, {
    nome: l.nome, sigla: l.sigla ?? '', descricao: l.descricao ?? '',
    imagem: l.imagem ?? '', imagens: [...(l.imagens ?? [])], email: l.email ?? '',
    linkExterno: l.linkExterno ?? '', estruturaId: l.estruturaId ?? '',
  })
}

async function onImagemEdit(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  formEdit.imagem = await comprimirImagem(file)
  e.target.value = ''
}
function removerImagemEdit() { formEdit.imagem = '' }

async function onGaleriaEdit(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formEdit.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}
function removerGaleriaEdit(i) { formEdit.imagens.splice(i, 1) }

function salvarEdit(id) {
  errosEdit.nome        = validarNome(formEdit.nome)
  errosEdit.email       = validarEmailOpcional(formEdit.email)
  errosEdit.linkExterno = validarUrlOpcional(formEdit.linkExterno)
  if (errosEdit.nome || errosEdit.email || errosEdit.linkExterno) return
  updateLaboratorio(id, {
    nome: formEdit.nome.trim(),
    sigla: formEdit.sigla.trim(),
    descricao: formEdit.descricao.trim(),
    imagem: formEdit.imagem || null,
    imagens: [...formEdit.imagens],
    email: formEdit.email.trim(),
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
          <input v-model="formAdd.linkExterno" type="url" class="input" placeholder="https://..." :class="{ invalid: erros.linkExterno }">
          <span v-if="erros.linkExterno" class="error-msg" style="display:block;">{{ erros.linkExterno }}</span>
        </div>
        <div class="field">
          <label class="label">Sala / Localização <span class="field-hint">(opcional — linka com o Mapa)</span></label>
          <select v-model="formAdd.estruturaId" class="input">
            <option value="">Nenhuma</option>
            <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Foto de capa <span class="field-hint">(opcional)</span></label>
          <div v-if="formAdd.imagem" class="imagens-preview">
            <div class="img-thumb-wrap">
              <img :src="formAdd.imagem" class="img-thumb" alt="">
              <button type="button" class="img-thumb-remove" @click="removerImagemAdd">×</button>
            </div>
          </div>
          <button type="button" class="btn-foto" @click="fileAddRef.click()" style="margin-top:8px;">
            {{ formAdd.imagem ? 'Trocar foto' : '+ Adicionar foto de capa' }}
          </button>
          <input ref="fileAddRef" type="file" accept="image/*" style="display:none" @change="onImagemAdd">
        </div>

        <div class="field">
          <label class="label">Fotos extras <span class="field-hint">(opcional — equipe, eventos etc.)</span></label>
          <div v-if="formAdd.imagens.length > 0" class="imagens-preview">
            <div v-for="(img, i) in formAdd.imagens" :key="i" class="img-thumb-wrap">
              <img :src="img" class="img-thumb" :alt="`Foto ${i + 1}`">
              <button type="button" class="img-thumb-remove" @click="removerGaleriaAdd(i)">×</button>
            </div>
          </div>
          <button type="button" class="btn-foto" @click="fileGaleriaAddRef.click()" style="margin-top:8px;">+ Adicionar fotos</button>
          <input ref="fileGaleriaAddRef" type="file" accept="image/*" multiple style="display:none" @change="onGaleriaAdd">
        </div>

        <div class="field">
          <label class="label">E-mail de contato <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.email" type="email" class="input" placeholder="laboratorio@ccc.ufcg.edu.br" :class="{ invalid: erros.email }">
          <span v-if="erros.email" class="error-msg" style="display:block;">{{ erros.email }}</span>
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
          <div v-if="l.email" style="font-size:0.8rem;color:var(--cinza);margin-bottom:0.6rem;">{{ l.email }}</div>
          <div v-if="l.imagens?.length" style="font-size:0.76rem;color:var(--cinza);margin-bottom:0.6rem;">{{ l.imagens.length }} foto{{ l.imagens.length > 1 ? 's' : '' }} extra{{ l.imagens.length > 1 ? 's' : '' }}</div>
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
            <span v-if="errosEdit.nome" class="error-msg" style="display:block;">{{ errosEdit.nome }}</span>
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
            <input v-model="formEdit.linkExterno" type="url" class="input" :class="{ invalid: errosEdit.linkExterno }">
            <span v-if="errosEdit.linkExterno" class="error-msg" style="display:block;">{{ errosEdit.linkExterno }}</span>
          </div>
          <div class="field">
            <label class="label">Sala / Localização</label>
            <select v-model="formEdit.estruturaId" class="input">
              <option value="">Nenhuma</option>
              <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Foto de capa</label>
            <div v-if="formEdit.imagem" class="imagens-preview">
              <div class="img-thumb-wrap">
                <img :src="formEdit.imagem" class="img-thumb" alt="">
                <button type="button" class="img-thumb-remove" @click="removerImagemEdit">×</button>
              </div>
            </div>
            <button type="button" class="btn-foto" @click="triggerFileEdit()" style="margin-top:8px;">
              {{ formEdit.imagem ? 'Trocar foto' : '+ Adicionar foto de capa' }}
            </button>
            <input ref="fileEditRef" type="file" accept="image/*" style="display:none" @change="onImagemEdit">
          </div>
          <div class="field">
            <label class="label">Fotos extras <span class="field-hint">(equipe, eventos etc.)</span></label>
            <div v-if="formEdit.imagens.length > 0" class="imagens-preview">
              <div v-for="(img, i) in formEdit.imagens" :key="i" class="img-thumb-wrap">
                <img :src="img" class="img-thumb" :alt="`Foto ${i + 1}`">
                <button type="button" class="img-thumb-remove" @click="removerGaleriaEdit(i)">×</button>
              </div>
            </div>
            <button type="button" class="btn-foto" @click="triggerGaleriaEdit()" style="margin-top:8px;">+ Adicionar fotos</button>
            <input ref="fileGaleriaEditRef" type="file" accept="image/*" multiple style="display:none" @change="onGaleriaEdit">
          </div>
          <div class="field">
            <label class="label">E-mail de contato</label>
            <input v-model="formEdit.email" type="email" class="input" :class="{ invalid: errosEdit.email }">
            <span v-if="errosEdit.email" class="error-msg" style="display:block;">{{ errosEdit.email }}</span>
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

<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { professores, addProfessor, updateProfessor, deleteProfessor } from '../../stores/informacoes.js'
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
const formAdd = reactive({ nome: '', sala: '', estruturaId: '', descricao: '', foto: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
const erros   = reactive({ nome: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })

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
  erros.nome            = validarNome(form.nome)
  erros.email           = validarEmailOpcional(form.email)
  erros.lattes          = validarUrlOpcional(form.lattes)
  erros.googleAcademico = validarUrlOpcional(form.googleAcademico)
  erros.linkedin        = validarUrlOpcional(form.linkedin)
  return !erros.nome && !erros.email && !erros.lattes && !erros.googleAcademico && !erros.linkedin
}

async function onFotoAdd(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  formAdd.foto = await comprimirImagem(file)
  e.target.value = ''
}
function removerFotoAdd() { formAdd.foto = '' }

function publicar() {
  if (!validar(formAdd)) return
  addProfessor({
    nome: formAdd.nome.trim(),
    sala: formAdd.sala.trim(),
    estruturaId: formAdd.estruturaId ? Number(formAdd.estruturaId) : null,
    descricao: formAdd.descricao.trim(),
    foto: formAdd.foto || '',
    email: formAdd.email.trim(),
    lattes: formAdd.lattes.trim(),
    googleAcademico: formAdd.googleAcademico.trim(),
    linkedin: formAdd.linkedin.trim(),
  })
  Object.assign(formAdd, { nome: '', sala: '', estruturaId: '', descricao: '', foto: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
  mostrarForm.value = false
  showToast('Professor cadastrado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { nome: '', sala: '', estruturaId: '', descricao: '', foto: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
  Object.assign(erros, { nome: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)
const formEdit = reactive({ nome: '', sala: '', estruturaId: '', descricao: '', foto: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
const errosEdit = reactive({ nome: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(p) {
  editandoId.value = p.id
  Object.assign(errosEdit, { nome: '', email: '', lattes: '', googleAcademico: '', linkedin: '' })
  Object.assign(formEdit, {
    nome: p.nome,
    sala: p.sala ?? '',
    estruturaId: p.estruturaId ?? '',
    descricao: p.descricao ?? '',
    foto: p.foto ?? '',
    email: p.email ?? '',
    lattes: p.lattes ?? '',
    googleAcademico: p.googleAcademico ?? '',
    linkedin: p.linkedin ?? '',
  })
}

async function onFotoEdit(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  formEdit.foto = await comprimirImagem(file)
  e.target.value = ''
}
function removerFotoEdit() { formEdit.foto = '' }

function salvarEdit(id) {
  errosEdit.nome            = validarNome(formEdit.nome)
  errosEdit.email           = validarEmailOpcional(formEdit.email)
  errosEdit.lattes          = validarUrlOpcional(formEdit.lattes)
  errosEdit.googleAcademico = validarUrlOpcional(formEdit.googleAcademico)
  errosEdit.linkedin        = validarUrlOpcional(formEdit.linkedin)
  if (errosEdit.nome || errosEdit.email || errosEdit.lattes || errosEdit.googleAcademico || errosEdit.linkedin) return
  updateProfessor(id, {
    nome: formEdit.nome.trim(),
    sala: formEdit.sala.trim(),
    estruturaId: formEdit.estruturaId ? Number(formEdit.estruturaId) : null,
    descricao: formEdit.descricao.trim(),
    foto: formEdit.foto || '',
    email: formEdit.email.trim(),
    lattes: formEdit.lattes.trim(),
    googleAcademico: formEdit.googleAcademico.trim(),
    linkedin: formEdit.linkedin.trim(),
  })
  editandoId.value = null
  showToast('Professor atualizado.', 'success')
}
function cancelarEdit() { editandoId.value = null }

// --------------- Exclusão ---------------
const confirmarDeleteId = ref(null)
function pedirDelete(id)  { confirmarDeleteId.value = id }
function cancelarDelete() { confirmarDeleteId.value = null }
function confirmarDelete(id) {
  deleteProfessor(id)
  confirmarDeleteId.value = null
  showToast('Professor removido.', 'info')
}

// --------------- Busca ---------------
const busca = ref('')
const lista = computed(() => {
  const t = busca.value.toLowerCase()
  const base = [...professores.value].sort((a, b) => a.nome.localeCompare(b.nome))
  if (!t) return base
  return base.filter(p => p.nome.toLowerCase().includes(t))
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Professores <span>Admin</span></h2>
        <button class="btn btn-primary" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo professor' }}
        </button>
      </div>

      <!-- Formulário adicionar -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Novo professor</div>

        <div class="field">
          <label class="label">Nome *</label>
          <input v-model="formAdd.nome" type="text" class="input" placeholder="Nome completo">
          <span v-if="erros.nome" class="error-msg" style="display:block;">{{ erros.nome }}</span>
        </div>

        <div class="field">
          <label class="label">Foto <span class="field-hint">(opcional)</span></label>
          <div v-if="formAdd.foto" class="imagens-preview">
            <div class="img-thumb-wrap">
              <img :src="formAdd.foto" class="img-thumb img-thumb--avatar" alt="">
              <button type="button" class="img-thumb-remove" @click="removerFotoAdd">×</button>
            </div>
          </div>
          <button type="button" class="btn-foto" @click="fileAddRef.click()" style="margin-top:8px;">
            {{ formAdd.foto ? 'Trocar foto' : '+ Adicionar foto' }}
          </button>
          <input ref="fileAddRef" type="file" accept="image/*" style="display:none" @change="onFotoAdd">
        </div>

        <div class="field">
          <label class="label">Sala <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.sala" type="text" class="input" placeholder="Ex.: Sala 214, Bloco CP">
        </div>

        <div class="field">
          <label class="label">Localização no mapa <span class="field-hint">(opcional — linka com o Mapa)</span></label>
          <select v-model="formAdd.estruturaId" class="input">
            <option value="">Nenhuma</option>
            <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>

        <div class="field">
          <label class="label">Descrição <span class="field-hint">(opcional)</span></label>
          <textarea v-model="formAdd.descricao" class="input textarea" rows="3" placeholder="Área de atuação, disciplinas, linha de pesquisa…"></textarea>
        </div>

        <div class="field">
          <label class="label">E-mail de contato <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.email" type="email" class="input" placeholder="professor@ccc.ufcg.edu.br" :class="{ invalid: erros.email }">
          <span v-if="erros.email" class="error-msg" style="display:block;">{{ erros.email }}</span>
        </div>

        <div class="field">
          <label class="label">Lattes <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.lattes" type="url" class="input" placeholder="http://lattes.cnpq.br/..." :class="{ invalid: erros.lattes }">
          <span v-if="erros.lattes" class="error-msg" style="display:block;">{{ erros.lattes }}</span>
        </div>
        <div class="field">
          <label class="label">Google Acadêmico <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.googleAcademico" type="url" class="input" placeholder="https://scholar.google.com/..." :class="{ invalid: erros.googleAcademico }">
          <span v-if="erros.googleAcademico" class="error-msg" style="display:block;">{{ erros.googleAcademico }}</span>
        </div>
        <div class="field">
          <label class="label">LinkedIn <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.linkedin" type="url" class="input" placeholder="https://linkedin.com/in/..." :class="{ invalid: erros.linkedin }">
          <span v-if="erros.linkedin" class="error-msg" style="display:block;">{{ erros.linkedin }}</span>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="cancelarAdd">Cancelar</button>
          <button class="btn btn-primary" @click="publicar">Cadastrar</button>
        </div>
      </div>

      <!-- Busca -->
      <div class="mural-search-row">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar professores…">
        <span class="mural-count">{{ professores.length }} professor{{ professores.length === 1 ? '' : 'es' }}</span>
      </div>

      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ professores.length === 0 ? 'Nenhum professor cadastrado ainda.' : 'Nenhum professor encontrado.' }}</p>
      </div>

      <div v-for="p in lista" :key="p.id" class="pub-card">
        <template v-if="editandoId !== p.id">
          <div class="pub-card-top-row">
            <img v-if="p.foto" :src="p.foto" class="pub-card-avatar" :alt="p.nome">
            <div>
              <div class="pub-card-titulo">{{ p.nome }}</div>
              <div v-if="p.sala" style="font-size:0.8rem;color:var(--cinza);">{{ p.sala }}</div>
              <div v-if="p.estruturaId" style="font-size:0.8rem;color:var(--cinza);">
                Localização: {{ nomeEstrutura(p.estruturaId) }}
              </div>
            </div>
          </div>
          <p v-if="p.descricao" class="pub-card-preview" style="margin-top:0.6rem;">{{ p.descricao }}</p>
          <div v-if="p.email" style="font-size:0.8rem;color:var(--cinza);margin-top:0.4rem;">{{ p.email }}</div>
          <div v-if="p.lattes || p.googleAcademico || p.linkedin" class="diretorio-links" style="margin-top:0.6rem;">
            <span v-if="p.lattes" class="diretorio-pill">Lattes</span>
            <span v-if="p.googleAcademico" class="diretorio-pill">Google Acadêmico</span>
            <span v-if="p.linkedin" class="diretorio-pill">LinkedIn</span>
          </div>
          <div class="pub-card-actions" style="margin-top:0.8rem;">
            <button class="btn btn-outline pub-card-btn" @click="abrirEdit(p)">Editar</button>
            <button v-if="confirmarDeleteId === p.id" class="btn btn-danger pub-card-btn" @click="confirmarDelete(p.id)">Confirmar exclusão</button>
            <button v-else class="btn btn-outline pub-card-btn pub-card-btn--danger" @click="pedirDelete(p.id)">Excluir</button>
            <button v-if="confirmarDeleteId === p.id" class="btn btn-outline pub-card-btn" @click="cancelarDelete">Cancelar</button>
          </div>
        </template>

        <template v-else>
          <div class="label-sm" style="margin-bottom:0.8rem;">Editando professor</div>
          <div class="field">
            <label class="label">Nome *</label>
            <input v-model="formEdit.nome" type="text" class="input">
            <span v-if="errosEdit.nome" class="error-msg" style="display:block;">{{ errosEdit.nome }}</span>
          </div>
          <div class="field">
            <label class="label">Foto</label>
            <div v-if="formEdit.foto" class="imagens-preview">
              <div class="img-thumb-wrap">
                <img :src="formEdit.foto" class="img-thumb img-thumb--avatar" alt="">
                <button type="button" class="img-thumb-remove" @click="removerFotoEdit">×</button>
              </div>
            </div>
            <button type="button" class="btn-foto" @click="triggerFileEdit()" style="margin-top:8px;">
              {{ formEdit.foto ? 'Trocar foto' : '+ Adicionar foto' }}
            </button>
            <input ref="fileEditRef" type="file" accept="image/*" style="display:none" @change="onFotoEdit">
          </div>
          <div class="field">
            <label class="label">Sala <span class="field-hint">(opcional)</span></label>
            <input v-model="formEdit.sala" type="text" class="input" placeholder="Ex.: Sala 214, Bloco CP">
          </div>
          <div class="field">
            <label class="label">Localização no mapa</label>
            <select v-model="formEdit.estruturaId" class="input">
              <option value="">Nenhuma</option>
              <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Descrição</label>
            <textarea v-model="formEdit.descricao" class="input textarea" rows="3"></textarea>
          </div>
          <div class="field">
            <label class="label">E-mail de contato</label>
            <input v-model="formEdit.email" type="email" class="input" :class="{ invalid: errosEdit.email }">
            <span v-if="errosEdit.email" class="error-msg" style="display:block;">{{ errosEdit.email }}</span>
          </div>
          <div class="field">
            <label class="label">Lattes</label>
            <input v-model="formEdit.lattes" type="url" class="input" :class="{ invalid: errosEdit.lattes }">
            <span v-if="errosEdit.lattes" class="error-msg" style="display:block;">{{ errosEdit.lattes }}</span>
          </div>
          <div class="field">
            <label class="label">Google Acadêmico</label>
            <input v-model="formEdit.googleAcademico" type="url" class="input" :class="{ invalid: errosEdit.googleAcademico }">
            <span v-if="errosEdit.googleAcademico" class="error-msg" style="display:block;">{{ errosEdit.googleAcademico }}</span>
          </div>
          <div class="field">
            <label class="label">LinkedIn</label>
            <input v-model="formEdit.linkedin" type="url" class="input" :class="{ invalid: errosEdit.linkedin }">
            <span v-if="errosEdit.linkedin" class="error-msg" style="display:block;">{{ errosEdit.linkedin }}</span>
          </div>
          <div class="form-actions">
            <button class="btn btn-outline" @click="cancelarEdit">Cancelar</button>
            <button class="btn btn-primary" @click="salvarEdit(p.id)">Salvar</button>
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
.img-thumb--avatar { width: 72px; height: 72px; border-radius: 50%; }
.img-thumb-remove {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--preto); color: var(--branco); border: none; font-size: 0.75rem; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.pub-card {
  background: var(--branco); border: 1.5px solid var(--creme-escuro); border-left: 4px solid var(--roxo);
  border-radius: 2px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.pub-card-top-row { display: flex; align-items: center; gap: 12px; }
.pub-card-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1.5px solid var(--creme-escuro); }
.pub-card-titulo { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 1rem; color: var(--preto); margin-bottom: 0.3rem; }
.pub-card-preview { font-size: 0.84rem; color: var(--preto); opacity: 0.75; line-height: 1.55; }
.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

.diretorio-links { display: flex; gap: 6px; flex-wrap: wrap; }
.diretorio-pill {
  font-size: 0.69rem; font-weight: 700; font-family: 'Archivo Black', sans-serif; padding: 2px 7px;
  border-radius: 2px; border: 1.5px solid var(--creme-escuro); color: var(--cinza);
  text-transform: uppercase; letter-spacing: 0.04em;
}

.textarea { min-height: 80px; resize: vertical; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

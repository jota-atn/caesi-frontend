<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { publicacoes, addPublicacao, updatePublicacao, deletePublicacao } from '../../stores/mural.js'
import { showToast } from '../../stores/toast.js'
import { isValidImageFile } from '../../utils/validation.js'

// --------------- Compressão ---------------
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
const mostrarForm  = ref(false)
const fileAddRef   = ref(null)
const formAdd = reactive({ titulo: '', tipo: '', mensagem: '', imagens: [], anexos: [] })
const erros   = reactive({ titulo: '', mensagem: '' })

function validarTitulo(titulo)     { return titulo.trim().length < 3     ? 'Título obrigatório (mín. 3 caracteres).'     : '' }
function validarMensagem(mensagem) { return mensagem.trim().length < 10 ? 'Mensagem obrigatória (mín. 10 caracteres).' : '' }

function validar(form) {
  erros.titulo   = validarTitulo(form.titulo)
  erros.mensagem = validarMensagem(form.mensagem)
  return !erros.titulo && !erros.mensagem
}

async function onImagensAdd(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    const b64 = await comprimirImagem(file)
    formAdd.imagens.push(b64)
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}

function removerImagemAdd(i) { formAdd.imagens.splice(i, 1) }

function publicar() {
  if (!validar(formAdd)) return
  addPublicacao({ ...formAdd, imagens: [...formAdd.imagens] })
  Object.assign(formAdd, { titulo: '', tipo: '', mensagem: '', imagens: [], anexos: [] })
  mostrarForm.value = false
  showToast('Publicação adicionada ao mural.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { titulo: '', tipo: '', mensagem: '', imagens: [], anexos: [] })
  erros.titulo = erros.mensagem = ''
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId  = ref(null)
const fileEditRef = ref(null)  // dentro de v-for → vira array; usar [0]
const formEdit = reactive({ titulo: '', tipo: '', mensagem: '', imagens: [] })
const errosEdit = reactive({ titulo: '', mensagem: '' })

function triggerFileEdit() {
  const el = Array.isArray(fileEditRef.value) ? fileEditRef.value[0] : fileEditRef.value
  el?.click()
}

function abrirEdit(p) {
  editandoId.value = p.id
  errosEdit.titulo = errosEdit.mensagem = ''
  Object.assign(formEdit, {
    titulo:   p.titulo,
    tipo:     p.tipo ?? '',
    mensagem: p.mensagem,
    imagens:  [...(p.imagens ?? [])],
  })
}

async function onImagensEdit(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    const b64 = await comprimirImagem(file)
    formEdit.imagens.push(b64)
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}

function removerImagemEdit(i) { formEdit.imagens.splice(i, 1) }

function salvarEdit(id) {
  errosEdit.titulo   = validarTitulo(formEdit.titulo)
  errosEdit.mensagem = validarMensagem(formEdit.mensagem)
  if (errosEdit.titulo || errosEdit.mensagem) return
  updatePublicacao(id, {
    titulo:   formEdit.titulo.trim(),
    tipo:     formEdit.tipo.trim(),
    mensagem: formEdit.mensagem.trim(),
    imagens:  [...formEdit.imagens],
  })
  editandoId.value = null
  showToast('Publicação atualizada.', 'success')
}

function cancelarEdit() { editandoId.value = null }

// --------------- Exclusão ---------------
const confirmarDeleteId = ref(null)
function pedirDelete(id)    { confirmarDeleteId.value = id }
function cancelarDelete()   { confirmarDeleteId.value = null }
function confirmarDelete(id) {
  deletePublicacao(id)
  confirmarDeleteId.value = null
  showToast('Publicação removida.', 'info')
}

// --------------- Busca ---------------
const busca = ref('')
const lista = computed(() => {
  const t = busca.value.toLowerCase()
  if (!t) return publicacoes.value
  return publicacoes.value.filter(p =>
    p.titulo.toLowerCase().includes(t) ||
    p.mensagem.toLowerCase().includes(t) ||
    (p.tipo ?? '').toLowerCase().includes(t)
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
        <h2>Mural <span>Admin</span></h2>
        <button class="btn btn-primary" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Nova publicação' }}
        </button>
      </div>

      <!-- Formulário adicionar -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Nova publicação</div>

        <div class="field">
          <label class="label">Título *</label>
          <input v-model="formAdd.titulo" type="text" class="input" placeholder="Título da publicação">
          <span v-if="erros.titulo" class="error-msg" style="display:block;">{{ erros.titulo }}</span>
        </div>

        <div class="field">
          <label class="label">Tipo de publicação</label>
          <input v-model="formAdd.tipo" type="text" class="input" placeholder="Ex.: Edital, Comunicado, Evento…">
        </div>

        <div class="field">
          <label class="label">Mensagem *</label>
          <textarea v-model="formAdd.mensagem" class="input textarea" rows="7" placeholder="Conteúdo da publicação…"></textarea>
          <span v-if="erros.mensagem" class="error-msg" style="display:block;">{{ erros.mensagem }}</span>
        </div>

        <!-- Upload imagens -->
        <div class="field">
          <label class="label">Imagens</label>
          <button type="button" class="btn-foto" @click="fileAddRef.click()">+ Adicionar imagens</button>
          <input ref="fileAddRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensAdd">
          <div v-if="formAdd.imagens.length > 0" class="imagens-preview">
            <div v-for="(img, i) in formAdd.imagens" :key="i" class="img-thumb-wrap">
              <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
              <button type="button" class="img-thumb-remove" @click="removerImagemAdd(i)">×</button>
              <span v-if="i === 0" class="img-thumb-capa">capa</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="cancelarAdd">Cancelar</button>
          <button class="btn btn-primary" @click="publicar">Publicar</button>
        </div>
      </div>

      <!-- Busca -->
      <div class="mural-search-row">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar publicações…">
        <span class="mural-count">{{ publicacoes.length }} publicaç{{ publicacoes.length === 1 ? 'ão' : 'ões' }}</span>
      </div>

      <!-- Lista vazia -->
      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ publicacoes.length === 0 ? 'Nenhuma publicação ainda.' : 'Nenhuma publicação encontrada.' }}</p>
      </div>

      <!-- Cards -->
      <div v-for="p in lista" :key="p.id" class="pub-card">

        <!-- Sumário -->
        <template v-if="editandoId !== p.id">
          <div v-if="p.imagens?.length" class="pub-card-imgs">
            <img
              v-for="(img, i) in p.imagens.slice(0, 3)"
              :key="i"
              :src="img"
              :alt="`Imagem ${i+1}`"
              class="pub-card-thumb"
            >
            <span v-if="p.imagens.length > 3" class="pub-card-mais-imgs">+{{ p.imagens.length - 3 }}</span>
          </div>

          <div class="pub-card-top">
            <span v-if="p.tipo" class="pub-tipo">{{ p.tipo }}</span>
            <span class="pub-card-data">{{ p.criadoEm }}<template v-if="p.editadoEm"> · editado {{ p.editadoEm }}</template></span>
          </div>
          <div class="pub-card-titulo">{{ p.titulo }}</div>
          <div class="pub-card-preview">{{ p.mensagem }}</div>

          <div class="pub-card-actions">
            <RouterLink :to="`/mural/${p.id}`" class="btn btn-outline pub-card-btn" target="_blank">Ver →</RouterLink>
            <button class="btn btn-outline pub-card-btn" @click="abrirEdit(p)">Editar</button>
            <button
              v-if="confirmarDeleteId === p.id"
              class="btn btn-danger pub-card-btn"
              @click="confirmarDelete(p.id)"
            >Confirmar exclusão</button>
            <button
              v-else
              class="btn btn-outline pub-card-btn pub-card-btn--danger"
              @click="pedirDelete(p.id)"
            >Excluir</button>
            <button v-if="confirmarDeleteId === p.id" class="btn btn-outline pub-card-btn" @click="cancelarDelete">Cancelar</button>
          </div>
        </template>

        <!-- Inline edit -->
        <template v-else>
          <div class="label-sm" style="margin-bottom:0.8rem;">Editando publicação</div>

          <div class="field">
            <label class="label">Título *</label>
            <input v-model="formEdit.titulo" type="text" class="input">
            <span v-if="errosEdit.titulo" class="error-msg" style="display:block;">{{ errosEdit.titulo }}</span>
          </div>

          <div class="field">
            <label class="label">Tipo de publicação</label>
            <input v-model="formEdit.tipo" type="text" class="input" placeholder="Ex.: Edital, Comunicado, Evento…">
          </div>

          <div class="field">
            <label class="label">Mensagem *</label>
            <textarea v-model="formEdit.mensagem" class="input textarea" rows="7"></textarea>
            <span v-if="errosEdit.mensagem" class="error-msg" style="display:block;">{{ errosEdit.mensagem }}</span>
          </div>

          <div class="field">
            <label class="label">Imagens</label>
            <button type="button" class="btn-foto" @click="triggerFileEdit()">+ Adicionar imagens</button>
            <input ref="fileEditRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensEdit">
            <div v-if="formEdit.imagens.length > 0" class="imagens-preview">
              <div v-for="(img, i) in formEdit.imagens" :key="i" class="img-thumb-wrap">
                <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                <button type="button" class="img-thumb-remove" @click="removerImagemEdit(i)">×</button>
                <span v-if="i === 0" class="img-thumb-capa">capa</span>
              </div>
            </div>
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

/* Imagens preview no form */
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

.imagens-preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.img-thumb-wrap {
  position: relative;
  flex-shrink: 0;
}

.img-thumb {
  width: 90px;
  height: 60px;
  object-fit: cover;
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  display: block;
}

.img-thumb-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--preto);
  color: var(--branco);
  border: none;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-thumb-capa {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(80,64,160,0.8);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  text-align: center;
  padding: 1px 0;
  letter-spacing: 0.04em;
}

/* Cards na listagem admin */
.pub-card {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  padding: 1.2rem 1.4rem;
  margin-bottom: 0.8rem;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
}

.pub-card-imgs {
  display: flex;
  gap: 6px;
  margin-bottom: 0.8rem;
  align-items: center;
}

.pub-card-thumb {
  width: 80px;
  height: 52px;
  object-fit: cover;
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  flex-shrink: 0;
}

.pub-card-mais-imgs {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--cinza);
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 2px 8px;
  flex-shrink: 0;
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

.pub-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--preto);
  margin-bottom: 0.4rem;
  line-height: 1.3;
}

.pub-card-preview {
  font-size: 0.84rem;
  color: var(--preto);
  opacity: 0.6;
  line-height: 1.55;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.9rem;
}

.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

.textarea { min-height: 160px; resize: vertical; }
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

<script setup>
import { ref, reactive, computed } from 'vue'
import { marked } from 'marked'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import Pagination from '../components/Pagination.vue'
import { usePagination } from '../composables/usePagination.js'
import { usePersistedFilter } from '../composables/usePersistedFilter.js'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import { publicacoes, addPublicacao, updatePublicacao, deletePublicacao } from '../stores/mural.ts'
import { isAdmin } from '../stores/auth.js'
import { showToast } from '../stores/toast.js'
import { isValidImageFile } from '../utils/validation.js'

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

function validarTitulo(titulo)     { return titulo.trim().length < 3     ? 'Título obrigatório (mín. 3 caracteres).'     : '' }
function validarMensagem(mensagem) { return mensagem.trim().length < 10 ? 'Mensagem obrigatória (mín. 10 caracteres).' : '' }

// ── Admin: publicar nova ──────────────────────────────────
const mostrarForm = ref(false)
const fileAddRef  = ref(null)
const formAdd = reactive({ titulo: '', tipo: '', mensagem: '', imagens: [] })
const erros   = reactive({ titulo: '', mensagem: '' })

async function onImagensAdd(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formAdd.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}
function removerImagemAdd(i) { formAdd.imagens.splice(i, 1) }

function publicar() {
  erros.titulo   = validarTitulo(formAdd.titulo)
  erros.mensagem = validarMensagem(formAdd.mensagem)
  if (erros.titulo || erros.mensagem) return
  addPublicacao({ ...formAdd, imagens: [...formAdd.imagens] })
  Object.assign(formAdd, { titulo: '', tipo: '', mensagem: '', imagens: [] })
  mostrarForm.value = false
  showToast('Publicação adicionada ao mural.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { titulo: '', tipo: '', mensagem: '', imagens: [] })
  erros.titulo = erros.mensagem = ''
  mostrarForm.value = false
}

// ── Admin: editar/excluir publicação (via modal) ──────────
const editModal  = ref(null)
const fileEditRef = ref(null)
const formEdit  = reactive({ titulo: '', tipo: '', mensagem: '', imagens: [] })
const errosEdit = reactive({ titulo: '', mensagem: '' })

function abrirEdit(p) {
  errosEdit.titulo = errosEdit.mensagem = ''
  Object.assign(formEdit, {
    titulo:   p.titulo,
    tipo:     p.tipo ?? '',
    mensagem: p.mensagem,
    imagens:  [...(p.imagens ?? [])],
  })
  editModal.value = p
}
function fecharEdit() { editModal.value = null }

async function onImagensEdit(e) {
  let invalido = false
  for (const file of e.target.files) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formEdit.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  e.target.value = ''
}
function removerImagemEdit(i) { formEdit.imagens.splice(i, 1) }

function salvarEdit() {
  errosEdit.titulo   = validarTitulo(formEdit.titulo)
  errosEdit.mensagem = validarMensagem(formEdit.mensagem)
  if (errosEdit.titulo || errosEdit.mensagem) return
  updatePublicacao(editModal.value.id, {
    titulo:   formEdit.titulo.trim(),
    tipo:     formEdit.tipo.trim(),
    mensagem: formEdit.mensagem.trim(),
    imagens:  [...formEdit.imagens],
  })
  editModal.value = null
  showToast('Publicação atualizada.', 'success')
}

function excluir(p) {
  if (!confirm(`Remover "${p.titulo}" do mural?`)) return
  deletePublicacao(p.id)
  showToast('Publicação removida.', 'info')
}

useEscapeKey(() => fecharEdit())

const busca   = usePersistedFilter('mural-busca', '')
const filtro  = usePersistedFilter('mural-filtro', 'todas')
const ordenar = usePersistedFilter('mural-ordem', 'recentes')

const tiposUnicos = computed(() => {
  const set = new Set(publicacoes.value.map(p => p.tipo).filter(Boolean))
  return [...set].sort()
})

const lista = computed(() => {
  let result = publicacoes.value.filter(p => {
    const matchFiltro = filtro.value === 'todas' || p.tipo === filtro.value
    const termo = busca.value.toLowerCase()
    const matchBusca = !termo ||
      p.titulo.toLowerCase().includes(termo) ||
      p.mensagem.toLowerCase().includes(termo) ||
      (p.tipo ?? '').toLowerCase().includes(termo)
    return matchFiltro && matchBusca
  })

  if (ordenar.value === 'antigas')    result = [...result].reverse()
  else if (ordenar.value === 'az')    result = [...result].sort((a, b) => a.titulo.localeCompare(b.titulo))
  else if (ordenar.value === 'za')    result = [...result].sort((a, b) => b.titulo.localeCompare(a.titulo))

  return result
})

const { page, totalPages, paginated, next, prev, goTo } = usePagination(lista, 12)

function textoPlano(md) {
  const html = String(marked.parse(md || ''))
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.22;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Mural do <span>CAESI</span></h2>
        <button v-if="isAdmin" type="button" class="btn btn-outline btn-outline-creme btn-sm" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Nova publicação' }}
        </button>
      </div>

      <!-- Admin: nova publicação -->
      <div v-if="mostrarForm" class="paper" style="margin-bottom:1.2rem;">
        <div class="label-sm" style="margin-bottom:1rem;">Nova publicação</div>

        <div class="field">
          <label class="label">Título *</label>
          <input v-model="formAdd.titulo" type="text" class="input" placeholder="Título da publicação">
          <span v-if="erros.titulo" class="error-msg" style="display:block;">{{ erros.titulo }}</span>
        </div>

        <div class="field">
          <label class="label">Tipo de publicação</label>
          <input v-model="formAdd.tipo" type="text" class="input" placeholder="Ex.: Edital, Comunicado, Evento…" list="mural-tipos">
        </div>

        <div class="field">
          <label class="label">Mensagem *</label>
          <textarea v-model="formAdd.mensagem" class="input textarea" rows="7" placeholder="Conteúdo da publicação…"></textarea>
          <span v-if="erros.mensagem" class="error-msg" style="display:block;">{{ erros.mensagem }}</span>
        </div>

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

      <!-- Filtros -->
      <div class="mural-toolbar">
        <input v-model="busca" type="search" class="mural-search" placeholder="Buscar publicações…">
        <select v-model="ordenar" class="mural-select">
          <option value="recentes">Mais recentes</option>
          <option value="antigas">Mais antigas</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      <div v-if="tiposUnicos.length > 0" class="mural-tipos">
        <button class="filter-btn" :class="{ active: filtro === 'todas' }" @click="filtro = 'todas'">Todas</button>
        <button
          v-for="tipo in tiposUnicos" :key="tipo"
          class="filter-btn"
          :class="{ active: filtro === tipo }"
          @click="filtro = tipo"
        >{{ tipo }}</button>
      </div>

      <!-- Lista vazia -->
      <div v-if="lista.length === 0" class="empty-state">
        <p>{{ publicacoes.length === 0 ? 'Nenhuma publicação ainda.' : 'Nenhuma publicação encontrada.' }}</p>
        <span v-if="publicacoes.length > 0">Tente outro filtro ou termo de busca.</span>
      </div>

      <!-- Grid -->
      <div class="mural-grid">
        <RouterLink
          v-for="p in paginated"
          :key="p.id"
          :to="`/mural/${p.id}`"
          class="mural-card"
          :class="{ 'mural-card--com-img': p.imagens?.length > 0 }"
        >
          <!-- Capa -->
          <div v-if="p.imagens?.length > 0" class="mural-card-capa">
            <img :src="p.imagens[0]" :alt="p.titulo" class="mural-card-capa-img">
            <div v-if="p.imagens.length > 1" class="mural-capa-mais">+{{ p.imagens.length - 1 }}</div>
          </div>

          <div class="mural-card-body">
            <div class="mural-card-top">
              <span v-if="p.tipo" class="mural-tipo">{{ p.tipo }}</span>
              <span class="mural-data">{{ p.criadoEm }}</span>
            </div>
            <div class="mural-card-titulo">{{ p.titulo }}</div>
            <div class="mural-card-preview">{{ textoPlano(p.mensagem) }}</div>
            <div class="mural-card-footer">
              <span v-if="p.anexos?.length" class="mural-anexos-hint">{{ p.anexos.length }} anexo{{ p.anexos.length > 1 ? 's' : '' }}</span>
              <span class="mural-card-arrow">Ler mais →</span>
            </div>
            <div v-if="isAdmin" class="mural-card-admin">
              <button type="button" class="btn btn-outline btn-sm" @click.stop.prevent="abrirEdit(p)">Editar</button>
              <button type="button" class="btn btn-outline btn-sm mural-card-btn--danger" @click.stop.prevent="excluir(p)">Excluir</button>
            </div>
          </div>
        </RouterLink>
      </div>

      <Pagination :page="page" :totalPages="totalPages" @prev="prev" @next="next" @goto="goTo" />

      <datalist id="mural-tipos">
        <option v-for="t in tiposUnicos" :key="t" :value="t" />
      </datalist>
    </div>

    <SiteFooter />

    <!-- Admin: editar publicação -->
    <Teleport to="body">
      <div v-if="editModal" class="modal-overlay" @click.self="fecharEdit">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-edit-mural-title" v-focus-trap>
          <div class="modal-title" id="modal-edit-mural-title">Editar publicação</div>
          <div class="modal-body">
            <div class="field">
              <label>Título *</label>
              <input v-model="formEdit.titulo" type="text" maxlength="120">
              <span v-if="errosEdit.titulo" class="error-msg" style="display:block;">{{ errosEdit.titulo }}</span>
            </div>
            <div class="field">
              <label>Tipo de publicação</label>
              <input v-model="formEdit.tipo" type="text" placeholder="Ex.: Edital, Comunicado, Evento…" list="mural-tipos">
            </div>
            <div class="field">
              <label>Mensagem *</label>
              <textarea v-model="formEdit.mensagem" rows="7"></textarea>
              <span v-if="errosEdit.mensagem" class="error-msg" style="display:block;">{{ errosEdit.mensagem }}</span>
            </div>
            <div class="field">
              <label>Imagens</label>
              <button type="button" class="btn-foto" @click="fileEditRef.click()">+ Adicionar imagens</button>
              <input ref="fileEditRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensEdit">
              <div v-if="formEdit.imagens.length > 0" class="imagens-preview">
                <div v-for="(img, i) in formEdit.imagens" :key="i" class="img-thumb-wrap">
                  <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                  <button type="button" class="img-thumb-remove" @click="removerImagemEdit(i)">×</button>
                  <span v-if="i === 0" class="img-thumb-capa">capa</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="fecharEdit">Cancelar</button>
            <button class="btn btn-primary btn-sm" @click="salvarEdit">Salvar →</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mural-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
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

.mural-select {
  padding: 9px 12px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo', sans-serif;
  font-size: 0.88rem;
  color: var(--preto);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}
.mural-select:focus { border-color: var(--roxo); }

.mural-tipos {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
}

/* Grid principal */
.mural-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1.1rem;
  margin-bottom: 1.4rem;
}

/* Card base */
.mural-card {
  background: var(--creme);
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mural-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}

/* Card sem imagem mantém a borda lateral roxa */
.mural-card:not(.mural-card--com-img) {
  border-left: 4px solid var(--roxo);
}

/* Capa da imagem */
.mural-card-capa {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--creme-escuro);
  flex-shrink: 0;
}

.mural-card-capa-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.mural-card:hover .mural-card-capa-img {
  transform: scale(1.04);
}

.mural-capa-mais {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
}

/* Body do card */
.mural-card-body {
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.mural-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.mural-tipo {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.mural-data {
  font-size: 0.74rem;
  color: var(--cinza);
  flex-shrink: 0;
}

.mural-card-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--preto);
  line-height: 1.3;
}

.mural-card-preview {
  font-size: 0.84rem;
  color: var(--preto);
  opacity: 0.6;
  line-height: 1.55;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
}

.mural-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
}

.mural-anexos-hint {
  font-size: 0.73rem;
  color: var(--cinza);
}

.mural-card-arrow {
  font-size: 0.77rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  color: var(--roxo-escuro);
}

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
  margin-bottom: 1.4rem;
}
.empty-state p   { font-size: 1rem; font-weight: 600; color: var(--preto); margin-bottom: 0.4rem; }
.empty-state span { font-size: 0.85rem; color: var(--cinza); }

/* ── Admin: form e ações ──────────────────────────────────── */
.textarea { min-height: 160px; resize: vertical; max-height: 500px; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.mural-card-admin {
  display: flex;
  gap: 8px;
  margin-top: 0.6rem;
  position: relative;
  z-index: 1;
}

.mural-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.mural-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }

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
</style>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import EmptyState from '../components/EmptyState.vue'
import Modal from '../components/Modal.vue'
import { laboratorios, addLaboratorio, updateLaboratorio, deleteLaboratorio, type Laboratorio } from '../stores/informacoes.ts'
import { estruturas } from '../stores/mapa.ts'
import { isAdmin } from '../stores/auth.ts'
import { showToast } from '../stores/toast.ts'
import { useEscapeKey } from '../composables/useEscapeKey.ts'
import { isValidImageFile, validarNome, validarEmailOpcional, validarUrlOpcional } from '../utils/validation.ts'
import { comprimirImagem } from '../utils/imagem.ts'

const route = useRoute()
const busca = ref(String(route.query.busca ?? ''))

const lista = computed(() => {
  const t = busca.value.toLowerCase().trim()
  const base = [...laboratorios.value].sort((a, b) => a.nome.localeCompare(b.nome))
  if (!t) return base
  return base.filter(l => l.nome.toLowerCase().includes(t) || (l.sigla ?? '').toLowerCase().includes(t))
})

interface LaboratorioFormRascunho {
  nome: string
  sigla: string
  descricao: string
  imagem: string
  imagens: string[]
  email: string
  linkExterno: string
  estruturaId: number | string
}

function formVazio(): LaboratorioFormRascunho {
  return { nome: '', sigla: '', descricao: '', imagem: '', imagens: [], email: '', linkExterno: '', estruturaId: '' }
}

// ── Admin: novo laboratório ────────────────────────────────
const mostrarForm = ref(false)
const fileAddRef  = ref<HTMLInputElement | null>(null)
const fileGaleriaAddRef = ref<HTMLInputElement | null>(null)
const formAdd = reactive<LaboratorioFormRascunho>(formVazio())
const erros   = reactive({ nome: '', email: '', linkExterno: '' })

async function onImagemAdd(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); (e.target as HTMLInputElement).value = ''; return }
  formAdd.imagem = await comprimirImagem(file)
  ;(e.target as HTMLInputElement).value = ''
}
function removerImagemAdd() { formAdd.imagem = '' }

async function onGaleriaAdd(e: Event) {
  let invalido = false
  const files = (e.target as HTMLInputElement).files
  for (const file of files ?? []) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formAdd.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  ;(e.target as HTMLInputElement).value = ''
}
function removerGaleriaAdd(i: number) { formAdd.imagens.splice(i, 1) }

function publicar() {
  erros.nome        = validarNome(formAdd.nome)
  erros.email       = validarEmailOpcional(formAdd.email)
  erros.linkExterno = validarUrlOpcional(formAdd.linkExterno)
  if (erros.nome || erros.email || erros.linkExterno) return
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
  Object.assign(formAdd, formVazio())
  mostrarForm.value = false
  showToast('Laboratório cadastrado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, formVazio())
  Object.assign(erros, { nome: '', email: '', linkExterno: '' })
  mostrarForm.value = false
}

// ── Admin: editar/excluir laboratório (via modal) ─────────
const editModal = ref<Laboratorio | null>(null)
const fileEditRef = ref<HTMLInputElement | null>(null)
const fileGaleriaEditRef = ref<HTMLInputElement | null>(null)
const formEdit  = reactive<LaboratorioFormRascunho>(formVazio())
const errosEdit = reactive({ nome: '', email: '', linkExterno: '' })

function triggerFileEdit() {
  fileEditRef.value?.click()
}
function triggerGaleriaEdit() {
  fileGaleriaEditRef.value?.click()
}

function abrirEdit(l: Laboratorio) {
  Object.assign(errosEdit, { nome: '', email: '', linkExterno: '' })
  Object.assign(formEdit, {
    nome: l.nome, sigla: l.sigla ?? '', descricao: l.descricao ?? '',
    imagem: l.imagem ?? '', imagens: [...(l.imagens ?? [])], email: l.email ?? '',
    linkExterno: l.linkExterno ?? '', estruturaId: l.estruturaId ?? '',
  })
  editModal.value = l
}
function fecharEdit() { editModal.value = null }

async function onImagemEdit(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); (e.target as HTMLInputElement).value = ''; return }
  formEdit.imagem = await comprimirImagem(file)
  ;(e.target as HTMLInputElement).value = ''
}
function removerImagemEdit() { formEdit.imagem = '' }

async function onGaleriaEdit(e: Event) {
  let invalido = false
  const files = (e.target as HTMLInputElement).files
  for (const file of files ?? []) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    formEdit.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  ;(e.target as HTMLInputElement).value = ''
}
function removerGaleriaEdit(i: number) { formEdit.imagens.splice(i, 1) }

function salvarEdit() {
  errosEdit.nome        = validarNome(formEdit.nome)
  errosEdit.email       = validarEmailOpcional(formEdit.email)
  errosEdit.linkExterno = validarUrlOpcional(formEdit.linkExterno)
  if (errosEdit.nome || errosEdit.email || errosEdit.linkExterno) return
  updateLaboratorio(editModal.value!.id, {
    nome: formEdit.nome.trim(),
    sigla: formEdit.sigla.trim(),
    descricao: formEdit.descricao.trim(),
    imagem: formEdit.imagem || null,
    imagens: [...formEdit.imagens],
    email: formEdit.email.trim(),
    linkExterno: formEdit.linkExterno.trim(),
    estruturaId: formEdit.estruturaId ? Number(formEdit.estruturaId) : null,
  })
  editModal.value = null
  showToast('Laboratório atualizado.', 'success')
}

function excluir(l: Laboratorio) {
  if (!confirm(`Remover "${l.nome}" dos laboratórios?`)) return
  deleteLaboratorio(l.id)
  showToast('Laboratório removido.', 'info')
}

useEscapeKey(() => fecharEdit())
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/informacoes" label="Informações" />
      <div class="page-heading">
        <h2>Laboratórios do <span>Departamento</span></h2>
        <button v-if="isAdmin" type="button" class="btn btn-outline btn-outline-creme btn-sm" @click="mostrarForm = !mostrarForm">
          {{ mostrarForm ? '— Fechar' : '+ Novo laboratório' }}
        </button>
      </div>

      <!-- Admin: novo laboratório -->
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
          <button type="button" class="btn-foto" @click="fileAddRef?.click()" style="margin-top:8px;">
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
          <button type="button" class="btn-foto" @click="fileGaleriaAddRef?.click()" style="margin-top:8px;">+ Adicionar fotos</button>
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

      <input v-model="busca" type="search" class="mural-search" placeholder="Buscar laboratório…" style="margin-bottom:1.2rem;">

      <EmptyState
        v-if="lista.length === 0"
        :title="laboratorios.length === 0 ? 'Nenhum laboratório cadastrado ainda.' : 'Nenhum laboratório encontrado.'"
      />

      <div class="lab-grid">
        <RouterLink v-for="l in lista" :key="l.id" :to="`/informacoes/laboratorios/${l.id}`" class="lab-card">
          <div v-if="l.imagem" class="lab-card-img-wrap">
            <img :src="l.imagem" :alt="l.nome" class="lab-card-img">
          </div>
          <div class="lab-card-body">
            <div class="lab-card-top">
              <span class="lab-card-nome">{{ l.nome }}</span>
              <span v-if="l.sigla" class="diretorio-pill">{{ l.sigla }}</span>
            </div>
            <p v-if="l.descricao" class="lab-card-desc">{{ l.descricao }}</p>
            <div class="lab-card-footer">
              <span class="diretorio-local">Ver detalhes →</span>
            </div>
            <div v-if="isAdmin" class="pub-card-actions" @click.stop.prevent>
              <button type="button" class="btn btn-outline pub-card-btn" @click="abrirEdit(l)">Editar</button>
              <button type="button" class="btn btn-outline pub-card-btn pub-card-btn--danger" @click="excluir(l)">Excluir</button>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>

    <SiteFooter />

    <!-- Admin: editar laboratório -->
    <Modal v-if="editModal" title-id="modal-edit-lab-title" @close="fecharEdit">
      <div class="modal-title" id="modal-edit-lab-title">Editar laboratório</div>
      <div class="modal-body">
        <div class="field">
          <label>Nome *</label>
          <input v-model="formEdit.nome" type="text">
          <span v-if="errosEdit.nome" class="error-msg" style="display:block;">{{ errosEdit.nome }}</span>
        </div>
        <div class="field">
          <label>Sigla</label>
          <input v-model="formEdit.sigla" type="text" style="max-width:160px;">
        </div>
        <div class="field">
          <label>Descrição</label>
          <textarea v-model="formEdit.descricao" rows="4"></textarea>
        </div>
        <div class="field">
          <label>Link externo</label>
          <input v-model="formEdit.linkExterno" type="url" :class="{ invalid: errosEdit.linkExterno }">
          <span v-if="errosEdit.linkExterno" class="error-msg" style="display:block;">{{ errosEdit.linkExterno }}</span>
        </div>
        <div class="field">
          <label>Sala / Localização</label>
          <select v-model="formEdit.estruturaId">
            <option value="">Nenhuma</option>
            <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>
        <div class="field">
          <label>Foto de capa</label>
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
          <label>Fotos extras <span class="field-hint">(equipe, eventos etc.)</span></label>
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
          <label>E-mail de contato</label>
          <input v-model="formEdit.email" type="email" :class="{ invalid: errosEdit.email }">
          <span v-if="errosEdit.email" class="error-msg" style="display:block;">{{ errosEdit.email }}</span>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline btn-sm" @click="fecharEdit">Cancelar</button>
        <button class="btn btn-primary btn-sm" @click="salvarEdit">Salvar →</button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.mural-search {
  width: 100%; padding: 9px 14px; background: var(--branco); border: 2px solid var(--creme-escuro);
  border-radius: 2px; font-family: 'Archivo', sans-serif; font-size: 0.92rem; color: var(--preto);
  outline: none; transition: border-color 0.2s;
}
.mural-search:focus { border-color: var(--roxo); }

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.1rem;
}

.lab-card {
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.lab-card:hover {
  transform: translateY(-3px);
  box-shadow: 3px 6px 0 var(--roxo-escuro);
}

.lab-card-img-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--creme-escuro);
  overflow: hidden;
}
.lab-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.lab-card-body { padding: 1rem 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
.lab-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.lab-card-nome { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 0.98rem; color: var(--preto); }

.diretorio-pill {
  font-size: 0.67rem; font-weight: 700; font-family: 'Archivo Black', sans-serif; padding: 2px 7px;
  border-radius: 2px; border: 1px solid rgba(80,64,160,0.25); background: rgba(80,64,160,0.12);
  color: var(--roxo-escuro); text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
}

.lab-card-desc {
  font-size: 0.84rem; color: var(--preto); opacity: 0.75; line-height: 1.55;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; flex: 1;
}

.lab-card-footer { display: flex; flex-direction: column; gap: 4px; margin-top: 0.2rem; }
.diretorio-local {
  display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; font-weight: 700;
  font-family: 'Archivo Black', sans-serif; color: var(--roxo-escuro); text-decoration: none; width: fit-content;
}
.diretorio-local-icon { display: flex; align-items: center; }
.diretorio-local-icon :deep(svg) { width: 13px; height: 13px; }

/* ── Admin: form, modal de edição e ações ─────────────────── */
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

.imagens-preview { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.img-thumb-wrap { position: relative; flex-shrink: 0; }
.img-thumb { width: 90px; height: 60px; object-fit: cover; border-radius: 2px; border: 1.5px solid var(--creme-escuro); display: block; }
.img-thumb-remove {
  position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%;
  background: var(--preto); color: var(--branco); border: none; font-size: 0.75rem; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.pub-card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.6rem; position: relative; z-index: 1; }
.pub-card-btn { padding: 5px 14px; font-size: 0.82rem; }
.pub-card-btn--danger { color: var(--vermelho, #c0392b); border-color: var(--vermelho, #c0392b); }
.pub-card-btn--danger:hover { background: var(--vermelho, #c0392b); color: var(--branco); }
</style>

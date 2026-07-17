<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import {
  membros, addMembro, removeMembro, updateMembro,
  descricaoGestao, saveDescricao, gestaoInfo, saveInfo, MESES,
  historicoGestoes, historicoVisivel, setHistoricoVisivel,
  arquivarGestaoAtual, removerGestaoHistorico, adicionarGestaoManual,
  missaoTexto, saveMissao, contatoInfo, saveContato, periodoFormatado,
  secoesCustom, addSecao, updateSecao, removeSecao, moverSecao,
} from '../stores/equipe.js'
import { CENTRO_PADRAO } from '../stores/mapa.js'
import { markdownParaHtmlSeguro } from '../utils/markdown.js'
import { isAdmin } from '../stores/auth.js'
import { showToast } from '../stores/toast.js'
import { isEmail, isUrl, isValidImageFile } from '../utils/validation.js'
import pencilIcon from '../assets/icons/pencil.svg?raw'
import xIcon from '../assets/icons/x.svg?raw'

const missaoHtml = computed(() => markdownParaHtmlSeguro(missaoTexto.value))
function descricaoHtml(texto) { return markdownParaHtmlSeguro(texto) }

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const expandido = ref(null)
function toggleGestao(id) { expandido.value = expandido.value === id ? null : id }

import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
import cameraIcon from '../assets/icons/camera.svg?raw'

// ── Modo de edição (admin) ──────────────────────────────────
const route = useRoute()
const editando = ref(isAdmin.value && route.query.editar === '1')

// --- Missão e história ---
const missaoEdit = ref(missaoTexto.value)
function salvarMissao() {
  saveMissao(missaoEdit.value.trim())
  showToast('Missão atualizada.', 'success')
}

// --- Contato ---
const contatoEdit = ref({ ...contatoInfo.value })
function salvarContato() {
  saveContato({
    endereco:  contatoEdit.value.endereco.trim(),
    email:     contatoEdit.value.email.trim(),
    instagram: contatoEdit.value.instagram.trim().replace(/^@/, ''),
  })
  showToast('Contato atualizado.', 'success')
}

// --- Informações da gestão ---
const info      = ref({ ...gestaoInfo.value })
const descricao = ref(descricaoGestao.value)
const errosInfo = ref({})

function validarAno(ano) {
  if (!ano) return ''
  const n = Number(ano)
  return (n < 1990 || n > 2099) ? 'Ano deve estar entre 1990 e 2099.' : ''
}

function validarInfo() {
  const e = {}
  e.anoInicio = validarAno(info.value.anoInicio)
  e.anoFim    = validarAno(info.value.anoFim)
  if (!e.anoInicio && !e.anoFim && info.value.anoInicio && info.value.anoFim) {
    const idxIni = MESES.indexOf(info.value.mesInicio)
    const idxFim = MESES.indexOf(info.value.mesFim)
    const valIni = Number(info.value.anoInicio) * 12 + (idxIni >= 0 ? idxIni : 0)
    const valFim = Number(info.value.anoFim) * 12 + (idxFim >= 0 ? idxFim : 0)
    if (valFim < valIni) e.anoFim = 'O fim da gestão não pode ser antes do início.'
  }
  return e
}

function salvarInfo() {
  const e = validarInfo()
  errosInfo.value = e
  if (e.anoInicio || e.anoFim) return
  saveInfo({
    nomeChapa: info.value.nomeChapa.trim(),
    mesInicio: info.value.mesInicio,
    anoInicio: info.value.anoInicio,
    mesFim:    info.value.mesFim,
    anoFim:    info.value.anoFim,
  })
  saveDescricao(descricao.value.trim())
  showToast('Informações salvas.', 'success')
}

// --- Utilitário compartilhado ---
function comprimirImagem(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        else if (h > MAX)     { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

function validarUrlOpcional(url) {
  return !!(url.trim() && !isUrl(url))
}

// --- Editar membro existente ---
const editandoMembroId = ref(null)
const editForm    = ref(null)
const errorsEdit  = ref({})
const fileEditRef = ref(null)

function iniciarEdicaoMembro(membro) {
  editandoMembroId.value = membro.id
  editForm.value   = { linkedin: '', git: '', lattes: '', ...membro }
  errorsEdit.value = {}
}

function cancelarEdicaoMembro() {
  editandoMembroId.value = null
  editForm.value   = null
  errorsEdit.value = {}
}

async function onFotoEdit(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  editForm.value.foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFotoEdit() { editForm.value.foto = '' }

function salvarEdicaoMembro() {
  const e = {}
  if (!editForm.value.nome.trim())    e.nome  = true
  if (!isEmail(editForm.value.email)) e.email = true
  if (validarUrlOpcional(editForm.value.linkedin)) e.linkedin = true
  if (validarUrlOpcional(editForm.value.git))      e.git      = true
  if (validarUrlOpcional(editForm.value.lattes))   e.lattes   = true
  errorsEdit.value = e
  if (Object.keys(e).length) return
  updateMembro(editandoMembroId.value, { ...editForm.value })
  showToast('Membro atualizado.', 'success')
  cancelarEdicaoMembro()
}

function confirmarRemocaoMembro(id, nome) {
  if (confirm(`Remover "${nome}" da equipe?`)) {
    if (editandoMembroId.value === id) cancelarEdicaoMembro()
    removeMembro(id)
  }
}

// --- Modal de detalhes do membro ---
const membroModal = ref(null)
function abrirMembroModal(membro) { membroModal.value = membro }
function fecharMembroModal() { membroModal.value = null }

const algumModalMembroAberto = computed(() => !!membroModal.value || !!editandoMembroId.value)
watch(algumModalMembroAberto, (aberto) => {
  document.body.style.overflow = aberto ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
useEscapeKey(() => { fecharMembroModal(); if (editandoMembroId.value) cancelarEdicaoMembro() })

// --- Carrossel de membros (setas + arraste no clique) ───────
const membroScrollEl = ref(null)
const membroDragging = ref(false)
let membroStartX = 0
let membroScrollStart = 0
let membroMoved = false

function membroScrollBy(dir) {
  const el = membroScrollEl.value
  if (!el) return
  const card = el.querySelector('.membro-card')
  const passo = card ? card.offsetWidth + 16 : 200
  const maxScroll = el.scrollWidth - el.clientWidth
  if (dir > 0 && el.scrollLeft >= maxScroll - 20) { el.scrollTo({ left: 0, behavior: 'smooth' }); return }
  if (dir < 0 && el.scrollLeft <= 20) { el.scrollTo({ left: maxScroll, behavior: 'smooth' }); return }
  el.scrollBy({ left: dir * passo, behavior: 'smooth' })
}

function membroDragStart(e) {
  if (!membroScrollEl.value) return
  membroDragging.value = true
  membroMoved = false
  membroStartX = e.pageX
  membroScrollStart = membroScrollEl.value.scrollLeft
}
function membroDragMove(e) {
  if (!membroDragging.value) return
  const dx = e.pageX - membroStartX
  if (Math.abs(dx) > 4) membroMoved = true
  membroScrollEl.value.scrollLeft = membroScrollStart - dx
}
function membroDragEnd() { membroDragging.value = false }
function membroClickGuard(a) {
  if (membroMoved) { membroMoved = false; return }
  if (!editando.value) abrirMembroModal(a)
}

// --- Adicionar novo membro ---
const mostraFormAdd = ref(false)
const formAdd = ref({ nome: '', email: '', diretoria: '', periodo: '', foto: '', descricao: '', linkedin: '', git: '', lattes: '' })
const errorsAdd  = ref({})
const fileAddRef = ref(null)

function toggleFormAdd() {
  mostraFormAdd.value = !mostraFormAdd.value
  if (!mostraFormAdd.value) resetFormAdd()
}

function resetFormAdd() {
  formAdd.value  = { nome: '', email: '', periodo: '', foto: '', descricao: '', linkedin: '', git: '', lattes: '' }
  errorsAdd.value = {}
}

async function onFotoAdd(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  formAdd.value.foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFotoAdd() { formAdd.value.foto = '' }

function cadastrarMembro() {
  const e = {}
  if (!formAdd.value.nome.trim())  e.nome  = true
  if (!isEmail(formAdd.value.email)) e.email = true
  if (validarUrlOpcional(formAdd.value.linkedin)) e.linkedin = true
  if (validarUrlOpcional(formAdd.value.git))      e.git      = true
  if (validarUrlOpcional(formAdd.value.lattes))   e.lattes   = true
  errorsAdd.value = e
  if (Object.keys(e).length) return
  addMembro({ ...formAdd.value })
  showToast('Membro cadastrado.', 'success')
  resetFormAdd()
  mostraFormAdd.value = false
}

// --- Gestões anteriores ---
const confirmandoArquivar = ref(false)
const mostraFormManual    = ref(false)

const formManual = ref({ nomeChapa: '', periodo: '', descricao: '' })
const membrosManual = ref([])

function addMembroManual() {
  membrosManual.value.push({ nome: '', diretoria: '', periodo: '', foto: '' })
}

async function onFotoMembroManual(e, i) {
  const file = e.target.files[0]
  if (!file) return
  if (!isValidImageFile(file)) { showToast('Selecione uma imagem de até 8MB.', 'error'); e.target.value = ''; return }
  membrosManual.value[i].foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFotoMembroManual(i) {
  membrosManual.value[i].foto = ''
}
function removeMembroManual(i) {
  membrosManual.value.splice(i, 1)
}

function salvarManual() {
  if (!formManual.value.nomeChapa.trim()) {
    showToast('Informe o nome da chapa.', 'error')
    return
  }
  adicionarGestaoManual({
    nomeChapa: formManual.value.nomeChapa.trim(),
    periodo:   formManual.value.periodo.trim(),
    descricao: formManual.value.descricao.trim(),
    membros:   membrosManual.value
      .map(m => ({ nome: m.nome.trim(), diretoria: m.diretoria.trim(), periodo: m.periodo.trim() }))
      .filter(m => m.nome),
  })
  formManual.value = { nomeChapa: '', periodo: '', descricao: '' }
  membrosManual.value = []
  mostraFormManual.value = false
  showToast('Gestão adicionada ao histórico.', 'success')
}

function arquivar() {
  arquivarGestaoAtual()
  confirmandoArquivar.value = false
  showToast('Gestão arquivada no histórico.', 'success')
}

// --- Seções customizadas ---
const mostraFormSecao = ref(false)
const formSecao = ref({ titulo: '', conteudo: '' })

function toggleFormSecao() {
  mostraFormSecao.value = !mostraFormSecao.value
  if (!mostraFormSecao.value) formSecao.value = { titulo: '', conteudo: '' }
}

function cadastrarSecao() {
  if (!formSecao.value.titulo.trim()) {
    showToast('Informe o título da seção.', 'error')
    return
  }
  addSecao({ titulo: formSecao.value.titulo.trim(), conteudo: formSecao.value.conteudo.trim() })
  formSecao.value = { titulo: '', conteudo: '' }
  mostraFormSecao.value = false
  showToast('Seção adicionada.', 'success')
}

const editandoSecaoId = ref(null)
const editFormSecao = ref(null)

function iniciarEdicaoSecao(secao) {
  editandoSecaoId.value = secao.id
  editFormSecao.value = { ...secao }
}

function cancelarEdicaoSecao() {
  editandoSecaoId.value = null
  editFormSecao.value = null
}

function salvarEdicaoSecao() {
  if (!editFormSecao.value.titulo.trim()) {
    showToast('Informe o título da seção.', 'error')
    return
  }
  updateSecao(editandoSecaoId.value, {
    titulo: editFormSecao.value.titulo.trim(),
    conteudo: editFormSecao.value.conteudo.trim(),
  })
  showToast('Seção atualizada.', 'success')
  cancelarEdicaoSecao()
}

function confirmarRemocaoSecao(id, titulo) {
  if (confirm(`Remover a seção "${titulo}"?`)) {
    if (editandoSecaoId.value === id) cancelarEdicaoSecao()
    removeSecao(id)
  }
}

const mapaMiniEl = ref(null)
let mapaMini = null

onMounted(() => {
  if (!mapaMiniEl.value) return
  mapaMini = L.map(mapaMiniEl.value, {
    zoomControl: false,
    scrollWheelZoom: false,
  }).setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 17)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapaMini)
  L.marker([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng]).addTo(mapaMini)
})

onBeforeUnmount(() => { mapaMini?.remove() })
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:2rem;flex:1;">
      <div class="sobre-topo">
        <BackLink to="/" />
        <button v-if="isAdmin" type="button" class="btn btn-outline btn-outline-creme btn-sm" @click="editando = !editando">
          {{ editando ? 'Sair da edição' : '✎ Editar página' }}
        </button>
      </div>
      <div class="section-label">Quem somos</div>
      <h1 class="section-title">Sobre o <span>CAESI</span></h1>

      <div class="paper paper-mb-lg">
        <h2 class="paper-title">Nossa história e missão</h2>
        <div class="sobre-missao-grid">
          <div v-if="!editando" class="sobre-missao-texto" v-html="missaoHtml"></div>
          <div v-else class="field" style="margin:0;">
            <textarea v-model="missaoEdit" rows="8" placeholder="Conte a história e a missão do CAESI…"></textarea>
            <p class="field-hint" style="margin-top:4px;">Suporta Markdown: **negrito**, *itálico*, listas, links…</p>
            <button class="btn btn-primary btn-sm" style="margin-top:0.6rem;" @click="salvarMissao">Salvar missão →</button>
          </div>
          <div class="sobre-img-placeholder">
            <span v-html="cameraIcon"></span>
            <p>Foto histórica ou da sala do CAESI</p>
          </div>
        </div>
      </div>

      <div class="paper paper-mb-lg paper--meio">
        <template v-if="!editando">
          <div class="gestao-header">
            <div>
              <h2 class="paper-title" style="margin-bottom:0;">Gestão atual</h2>
              <div v-if="gestaoInfo.nomeChapa" class="chapa-nome">{{ gestaoInfo.nomeChapa }}</div>
            </div>
            <div v-if="periodoFormatado" class="chapa-periodo">{{ periodoFormatado }}</div>
          </div>

          <div v-if="descricaoGestao" class="gestao-desc">
            <p class="gestao-texto">{{ descricaoGestao }}</p>
          </div>
        </template>

        <template v-else>
          <p class="secao-sep" style="margin-top:0;">Informações da gestão</p>
          <div class="field">
            <label for="nome-chapa">Nome da chapa</label>
            <input id="nome-chapa" v-model="info.nomeChapa" type="text" placeholder="Ex.: Compilando Futuros" maxlength="60">
          </div>
          <div class="field">
            <label>Período da gestão</label>
            <div class="periodo-grid">
              <div class="periodo-group">
                <span class="periodo-label">Início</span>
                <div class="periodo-selects">
                  <select v-model="info.mesInicio" class="select-mes">
                    <option value="">Mês</option>
                    <option v-for="m in MESES" :key="m" :value="m">{{ m }}</option>
                  </select>
                  <input v-model="info.anoInicio" type="number" class="input-ano" placeholder="Ano" min="1990" max="2099" :class="{ invalid: errosInfo.anoInicio }">
                  <span v-if="errosInfo.anoInicio" class="error-msg" style="display:block;">{{ errosInfo.anoInicio }}</span>
                </div>
              </div>
              <span class="periodo-sep">–</span>
              <div class="periodo-group">
                <span class="periodo-label">Fim</span>
                <div class="periodo-selects">
                  <select v-model="info.mesFim" class="select-mes">
                    <option value="">Mês</option>
                    <option v-for="m in MESES" :key="m" :value="m">{{ m }}</option>
                  </select>
                  <input v-model="info.anoFim" type="number" class="input-ano" placeholder="Ano" min="1990" max="2099" :class="{ invalid: errosInfo.anoFim }">
                  <span v-if="errosInfo.anoFim" class="error-msg" style="display:block;">{{ errosInfo.anoFim }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <label for="descricao-gestao">Sobre a gestão atual</label>
            <textarea id="descricao-gestao" v-model="descricao" rows="4"
              placeholder="Conte um pouco sobre a chapa, seus objetivos e o que planejam para a gestão…"></textarea>
            <div class="char-count">{{ descricao.length }} caracteres</div>
          </div>
          <button class="btn btn-primary btn-sm" @click="salvarInfo">Salvar informações →</button>
        </template>

        <div class="equipe-titulo-row">
          <h3 class="equipe-titulo" style="margin:0;">Conheça a gente!</h3>
          <button v-if="editando" class="btn btn-outline btn-sm" @click="toggleFormAdd">
            {{ mostraFormAdd ? 'Cancelar' : '+ Adicionar membro' }}
          </button>
        </div>

        <!-- Formulário de adição de membro -->
        <div v-if="editando && mostraFormAdd" class="paper paper-mb add-form-box" style="margin-top:1rem;">
          <p class="secao-sep" style="margin-top:0;">Novo membro</p>
          <p style="font-size:0.82rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
            Esse membro aparece na página Sobre — ele não tem acesso ao painel administrativo.
          </p>
          <div class="admin-form-grid">
            <div class="field">
              <label>Nome *</label>
              <input v-model="formAdd.nome" type="text" placeholder="Nome completo" maxlength="80" :class="{ invalid: errorsAdd.nome }">
              <span class="error-msg">Preencha o nome.</span>
            </div>
            <div class="field">
              <label>E-mail *</label>
              <input v-model="formAdd.email" type="email" placeholder="membro@email.com" :class="{ invalid: errorsAdd.email }">
              <span class="error-msg">Informe um e-mail válido.</span>
            </div>
            <div class="field">
              <label>Diretoria <span class="field-hint">(opcional)</span></label>
              <input v-model="formAdd.diretoria" type="text" placeholder="Ex.: Financeira" maxlength="60">
            </div>
            <div class="field">
              <label>Período <span class="field-hint">(ex.: 2024.2)</span></label>
              <input v-model="formAdd.periodo" type="text" placeholder="Ex.: 2024.2" maxlength="10">
            </div>
          </div>
          <div class="field">
            <label>Descrição <span class="field-hint">(opcional, Markdown)</span></label>
            <textarea v-model="formAdd.descricao" rows="2" placeholder="Cargo, área de atuação, etc."></textarea>
          </div>
          <div class="admin-form-grid">
            <div class="field">
              <label>LinkedIn <span class="field-hint">(opcional)</span></label>
              <input v-model="formAdd.linkedin" type="url" placeholder="https://linkedin.com/in/..." :class="{ invalid: errorsAdd.linkedin }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
            <div class="field">
              <label>GitHub <span class="field-hint">(opcional)</span></label>
              <input v-model="formAdd.git" type="url" placeholder="https://github.com/..." :class="{ invalid: errorsAdd.git }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
            <div class="field">
              <label>Lattes <span class="field-hint">(opcional)</span></label>
              <input v-model="formAdd.lattes" type="url" placeholder="http://lattes.cnpq.br/..." :class="{ invalid: errorsAdd.lattes }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
          </div>
          <div class="field">
            <label>Foto <span class="field-hint">(opcional)</span></label>
            <div class="foto-row">
              <div class="avatar-sm">
                <img v-if="formAdd.foto" :src="formAdd.foto" class="avatar-img" alt="">
                <span v-else class="avatar-initial">{{ formAdd.nome?.[0]?.toUpperCase() || '?' }}</span>
              </div>
              <button class="btn-foto" @click="fileAddRef.click()">{{ formAdd.foto ? 'Trocar foto' : 'Escolher foto' }}</button>
              <button v-if="formAdd.foto" class="btn-remover-foto" @click="removerFotoAdd">Remover</button>
              <input ref="fileAddRef" type="file" accept="image/*" style="display:none" @change="onFotoAdd">
            </div>
          </div>
          <div class="btn-row" style="margin-top:0.4rem;">
            <button class="btn btn-primary" @click="cadastrarMembro">Cadastrar membro →</button>
            <button class="btn btn-outline btn-sm" @click="toggleFormAdd">Cancelar</button>
          </div>
        </div>

        <div v-if="membros.length === 0" style="font-size:0.9rem;color:var(--cinza);padding:0.5rem 0;">
          Nenhum membro cadastrado ainda.
        </div>
        <div v-else class="membro-carrossel-wrap">
          <button class="carrossel-nav-btn carrossel-nav-btn--prev" aria-label="Membro anterior" @click="membroScrollBy(-1)">&lt;</button>
          <div
            ref="membroScrollEl"
            class="membro-carrossel"
            :class="{ 'membro-carrossel--arrastando': membroDragging }"
            @mousedown="membroDragStart"
            @mousemove="membroDragMove"
            @mouseup="membroDragEnd"
            @mouseleave="membroDragEnd"
          >
            <div v-for="a in membros" :key="a.id" class="membro-card" @click="membroClickGuard(a)">
              <div v-if="editando" class="membro-admin-btns">
                <button class="icon-btn" title="Editar" @click.stop="iniciarEdicaoMembro(a)" v-html="pencilIcon"></button>
                <button class="icon-btn icon-btn--danger" title="Remover" @click.stop="confirmarRemocaoMembro(a.id, a.nome)" v-html="xIcon"></button>
              </div>
              <div class="membro-avatar">
                <img v-if="a.foto" :src="a.foto" :alt="a.nome" class="membro-foto">
                <span v-else class="membro-inicial">{{ a.nome?.[0]?.toUpperCase() || '?' }}</span>
              </div>
              <div class="membro-nome">{{ a.nome }}</div>
              <div v-if="a.diretoria" class="membro-periodo">{{ a.diretoria }}</div>
              <div v-else-if="a.periodo" class="membro-periodo">{{ a.periodo }}</div>
            </div>
          </div>
          <button class="carrossel-nav-btn carrossel-nav-btn--next" aria-label="Próximo membro" @click="membroScrollBy(1)">&gt;</button>
        </div>
      </div>

      <!-- Modal: detalhes do membro -->
      <Teleport to="body">
        <div v-if="membroModal" class="modal-overlay" @click.self="fecharMembroModal">
          <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
            <div class="membro-modal-avatar">
              <img v-if="membroModal.foto" :src="membroModal.foto" :alt="membroModal.nome" class="membro-foto">
              <span v-else class="membro-inicial">{{ membroModal.nome?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="modal-title" style="text-align:center;">{{ membroModal.nome }}</div>
            <div v-if="membroModal.diretoria" class="membro-periodo" style="width:fit-content;margin:0 auto 0.8rem;">{{ membroModal.diretoria }}</div>
            <div v-else-if="membroModal.periodo" class="membro-periodo" style="width:fit-content;margin:0 auto 0.8rem;">{{ membroModal.periodo }}</div>
            <div v-if="membroModal.email" class="membro-email" style="text-align:center;margin-bottom:0.8rem;">{{ membroModal.email }}</div>
            <div v-if="membroModal.descricao" class="modal-body" v-html="descricaoHtml(membroModal.descricao)"></div>
            <div v-if="membroModal.linkedin || membroModal.git || membroModal.lattes" class="membro-links" style="justify-content:center;margin-bottom:1rem;">
              <a v-if="membroModal.linkedin" :href="membroModal.linkedin" target="_blank" rel="noopener" class="membro-link">LinkedIn</a>
              <a v-if="membroModal.git"      :href="membroModal.git"      target="_blank" rel="noopener" class="membro-link">GitHub</a>
              <a v-if="membroModal.lattes"   :href="membroModal.lattes"   target="_blank" rel="noopener" class="membro-link">Lattes</a>
            </div>
            <div class="modal-actions">
              <button class="btn btn-outline btn-sm" @click="fecharMembroModal">Fechar</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Modal: editar membro -->
      <Teleport to="body">
        <div v-if="editandoMembroId" class="modal-overlay" @click.self="cancelarEdicaoMembro">
          <div class="modal-box" role="dialog" aria-modal="true" v-focus-trap>
            <p class="secao-sep" style="margin-top:0;">Editar membro</p>
            <div class="field">
              <label>Nome *</label>
              <input v-model="editForm.nome" type="text" maxlength="80" :class="{ invalid: errorsEdit.nome }">
              <span class="error-msg">Preencha o nome.</span>
            </div>
            <div class="field">
              <label>E-mail *</label>
              <input v-model="editForm.email" type="email" :class="{ invalid: errorsEdit.email }">
              <span class="error-msg">Informe um e-mail válido.</span>
            </div>
            <div class="field">
              <label>Diretoria</label>
              <input v-model="editForm.diretoria" type="text" maxlength="60">
            </div>
            <div class="field">
              <label>Período <span class="field-hint">(ex.: 2024.2)</span></label>
              <input v-model="editForm.periodo" type="text" maxlength="10">
            </div>
            <div class="field">
              <label>Descrição <span class="field-hint">(Markdown)</span></label>
              <textarea v-model="editForm.descricao" rows="2"></textarea>
            </div>
            <div class="field">
              <label>LinkedIn</label>
              <input v-model="editForm.linkedin" type="url" placeholder="https://linkedin.com/in/..." :class="{ invalid: errorsEdit.linkedin }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
            <div class="field">
              <label>GitHub</label>
              <input v-model="editForm.git" type="url" placeholder="https://github.com/..." :class="{ invalid: errorsEdit.git }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
            <div class="field">
              <label>Lattes</label>
              <input v-model="editForm.lattes" type="url" placeholder="http://lattes.cnpq.br/..." :class="{ invalid: errorsEdit.lattes }">
              <span class="error-msg">Informe um link válido.</span>
            </div>
            <div class="field">
              <label>Foto</label>
              <div class="foto-row">
                <div class="avatar-sm">
                  <img v-if="editForm.foto" :src="editForm.foto" class="avatar-img" alt="">
                  <span v-else class="avatar-initial">{{ editForm.nome?.[0]?.toUpperCase() || '?' }}</span>
                </div>
                <button class="btn-foto" @click="fileEditRef.click()">{{ editForm.foto ? 'Trocar foto' : 'Escolher foto' }}</button>
                <button v-if="editForm.foto" class="btn-remover-foto" @click="removerFotoEdit">Remover</button>
                <input ref="fileEditRef" type="file" accept="image/*" style="display:none" @change="onFotoEdit">
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary btn-sm" @click="salvarEdicaoMembro">Salvar →</button>
              <button class="btn btn-outline btn-sm" @click="cancelarEdicaoMembro">Cancelar</button>
            </div>
          </div>
        </div>
      </Teleport>

      <div v-if="editando || (historicoVisivel && historicoGestoes.length)" class="paper paper-mb-lg paper--meio">
        <div class="hist-cabecalho">
          <h2 class="paper-title" style="margin-bottom:0;">Gestões anteriores</h2>
          <div v-if="editando" class="hist-cabecalho-acoes">
            <label class="hist-toggle-label">
              <input type="checkbox" :checked="historicoVisivel" @change="setHistoricoVisivel($event.target.checked)">
              Visível no Sobre
            </label>
            <button class="btn btn-outline btn-sm" @click="mostraFormManual = !mostraFormManual">
              {{ mostraFormManual ? '— Fechar' : '+ Adicionar' }}
            </button>
            <button v-if="!confirmandoArquivar" class="btn btn-outline btn-sm" @click="confirmandoArquivar = true">
              Arquivar atual →
            </button>
          </div>
        </div>

        <!-- Formulário adição manual -->
        <div v-if="editando && mostraFormManual" class="hist-form">
          <div class="label-sm" style="margin-bottom:0.8rem;">Nova gestão anterior</div>
          <div class="field">
            <label class="label">Nome da chapa *</label>
            <input v-model="formManual.nomeChapa" type="text" class="input" placeholder="Ex.: Chapa Conexão">
          </div>
          <div class="field">
            <label class="label">Período</label>
            <input v-model="formManual.periodo" type="text" class="input" placeholder="Ex.: Jan 2023 – Dez 2023">
          </div>
          <div class="field">
            <label class="label">Descrição</label>
            <textarea v-model="formManual.descricao" class="input" rows="3" placeholder="Breve descrição da gestão…" style="resize:vertical;"></textarea>
          </div>
          <div class="field">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
              <label class="label" style="margin:0;">Membros</label>
              <button type="button" class="btn btn-outline btn-sm" @click="addMembroManual">+ Membro</button>
            </div>
            <div v-if="membrosManual.length" class="hist-membros-form">
              <div v-for="(m, i) in membrosManual" :key="i" class="hist-membro-row">
                <label class="hist-avatar-btn" :title="m.foto ? 'Trocar foto' : 'Adicionar foto'">
                  <img v-if="m.foto" :src="m.foto" class="hist-avatar-img" :alt="m.nome">
                  <span v-else class="hist-avatar-inicial">{{ m.nome?.[0]?.toUpperCase() || '?' }}</span>
                  <input type="file" accept="image/*" style="display:none" @change="onFotoMembroManual($event, i)">
                </label>
                <input v-model="m.nome"      type="text" class="input" placeholder="Nome">
                <input v-model="m.diretoria" type="text" class="input" placeholder="Diretoria">
                <input v-model="m.periodo"   type="text" class="input" placeholder="Período">
                <button type="button" class="icon-btn icon-btn--danger" @click="removeMembroManual(i)" v-html="xIcon"></button>
              </div>
            </div>
            <p v-else style="font-size:0.82rem;color:var(--cinza);margin:0;">Nenhum membro adicionado.</p>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:0.4rem;">
            <button class="btn btn-outline btn-sm" @click="mostraFormManual = false">Cancelar</button>
            <button class="btn btn-primary btn-sm" @click="salvarManual">Salvar →</button>
          </div>
        </div>

        <!-- Confirmação arquivar atual -->
        <div v-if="editando && confirmandoArquivar" class="hist-confirm">
          <p style="font-size:0.88rem;margin:0 0 0.8rem;">
            Salva um snapshot da gestão <strong>{{ gestaoInfo.nomeChapa || 'atual' }}</strong> no histórico público. Confirma?
          </p>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" @click="arquivar">Confirmar →</button>
            <button class="btn btn-outline btn-sm" @click="confirmandoArquivar = false">Cancelar</button>
          </div>
        </div>

        <div class="hist-lista" style="margin-top:1rem;">
          <div v-for="g in historicoGestoes" :key="g.id" class="hist-item">
            <button class="hist-header" @click="toggleGestao(g.id)">
              <div class="hist-header-info">
                <span v-if="g.periodo" class="hist-periodo">{{ g.periodo }}</span>
                <span class="hist-chapa">{{ g.periodo ? '—' : '' }} {{ g.nomeChapa }}</span>
              </div>
              <button v-if="editando" class="icon-btn icon-btn--danger" title="Remover do histórico" @click.stop="removerGestaoHistorico(g.id)" v-html="xIcon"></button>
              <span class="hist-chevron" :class="{ aberto: expandido === g.id }">▾</span>
            </button>
            <div v-if="expandido === g.id" class="hist-body">
              <p v-if="g.descricao" class="hist-desc">{{ g.descricao }}</p>
              <div v-if="g.membros?.length" class="hist-membros">
                <div v-for="m in g.membros" :key="m.nome + m.diretoria" class="hist-membro">
                  <div class="hist-membro-avatar">
                    <img v-if="m.foto" :src="m.foto" :alt="m.nome" class="hist-membro-foto">
                    <span v-else class="hist-membro-inicial">{{ m.nome?.[0]?.toUpperCase() || '?' }}</span>
                  </div>
                  <div v-if="m.diretoria" class="label-sm" style="margin-bottom:2px;">{{ m.diretoria }}</div>
                  <div style="font-size:0.88rem;font-weight:600;color:var(--preto);">{{ m.nome }}</div>
                  <div v-if="m.periodo" style="font-size:0.76rem;color:var(--cinza);">{{ m.periodo }}</div>
                </div>
              </div>
            </div>
          </div>
          <p v-if="editando && !historicoGestoes.length" style="font-size:0.85rem;color:var(--cinza);">
            Nenhuma gestão arquivada ainda.
          </p>
        </div>
      </div>

      <!-- Seções customizadas -->
      <div v-for="(s, idx) in secoesCustom" :key="s.id" class="paper paper-mb-lg paper--meio">
        <template v-if="!editando || editandoSecaoId !== s.id">
          <div class="gestao-header">
            <h2 class="paper-title" style="margin-bottom:0;">{{ s.titulo }}</h2>
            <div v-if="editando" class="secao-admin-btns">
              <button class="icon-btn" title="Mover para cima" :disabled="idx === 0" @click="moverSecao(s.id, -1)">↑</button>
              <button class="icon-btn" title="Mover para baixo" :disabled="idx === secoesCustom.length - 1" @click="moverSecao(s.id, 1)">↓</button>
              <button class="icon-btn" title="Editar" @click="iniciarEdicaoSecao(s)" v-html="pencilIcon"></button>
              <button class="icon-btn icon-btn--danger" title="Remover" @click="confirmarRemocaoSecao(s.id, s.titulo)" v-html="xIcon"></button>
            </div>
          </div>
          <div class="sobre-missao-texto" v-html="descricaoHtml(s.conteudo)"></div>
        </template>

        <template v-else>
          <p class="secao-sep" style="margin-top:0;">Editar seção</p>
          <div class="field">
            <label>Título</label>
            <input v-model="editFormSecao.titulo" type="text" maxlength="80">
          </div>
          <div class="field">
            <label>Conteúdo <span class="field-hint">(Markdown)</span></label>
            <textarea v-model="editFormSecao.conteudo" rows="6"></textarea>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary btn-sm" @click="salvarEdicaoSecao">Salvar →</button>
            <button class="btn btn-outline btn-sm" @click="cancelarEdicaoSecao">Cancelar</button>
          </div>
        </template>
      </div>

      <!-- Adicionar seção customizada -->
      <div v-if="editando" class="paper paper-mb-lg paper--meio secao-add-box">
        <div v-if="!mostraFormSecao" style="text-align:center;">
          <button class="btn btn-outline btn-sm" @click="toggleFormSecao">+ Adicionar seção</button>
        </div>
        <template v-else>
          <p class="secao-sep" style="margin-top:0;">Nova seção</p>
          <div class="field">
            <label>Título</label>
            <input v-model="formSecao.titulo" type="text" maxlength="80" placeholder="Ex.: Parcerias">
          </div>
          <div class="field">
            <label>Conteúdo <span class="field-hint">(Markdown)</span></label>
            <textarea v-model="formSecao.conteudo" rows="6" placeholder="Escreva o conteúdo da seção…"></textarea>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" @click="cadastrarSecao">Adicionar seção →</button>
            <button class="btn btn-outline btn-sm" @click="toggleFormSecao">Cancelar</button>
          </div>
        </template>
      </div>

      <div class="paper paper--fim">
        <h2 class="paper-title">Onde nos encontrar</h2>
        <div class="sobre-contato-grid">
          <div v-if="!editando" class="contato-info-lista">
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="mapPinIcon"></span>
              <span class="contato-info-texto">{{ contatoInfo.endereco }}</span>
            </div>
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="mailIcon"></span>
              <span class="contato-info-texto">
                <a :href="`mailto:${contatoInfo.email}`" class="contato-info-link">{{ contatoInfo.email }}</a>
              </span>
            </div>
            <div class="contato-info-item">
              <span class="contato-info-icon" v-html="instagramIcon"></span>
              <span class="contato-info-texto">
                <a :href="`https://instagram.com/${contatoInfo.instagram}`" target="_blank" rel="noopener" class="contato-info-link">@{{ contatoInfo.instagram }}</a>
                no Instagram
              </span>
            </div>
            <RouterLink to="/mapa" class="sobre-mapa-link">Ver mapa completo do campus →</RouterLink>
          </div>
          <div v-else class="contato-edit-form">
            <div class="field">
              <label for="contato-endereco">Endereço</label>
              <input id="contato-endereco" v-model="contatoEdit.endereco" type="text" placeholder="Ex.: Sala do CAESI — Bloco CP, UFCG">
            </div>
            <div class="field">
              <label for="contato-email">E-mail</label>
              <input id="contato-email" v-model="contatoEdit.email" type="email" placeholder="caesi@ccc.ufcg.edu.br">
            </div>
            <div class="field">
              <label for="contato-instagram">Instagram <span class="field-hint">(sem @)</span></label>
              <input id="contato-instagram" v-model="contatoEdit.instagram" type="text" placeholder="caesiufcg">
            </div>
            <button class="btn btn-primary btn-sm" @click="salvarContato">Salvar contato →</button>
          </div>
          <div class="sobre-mapa-embed">
            <div ref="mapaMiniEl" class="sobre-mapa-leaflet"></div>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* ── Missão: texto + placeholder de imagem ────────────────── */
.sobre-missao-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.sobre-missao-texto { font-size: 0.95rem; color: var(--preto); line-height: 1.75; }
.sobre-missao-texto :deep(p) { margin: 0 0 1.2rem; }
.sobre-missao-texto :deep(p:last-child) { margin-bottom: 0; }
.sobre-missao-texto :deep(a) { color: var(--roxo-escuro); font-weight: 600; }
.sobre-missao-texto :deep(ul),
.sobre-missao-texto :deep(ol) { margin: 0 0 1.2rem; padding-left: 1.4rem; }

.sobre-img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 180px;
  background: rgba(80,64,160,0.04);
  border: 2px dashed var(--creme-escuro);
  border-radius: 2px;
  color: var(--cinza);
  text-align: center;
  padding: 1.2rem;
}
.sobre-img-placeholder :deep(svg) { width: 30px; height: 30px; stroke: currentColor; }
.sobre-img-placeholder p { font-size: 0.8rem; max-width: 200px; }

@media (max-width: 720px) {
  .sobre-missao-grid { grid-template-columns: 1fr; text-align: center; }
}

/* ── Equipe: carrossel de tamanho fixo ─────────────────────── */
.membro-carrossel-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.4rem;
}

.membro-carrossel {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-behavior: smooth;
  gap: 1rem;
  padding: 4px 4px 0.6rem;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  cursor: grab;
  flex: 1;
  min-width: 0;
}
.membro-carrossel::-webkit-scrollbar { display: none; }
.membro-carrossel--arrastando { cursor: grabbing; scroll-snap-type: none; user-select: none; }

.carrossel-nav-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px 8px;
  color: var(--cinza);
  font-family: 'Archivo', sans-serif;
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
}
.carrossel-nav-btn:hover { color: var(--roxo); }

.membro-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem 0.8rem 1rem;
  gap: 0.35rem;
  box-shadow: 2px 2px 0 var(--roxo-escuro);
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  flex: 0 0 190px;
  width: 190px;
  height: 210px;
  justify-content: center;
  scroll-snap-align: start;
  cursor: pointer;
}
.membro-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--roxo-escuro);
  border-color: var(--roxo);
}

.membro-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
}

.membro-modal-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
}
.membro-modal-avatar .membro-inicial { font-size: 2.4rem; }

.membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--creme);
  line-height: 1;
}

.membro-nome {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--preto);
  line-height: 1.3;
}

.membro-periodo {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  background: rgba(80,64,160,0.1);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.22);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.membro-email {
  font-size: 0.76rem;
  color: var(--cinza);
  margin-top: 4px;
  word-break: break-all;
}

.membro-desc {
  font-size: 0.78rem;
  color: var(--preto);
  opacity: 0.65;
  line-height: 1.5;
  margin-top: 6px;
  text-align: center;
}
.membro-desc :deep(p) { margin: 0 0 6px; }
.membro-desc :deep(p:last-child) { margin-bottom: 0; }

.membro-links {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.membro-link {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1.5px solid var(--roxo);
  color: var(--roxo-escuro);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}
.membro-link:hover { background: var(--roxo); color: var(--creme); }

.gestao-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.chapa-nome {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--roxo);
  margin-top: 4px;
}

.chapa-periodo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cinza);
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
}

.gestao-desc {
  margin-top: 1.2rem;
  padding-bottom: 1.4rem;
  border-bottom: 1.5px solid var(--creme-escuro);
}

.gestao-texto {
  font-size: 0.95rem;
  color: var(--preto);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
}

/* Gestões anteriores */
.hist-lista { display: flex; flex-direction: column; gap: 0.5rem; }

.hist-item {
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  overflow: hidden;
}

.hist-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px 16px;
  background: var(--branco);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.hist-header:hover { background: rgba(80,64,160,0.04); }

.hist-header-info { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.hist-chapa { font-size: 0.92rem; font-weight: 700; color: var(--roxo-escuro); }
.hist-periodo { font-size: 0.78rem; color: var(--cinza); }

.hist-chevron {
  font-size: 1.1rem;
  color: var(--cinza);
  flex-shrink: 0;
  transition: transform 0.2s;
  line-height: 1;
}
.hist-chevron.aberto { transform: rotate(180deg); }

.hist-body {
  padding: 1rem 1.2rem 1.2rem;
  border-top: 1.5px solid var(--creme-escuro);
  background: var(--creme);
}

.hist-desc {
  font-size: 0.88rem;
  color: var(--preto);
  line-height: 1.75;
  margin: 0 0 1rem;
  white-space: pre-line;
}

.hist-membros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
}

.hist-membro {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.hist-membro-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.hist-membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hist-membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  color: var(--creme);
  line-height: 1;
}

.equipe-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--roxo-escuro);
  margin: 1.2rem 0 0.8rem;
}

/* ── Contato: informações + mapa embed ────────────────────── */
.sobre-contato-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.contato-info-lista {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.contato-info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contato-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  margin-top: 2px;
  border-radius: 2px;
  background: rgba(80,64,160,0.08);
  color: var(--roxo-escuro);
}
.contato-info-icon :deep(svg) { width: 17px; height: 17px; }

.contato-info-texto {
  font-size: 0.92rem;
  color: var(--preto);
  line-height: 1.5;
  padding-top: 6px;
}

.contato-info-link {
  color: var(--roxo-escuro);
  font-weight: 700;
  text-decoration: none;
}
.contato-info-link:hover { text-decoration: underline; }

.contato-info-lista .sobre-mapa-link {
  margin-top: 0.4rem;
  padding-top: 1rem;
  border-top: 1.5px solid var(--creme-escuro);
}

.sobre-mapa-embed {
  min-height: 200px;
  border-radius: 2px;
  overflow: hidden;
  border: 1.5px solid var(--creme-escuro);
}

.sobre-mapa-leaflet {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.sobre-mapa-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--roxo-escuro);
  text-decoration: none;
  margin-top: 0.3rem;
}
.sobre-mapa-link:hover { text-decoration: underline; }

@media (max-width: 720px) {
  .sobre-contato-grid { grid-template-columns: 1fr; }
  .sobre-mapa-embed { min-height: 240px; }
}

@media (max-width: 640px) {
  .carrossel-nav-btn { display: none; }
}

/* ── Modo de edição (admin) ────────────────────────────────── */
.sobre-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.sobre-topo :deep(.back-link) { margin-bottom: 0; }

.equipe-titulo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.2rem 0 0.8rem;
}
.equipe-titulo-row .equipe-titulo { margin: 0; }

.membro-card { position: relative; }

.membro-admin-btns {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.contato-edit-form { text-align: left; }

.add-form-box { border-left: 4px solid var(--roxo); }

.admin-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 1.2rem;
}
@media (max-width: 680px) {
  .admin-form-grid { grid-template-columns: 1fr; }
}

.icon-btn {
  background: none;
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 5px;
  cursor: pointer;
  color: var(--cinza);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, color 0.15s;
}
.icon-btn :deep(svg) { width: 15px; height: 15px; stroke: currentColor; }
.icon-btn:hover { border-color: var(--roxo); color: var(--roxo-escuro); }
.icon-btn--danger:hover { border-color: var(--vermelho); color: var(--vermelho); }

.avatar-sm {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--creme-escuro);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initial {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.3rem;
  color: var(--creme);
  line-height: 1;
}

.foto-row { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }

.btn-foto {
  font-size: 0.78rem;
  font-weight: 600;
  font-family: 'Archivo Black', sans-serif;
  padding: 5px 12px;
  border: 1.5px solid var(--roxo);
  border-radius: 2px;
  color: var(--roxo);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-foto:hover { background: var(--roxo); color: var(--creme); }

.btn-remover-foto {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 10px;
  border: 1.5px solid var(--cinza);
  border-radius: 2px;
  color: var(--cinza);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-remover-foto:hover { border-color: var(--vermelho); color: var(--vermelho); }

.char-count {
  font-size: 0.75rem;
  color: var(--cinza);
  text-align: right;
  margin-top: 4px;
}

.periodo-grid { display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.4rem; }
.periodo-group { display: flex; flex-direction: column; gap: 0.3rem; }
.periodo-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cinza); font-family: 'Archivo Black', sans-serif; }
.periodo-selects { display: flex; gap: 0.4rem; }
.select-mes { border: 1.5px solid var(--creme-escuro); border-radius: 2px; background: var(--branco); color: var(--preto); font-size: 0.88rem; padding: 7px 8px; cursor: pointer; appearance: auto; width: 72px; }
.select-mes:focus { outline: none; border-color: var(--roxo); }
.input-ano { width: 72px; border: 1.5px solid var(--creme-escuro); border-radius: 2px; background: var(--branco); color: var(--preto); font-size: 0.88rem; padding: 7px 8px; }
.input-ano:focus { outline: none; border-color: var(--roxo); }
.input-ano::-webkit-inner-spin-button, .input-ano::-webkit-outer-spin-button { opacity: 0; }
.periodo-sep { font-size: 1.1rem; color: var(--cinza); padding-bottom: 8px; flex-shrink: 0; }

.secao-sep {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cinza);
  border-top: 1.5px solid var(--creme-escuro);
  padding-top: 1.2rem;
  margin-bottom: 1.2rem;
}

.hist-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.hist-cabecalho-acoes {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .hist-cabecalho-acoes { width: 100%; flex-shrink: 1; }
}

.hist-toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--cinza);
  cursor: pointer;
  user-select: none;
}
.hist-toggle-label input { accent-color: var(--roxo); cursor: pointer; }

.hist-confirm {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1rem 1.2rem;
  margin-top: 1rem;
}

.hist-form {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem;
  margin-top: 1rem;
}

.hist-membros-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hist-membro-row {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 1fr auto;
  gap: 6px;
  align-items: center;
}

.hist-avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid var(--creme-escuro);
  transition: opacity 0.15s;
}
.hist-avatar-btn:hover { opacity: 0.8; }

.hist-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.hist-avatar-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.85rem;
  color: var(--creme);
  line-height: 1;
}

@media (max-width: 640px) {
  .hist-membro-row {
    grid-template-columns: 36px 1fr auto;
    grid-template-rows: auto auto;
  }
  .hist-membro-row input:nth-child(3),
  .hist-membro-row input:nth-child(4) {
    grid-column: 2;
  }
}

/* ── Seções customizadas ───────────────────────────────────── */
.secao-admin-btns {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.secao-admin-btns .icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.secao-admin-btns .icon-btn:disabled:hover {
  border-color: var(--creme-escuro);
  color: var(--cinza);
}

.secao-add-box {
  border: 2px dashed var(--creme-escuro);
  box-shadow: none;
}
</style>

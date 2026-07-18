<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { isAdmin } from '../stores/auth.ts'
import { estruturas, CENTRO_PADRAO, addEstrutura, updateEstrutura, removeEstrutura, type Estrutura } from '../stores/mapa.ts'
import { useEscapeKey } from '../composables/useEscapeKey.ts'
import { showToast } from '../stores/toast.ts'
import { isValidImageFile } from '../utils/validation.ts'
import { comprimirImagem } from '../utils/imagem.ts'
import crosshairIcon from '../assets/icons/crosshair.svg?raw'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

interface EstruturaFormRascunho {
  nome: string
  descricao: string
  imagens: string[]
}

interface PendingPoint {
  lat: number
  lng: number
}

const route = useRoute()
const mapaEl = ref<HTMLElement | null>(null)
let mapa: L.Map | null = null
const mapaMarkers = new Map<number, L.Marker>()

const buscaMapa = ref('')

// ── Público: modal de visualização (não-admin) ───────────
const estruturaModal = ref<Estrutura | null>(null)
const imagemAtivaIdx = ref(0)

// ── Admin: painel lateral de edição (substitui modal) ────
const selecionadoId = ref<number | null>(null) // id da estrutura em edição no painel lateral
const pendingPoint  = ref<PendingPoint | null>(null) // ponto vazio clicado, aguardando "Nova estrutura"
const estruturaEditForm = ref<EstruturaFormRascunho>({ nome: '', descricao: '', imagens: [] })
const novaEstruturaForm = ref<EstruturaFormRascunho>({ nome: '', descricao: '', imagens: [] })
const fileNovaRef = ref<HTMLInputElement | null>(null)
const fileEditRef = ref<HTMLInputElement | null>(null)

const estruturaSelecionada = computed(() => estruturas.value.find(e => e.id === selecionadoId.value) ?? null)

async function onImagensNova(e: Event) {
  let invalido = false
  const files = (e.target as HTMLInputElement).files
  for (const file of files ?? []) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    novaEstruturaForm.value.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  ;(e.target as HTMLInputElement).value = ''
}
function removerImagemNova(i: number) { novaEstruturaForm.value.imagens.splice(i, 1) }

async function onImagensEdit(e: Event) {
  let invalido = false
  const files = (e.target as HTMLInputElement).files
  for (const file of files ?? []) {
    if (!isValidImageFile(file)) { invalido = true; continue }
    estruturaEditForm.value.imagens.push(await comprimirImagem(file))
  }
  if (invalido) showToast('Alguns arquivos foram ignorados (precisam ser imagens de até 8MB).', 'error')
  ;(e.target as HTMLInputElement).value = ''
}
function removerImagemEdit(i: number) { estruturaEditForm.value.imagens.splice(i, 1) }

const resultadosBusca = computed(() => {
  const t = buscaMapa.value.toLowerCase().trim()
  if (!t) return []
  return estruturas.value.filter(e => e.nome.toLowerCase().includes(t))
})

function rotaUrl(e: Estrutura) {
  return `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
}

function arredonda(n: number) { return Math.round(n * 1e6) / 1e6 }

function abrirEstrutura(e: Estrutura) {
  if (isAdmin.value) {
    pendingPoint.value = null
    selecionadoId.value = e.id
    estruturaEditForm.value = {
      nome: e.nome,
      descricao: e.descricao ?? '',
      imagens: [...(e.imagens ?? [])],
    }
  } else {
    estruturaModal.value = e
    imagemAtivaIdx.value = 0
  }
  if (mapa) mapa.flyTo([e.lat, e.lng], 18, { duration: 0.6 })
}

function fecharModal() { estruturaModal.value = null }

// ── Admin: painel lateral — editar/excluir estrutura ─────
function cancelarSelecao() {
  selecionadoId.value = null
  pendingPoint.value = null
}

function salvarEdicaoEstrutura() {
  if (!selecionadoId.value) return
  if (!estruturaEditForm.value.nome.trim()) { showToast('Informe o nome da estrutura.', 'error'); return }
  updateEstrutura(selecionadoId.value, {
    nome: estruturaEditForm.value.nome.trim(),
    descricao: estruturaEditForm.value.descricao.trim(),
    imagens: [...estruturaEditForm.value.imagens],
  })
  showToast('Estrutura atualizada.', 'success')
}

function excluirEstrutura() {
  if (!estruturaSelecionada.value) return
  if (!confirm(`Remover "${estruturaSelecionada.value.nome}" do mapa?`)) return
  removeEstrutura(selecionadoId.value!)
  showToast('Estrutura removida.', 'info')
  cancelarSelecao()
}

// ── Admin: painel lateral — criar estrutura clicando num ponto vazio ──
function salvarNovaEstrutura() {
  if (!pendingPoint.value) return
  if (!novaEstruturaForm.value.nome.trim()) { showToast('Informe o nome da estrutura.', 'error'); return }
  const nova = addEstrutura({
    nome: novaEstruturaForm.value.nome.trim(),
    descricao: novaEstruturaForm.value.descricao.trim(),
    lat: pendingPoint.value.lat,
    lng: pendingPoint.value.lng,
    imagens: [...novaEstruturaForm.value.imagens],
  })
  showToast('Estrutura adicionada ao mapa.', 'success')
  pendingPoint.value = null
  // Segue direto pro modo de edição da estrutura recém-criada.
  if (nova?.id) abrirEstrutura(nova)
}

function renderMapaMarkers() {
  if (!mapa) return
  mapaMarkers.forEach(m => m.remove())
  mapaMarkers.clear()
  for (const e of estruturas.value) {
    const marker = L.marker([e.lat, e.lng], { draggable: isAdmin.value }).addTo(mapa)
    marker.on('click', () => abrirEstrutura(e))
    if (isAdmin.value) {
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng()
        updateEstrutura(e.id, { lat: arredonda(lat), lng: arredonda(lng) })
        showToast('Posição atualizada.', 'success')
      })
    }
    mapaMarkers.set(e.id, marker)
  }
}

onMounted(() => {
  if (!mapaEl.value) return
  mapa = L.map(mapaEl.value, {
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 180,
  }).setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 17)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapa)
  renderMapaMarkers()

  if (isAdmin.value) {
    mapa.on('click', (ev: L.LeafletMouseEvent) => {
      selecionadoId.value = null
      novaEstruturaForm.value = { nome: '', descricao: '', imagens: [] }
      pendingPoint.value = { lat: arredonda(ev.latlng.lat), lng: arredonda(ev.latlng.lng) }
    })
  }

  // Vindo de um link "Ver localização" (Professores/Laboratórios): abre a modal direto.
  const estruturaId = Number(route.query.estrutura)
  if (estruturaId) {
    const alvo = estruturas.value.find(e => e.id === estruturaId)
    if (alvo) abrirEstrutura(alvo)
  }
})

function recentralizar() {
  mapa?.setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 17)
}

watch(estruturas, () => renderMapaMarkers())

onBeforeUnmount(() => { mapa?.remove() })

// ── Modal público: fechar com Esc e travar o scroll enquanto estiver aberto ──
useEscapeKey(() => { fecharModal(); cancelarSelecao() })

const algumModalAberto = computed(() => !!estruturaModal.value)
watch(algumModalAberto, (aberto) => {
  document.body.style.overflow = aberto ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <section class="home-section" id="mapa" style="scroll-margin-top:80px;">
    <div class="section-label">Onde fica</div>
    <h2 class="section-title">Mapa do <span>campus</span></h2>

    <div class="mapa-layout">
      <div class="paper" style="padding:1.2rem;">
        <input
          v-model="buscaMapa" type="search" class="mapa-home-search"
          placeholder="Buscar estrutura… (ex.: Bloco CP, auditório)"
        >
        <div v-if="resultadosBusca.length > 0" class="mapa-home-resultados">
          <button
            v-for="e in resultadosBusca" :key="e.id"
            class="mapa-home-resultado-item"
            @click="abrirEstrutura(e); buscaMapa = ''"
          >{{ e.nome }}</button>
        </div>
        <div v-else-if="buscaMapa.trim()" class="mapa-home-resultados">
          <span class="mapa-home-sem-resultado">Nenhuma estrutura encontrada.</span>
        </div>

        <div class="mapa-home-leaflet-wrap">
          <div ref="mapaEl" class="mapa-home-leaflet" :class="{ 'mapa-home-leaflet--admin': isAdmin }"></div>
          <button type="button" class="mapa-recentralizar" title="Recentralizar na UFCG" aria-label="Recentralizar na UFCG" @click="recentralizar">
            <span v-html="crosshairIcon"></span>
          </button>
        </div>
        <p style="font-size:0.78rem;color:var(--cinza);margin-top:0.8rem;">
          <template v-if="isAdmin">Clique num ponto vazio pra adicionar uma estrutura — o formulário aparece ao lado. Clique num pin pra editar. Arraste um pin pra reposicionar.</template>
          <template v-else>Clique num ponto do mapa pra ver os detalhes da estrutura.</template>
        </p>
      </div>

      <div class="paper mapa-lista-paper">
        <!-- Admin: form de nova estrutura (clicou num ponto vazio) -->
        <template v-if="isAdmin && pendingPoint">
          <p class="label-sm" style="margin-bottom:0.9rem;">Nova estrutura</p>
          <div class="field">
            <label>Nome *</label>
            <input v-model="novaEstruturaForm.nome" type="text" maxlength="80" placeholder="Ex.: Bloco CP">
          </div>
          <div class="field">
            <label>Descrição <span class="field-hint">(opcional)</span></label>
            <textarea v-model="novaEstruturaForm.descricao" rows="3" placeholder="O que tem aqui…"></textarea>
          </div>
          <div class="field">
            <label>Imagens <span class="field-hint">(opcional)</span></label>
            <button type="button" class="btn-foto" @click="fileNovaRef?.click()">+ Adicionar imagens</button>
            <input ref="fileNovaRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensNova">
            <div v-if="novaEstruturaForm.imagens.length > 0" class="imagens-preview">
              <div v-for="(img, i) in novaEstruturaForm.imagens" :key="i" class="img-thumb-wrap">
                <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                <button type="button" class="img-thumb-remove" @click="removerImagemNova(i)">×</button>
              </div>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary btn-sm" @click="salvarNovaEstrutura">Salvar →</button>
            <button class="btn btn-outline btn-sm" @click="cancelarSelecao">Cancelar</button>
          </div>
        </template>

        <!-- Admin: form de edição da estrutura selecionada -->
        <template v-else-if="isAdmin && estruturaSelecionada">
          <p class="label-sm" style="margin-bottom:0.9rem;">Editar estrutura</p>
          <div class="field">
            <label>Nome *</label>
            <input v-model="estruturaEditForm.nome" type="text" maxlength="80">
          </div>
          <div class="field">
            <label>Descrição</label>
            <textarea v-model="estruturaEditForm.descricao" rows="3"></textarea>
          </div>
          <div class="field">
            <label>Imagens <span class="field-hint">(opcional)</span></label>
            <button type="button" class="btn-foto" @click="fileEditRef?.click()">+ Adicionar imagens</button>
            <input ref="fileEditRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensEdit">
            <div v-if="estruturaEditForm.imagens.length > 0" class="imagens-preview">
              <div v-for="(img, i) in estruturaEditForm.imagens" :key="i" class="img-thumb-wrap">
                <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                <button type="button" class="img-thumb-remove" @click="removerImagemEdit(i)">×</button>
              </div>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary btn-sm" @click="salvarEdicaoEstrutura">Salvar →</button>
            <button class="btn btn-outline btn-sm" @click="cancelarSelecao">Fechar</button>
            <button class="btn btn-danger btn-sm" @click="excluirEstrutura">Excluir</button>
          </div>
        </template>

        <!-- Lista de estruturas -->
        <template v-else>
          <p class="label-sm" style="margin-bottom:0.6rem;">Estruturas ({{ estruturas.length }})</p>
          <div class="mapa-lista">
            <button
              v-for="e in estruturas" :key="e.id"
              class="mapa-item"
              :class="{ 'mapa-item--ativo': (isAdmin ? selecionadoId : estruturaModal?.id) === e.id }"
              @click="abrirEstrutura(e)"
            >
              <span class="mapa-item-icon" v-html="mapPinIcon"></span>
              <span class="mapa-item-nome">{{ e.nome }}</span>
            </button>
          </div>
          <div v-if="estruturas.length === 0" class="empty-state" style="padding:1.6rem 1rem;">
            <p>Nenhuma estrutura cadastrada ainda.</p>
            <span v-if="isAdmin">Clique no mapa para adicionar a estrutura.</span>
          </div>
        </template>
      </div>
    </div>
  </section>

  <!-- Modal: detalhe da estrutura (público — admin edita no painel lateral) -->
  <Teleport to="body">
    <div v-if="estruturaModal" class="modal-overlay" @click.self="fecharModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-estrutura-title" v-focus-trap>
        <div class="modal-title" id="modal-estrutura-title">{{ estruturaModal.nome }}</div>
        <div class="modal-body">
          <div v-if="estruturaModal.imagens?.length" class="mapa-modal-galeria">
            <img :src="estruturaModal.imagens[imagemAtivaIdx]" :alt="estruturaModal.nome" class="mapa-modal-hero">
            <div v-if="estruturaModal.imagens.length > 1" class="mapa-modal-thumbs">
              <button
                v-for="(img, i) in estruturaModal.imagens" :key="i"
                class="mapa-modal-thumb-btn"
                :class="{ 'mapa-modal-thumb-btn--ativo': i === imagemAtivaIdx }"
                @click="imagemAtivaIdx = i"
              >
                <img :src="img" :alt="`Imagem ${i + 1}`" class="mapa-modal-thumb-img">
              </button>
            </div>
          </div>
          <p v-if="estruturaModal.descricao">{{ estruturaModal.descricao }}</p>
          <p v-else style="color:var(--cinza);font-style:italic;">Sem descrição cadastrada.</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="fecharModal">Fechar</button>
          <a :href="rotaUrl(estruturaModal)" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
            Ver rota →
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  width: 74px;
  height: 50px;
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
</style>

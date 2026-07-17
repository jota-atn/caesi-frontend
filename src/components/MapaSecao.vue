<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { isAdmin } from '../stores/auth.js'
import { estruturas, CENTRO_PADRAO, addEstrutura, updateEstrutura, removeEstrutura } from '../stores/mapa.js'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import { showToast } from '../stores/toast.js'
import crosshairIcon from '../assets/icons/crosshair.svg?raw'
import mapPinIcon from '../assets/icons/map-pin.svg?raw'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const route = useRoute()
const mapaEl = ref(null)
let mapa = null
const mapaMarkers = new Map()

const buscaMapa = ref('')
const estruturaModal = ref(null)
const imagemAtivaIdx = ref(0)
const estruturaModoEdicao = ref(false)
const estruturaEditForm = ref({ nome: '', descricao: '' })
const novaEstruturaModal = ref(null) // { lat, lng } quando admin está criando
const novaEstruturaForm = ref({ nome: '', descricao: '' })

const resultadosBusca = computed(() => {
  const t = buscaMapa.value.toLowerCase().trim()
  if (!t) return []
  return estruturas.value.filter(e => e.nome.toLowerCase().includes(t))
})

function rotaUrl(e) {
  return `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`
}

function arredonda(n) { return Math.round(n * 1e6) / 1e6 }

function abrirEstrutura(e) {
  estruturaModal.value = e
  imagemAtivaIdx.value = 0
  estruturaModoEdicao.value = false
  if (mapa) mapa.flyTo([e.lat, e.lng], 18, { duration: 0.6 })
}

function fecharModal() { estruturaModal.value = null; estruturaModoEdicao.value = false }

// ── Admin: editar/excluir estrutura ──────────────────────
function iniciarEdicaoEstrutura() {
  estruturaEditForm.value = { nome: estruturaModal.value.nome, descricao: estruturaModal.value.descricao ?? '' }
  estruturaModoEdicao.value = true
}
function cancelarEdicaoEstrutura() { estruturaModoEdicao.value = false }

function salvarEdicaoEstrutura() {
  if (!estruturaEditForm.value.nome.trim()) { showToast('Informe o nome da estrutura.', 'error'); return }
  updateEstrutura(estruturaModal.value.id, {
    nome: estruturaEditForm.value.nome.trim(),
    descricao: estruturaEditForm.value.descricao.trim(),
  })
  estruturaModal.value = { ...estruturaModal.value, nome: estruturaEditForm.value.nome.trim(), descricao: estruturaEditForm.value.descricao.trim() }
  estruturaModoEdicao.value = false
  showToast('Estrutura atualizada.', 'success')
}

function excluirEstrutura() {
  if (!confirm(`Remover "${estruturaModal.value.nome}" do mapa?`)) return
  removeEstrutura(estruturaModal.value.id)
  showToast('Estrutura removida.', 'info')
  fecharModal()
}

// ── Admin: criar estrutura clicando num ponto vazio ──────
function fecharNovaEstruturaModal() { novaEstruturaModal.value = null }

function salvarNovaEstrutura() {
  if (!novaEstruturaModal.value) return
  if (!novaEstruturaForm.value.nome.trim()) { showToast('Informe o nome da estrutura.', 'error'); return }
  addEstrutura({
    nome: novaEstruturaForm.value.nome.trim(),
    descricao: novaEstruturaForm.value.descricao.trim(),
    lat: novaEstruturaModal.value.lat,
    lng: novaEstruturaModal.value.lng,
  })
  showToast('Estrutura adicionada ao mapa.', 'success')
  novaEstruturaModal.value = null
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
    mapa.on('click', (ev) => {
      novaEstruturaForm.value = { nome: '', descricao: '' }
      novaEstruturaModal.value = { lat: arredonda(ev.latlng.lat), lng: arredonda(ev.latlng.lng) }
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

// ── Modais: fechar com Esc e travar o scroll enquanto algum estiver aberto ──
useEscapeKey(() => { fecharModal(); fecharNovaEstruturaModal() })

const algumModalAberto = computed(() => !!estruturaModal.value || !!novaEstruturaModal.value)
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
          <template v-if="isAdmin">Clique num ponto vazio pra adicionar uma estrutura, ou num pin pra ver/editar. Arraste um pin pra reposicionar.</template>
          <template v-else>Clique num ponto do mapa pra ver os detalhes da estrutura.</template>
        </p>
      </div>

      <div class="paper mapa-lista-paper">
        <p class="label-sm" style="margin-bottom:0.6rem;">Estruturas ({{ estruturas.length }})</p>
        <div class="mapa-lista">
          <button
            v-for="e in estruturas" :key="e.id"
            class="mapa-item"
            :class="{ 'mapa-item--ativo': estruturaModal?.id === e.id }"
            @click="abrirEstrutura(e)"
          >
            <span class="mapa-item-icon" v-html="mapPinIcon"></span>
            <span class="mapa-item-nome">{{ e.nome }}</span>
          </button>
        </div>
        <div v-if="estruturas.length === 0" class="empty-state" style="padding:1.6rem 1rem;">
          <p>Nenhuma estrutura cadastrada ainda.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Modal: detalhe/edição da estrutura -->
  <Teleport to="body">
    <div v-if="estruturaModal" class="modal-overlay" @click.self="fecharModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-estrutura-title" v-focus-trap>
        <template v-if="!estruturaModoEdicao">
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
            <template v-if="isAdmin">
              <button class="btn btn-outline btn-sm" @click="iniciarEdicaoEstrutura">Editar</button>
              <button class="btn btn-danger btn-sm" @click="excluirEstrutura">Excluir</button>
            </template>
            <a :href="rotaUrl(estruturaModal)" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
              Ver rota →
            </a>
          </div>
        </template>

        <template v-else>
          <div class="modal-title">Editar estrutura</div>
          <div class="modal-body">
            <div class="field">
              <label>Nome *</label>
              <input v-model="estruturaEditForm.nome" type="text" maxlength="80">
            </div>
            <div class="field">
              <label>Descrição</label>
              <textarea v-model="estruturaEditForm.descricao" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="cancelarEdicaoEstrutura">Cancelar</button>
            <button class="btn btn-primary btn-sm" @click="salvarEdicaoEstrutura">Salvar →</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <!-- Modal: nova estrutura (admin) -->
  <Teleport to="body">
    <div v-if="novaEstruturaModal" class="modal-overlay" @click.self="fecharNovaEstruturaModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-nova-estrutura-title" v-focus-trap>
        <div class="modal-title" id="modal-nova-estrutura-title">Nova estrutura</div>
        <div class="modal-body">
          <div class="field">
            <label>Nome *</label>
            <input v-model="novaEstruturaForm.nome" type="text" maxlength="80" placeholder="Ex.: Bloco CP">
          </div>
          <div class="field">
            <label>Descrição <span class="field-hint">(opcional)</span></label>
            <textarea v-model="novaEstruturaForm.descricao" rows="3" placeholder="O que tem aqui…"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="fecharNovaEstruturaModal">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="salvarNovaEstrutura">Salvar →</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

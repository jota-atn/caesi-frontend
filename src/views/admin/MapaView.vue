<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { estruturas, addEstrutura, updateEstrutura, removeEstrutura, CENTRO_PADRAO } from '../../stores/mapa.js'
import { showToast } from '../../stores/toast.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const mapEl = ref(null)
let map = null
const markers = new Map()

const selecionadoId = ref(null)
const pendingPoint   = ref(null) // { lat, lng } de um clique em área vazia

const formNovo = ref({ nome: '', descricao: '', imagens: [] })
const formEdit = ref({ nome: '', descricao: '', imagens: [] })
const fileNovoRef = ref(null)
const fileEditRef = ref(null)

const selecionado = computed(() => estruturas.value.find(e => e.id === selecionadoId.value) ?? null)

function arredonda(n) { return Math.round(n * 1e6) / 1e6 }

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

async function onImagensNovo(e) {
  for (const file of e.target.files) {
    formNovo.value.imagens.push(await comprimirImagem(file))
  }
  e.target.value = ''
}
function removerImagemNovo(i) { formNovo.value.imagens.splice(i, 1) }

async function onImagensEdit(e) {
  for (const file of e.target.files) {
    formEdit.value.imagens.push(await comprimirImagem(file))
  }
  e.target.value = ''
}
function removerImagemEdit(i) { formEdit.value.imagens.splice(i, 1) }

function selecionarMarcador(e) {
  pendingPoint.value = null
  selecionadoId.value = e.id
  formEdit.value = { nome: e.nome, descricao: e.descricao ?? '', imagens: [...(e.imagens ?? [])] }
}

function selecionarNaLista(id) {
  const e = estruturas.value.find(x => x.id === id)
  if (e) {
    selecionarMarcador(e)
    map?.flyTo([e.lat, e.lng], 18, { duration: 0.6 })
    markers.get(id)?.openPopup()
  }
}

function cancelarSelecao() {
  selecionadoId.value = null
  pendingPoint.value = null
}

function salvarNova() {
  if (!formNovo.value.nome.trim() || !pendingPoint.value) return
  addEstrutura({
    nome: formNovo.value.nome.trim(),
    descricao: formNovo.value.descricao.trim(),
    lat: pendingPoint.value.lat,
    lng: pendingPoint.value.lng,
    imagens: [...formNovo.value.imagens],
  })
  formNovo.value = { nome: '', descricao: '', imagens: [] }
  pendingPoint.value = null
  showToast('Estrutura adicionada ao mapa.', 'success')
}

function salvarEdicao() {
  if (!selecionado.value || !formEdit.value.nome.trim()) return
  updateEstrutura(selecionado.value.id, {
    nome: formEdit.value.nome.trim(),
    descricao: formEdit.value.descricao.trim(),
    imagens: [...formEdit.value.imagens],
  })
  showToast('Estrutura atualizada.', 'success')
}

function excluir() {
  if (!selecionado.value) return
  if (confirm(`Remover "${selecionado.value.nome}" do mapa?`)) {
    removeEstrutura(selecionado.value.id)
    cancelarSelecao()
    showToast('Estrutura removida.', 'info')
  }
}

function renderMarkers() {
  if (!map) return
  markers.forEach(m => m.remove())
  markers.clear()
  for (const e of estruturas.value) {
    const marker = L.marker([e.lat, e.lng], { draggable: true }).addTo(map)
    marker.bindPopup(`<strong>${e.nome}</strong>`)
    marker.on('click', () => selecionarMarcador(e))
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng()
      updateEstrutura(e.id, { lat: arredonda(lat), lng: arredonda(lng) })
      showToast('Posição atualizada.', 'success')
    })
    markers.set(e.id, marker)
  }
}

onMounted(() => {
  map = L.map(mapEl.value, {
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    wheelPxPerZoomLevel: 180,
  }).setView([CENTRO_PADRAO.lat, CENTRO_PADRAO.lng], 17)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  renderMarkers()

  map.on('click', (ev) => {
    selecionadoId.value = null
    pendingPoint.value = { lat: arredonda(ev.latlng.lat), lng: arredonda(ev.latlng.lng) }
    formNovo.value = { nome: '', descricao: '', imagens: [] }
  })
})

watch(estruturas, () => renderMarkers())

onBeforeUnmount(() => { map?.remove() })
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/painel" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Gestão do <span>Mapa</span></h2>
      </div>

      <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:1rem;line-height:1.6;">
        Clique num ponto vazio do mapa pra adicionar uma estrutura. Arraste um pin existente pra reposicionar.
      </p>

      <div class="mapa-layout">
        <div class="paper mapa-map-paper">
          <div ref="mapEl" class="mapa-leaflet"></div>
        </div>

        <div class="paper mapa-painel">
          <!-- Nova estrutura -->
          <div v-if="pendingPoint" class="mapa-form">
            <p class="label-sm" style="margin-bottom:0.8rem;">Nova estrutura</p>
            <div class="field">
              <label>Nome *</label>
              <input v-model="formNovo.nome" type="text" maxlength="80" placeholder="Ex.: Bloco CP">
            </div>
            <div class="field">
              <label>Descrição <span class="field-hint">(opcional)</span></label>
              <textarea v-model="formNovo.descricao" rows="3" placeholder="O que tem aqui…"></textarea>
            </div>
            <div class="field">
              <label>Imagens <span class="field-hint">(opcional)</span></label>
              <button type="button" class="btn-foto" @click="fileNovoRef.click()">+ Adicionar imagens</button>
              <input ref="fileNovoRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensNovo">
              <div v-if="formNovo.imagens.length > 0" class="imagens-preview">
                <div v-for="(img, i) in formNovo.imagens" :key="i" class="img-thumb-wrap">
                  <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                  <button type="button" class="img-thumb-remove" @click="removerImagemNovo(i)">×</button>
                </div>
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary btn-sm" @click="salvarNova">Salvar →</button>
              <button class="btn btn-outline btn-sm" @click="cancelarSelecao">Cancelar</button>
            </div>
          </div>

          <!-- Editar estrutura selecionada -->
          <div v-else-if="selecionado" class="mapa-form">
            <p class="label-sm" style="margin-bottom:0.8rem;">Editar estrutura</p>
            <div class="field">
              <label>Nome *</label>
              <input v-model="formEdit.nome" type="text" maxlength="80">
            </div>
            <div class="field">
              <label>Descrição</label>
              <textarea v-model="formEdit.descricao" rows="3"></textarea>
            </div>
            <div class="field">
              <label>Imagens <span class="field-hint">(opcional)</span></label>
              <button type="button" class="btn-foto" @click="fileEditRef.click()">+ Adicionar imagens</button>
              <input ref="fileEditRef" type="file" accept="image/*" multiple style="display:none" @change="onImagensEdit">
              <div v-if="formEdit.imagens.length > 0" class="imagens-preview">
                <div v-for="(img, i) in formEdit.imagens" :key="i" class="img-thumb-wrap">
                  <img :src="img" class="img-thumb" :alt="`Imagem ${i+1}`">
                  <button type="button" class="img-thumb-remove" @click="removerImagemEdit(i)">×</button>
                </div>
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-primary btn-sm" @click="salvarEdicao">Salvar →</button>
              <button class="btn btn-outline btn-sm" @click="cancelarSelecao">Fechar</button>
              <button class="btn btn-danger btn-sm" @click="excluir">Excluir</button>
            </div>
          </div>

          <div v-else class="empty-state" style="padding:1.6rem 1rem;">
            <p>Nenhuma estrutura selecionada.</p>
            <span>Clique no mapa pra adicionar, ou num pin pra editar.</span>
          </div>

          <hr class="divider" style="margin:1.2rem 0;">

          <p class="label-sm" style="margin-bottom:0.6rem;">Estruturas ({{ estruturas.length }})</p>
          <div class="mapa-lista">
            <button
              v-for="e in estruturas" :key="e.id"
              class="mapa-item"
              :class="{ 'mapa-item--ativo': e.id === selecionadoId }"
              @click="selecionarNaLista(e.id)"
            >{{ e.nome }}</button>
          </div>
          <div v-if="estruturas.length === 0" style="font-size:0.82rem;color:var(--cinza);">
            Nenhuma estrutura cadastrada ainda.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mapa-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.2rem;
  align-items: start;
}
@media (max-width: 860px) {
  .mapa-layout { grid-template-columns: 1fr; }
}

.mapa-map-paper { padding: 0; overflow: hidden; }
.mapa-leaflet { width: 100%; height: 560px; cursor: crosshair; }

.mapa-form .field:last-of-type { margin-bottom: 0.8rem; }

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

.mapa-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
}

.mapa-item {
  text-align: left;
  padding: 8px 10px;
  border: 1.5px solid transparent;
  border-radius: 2px;
  background: none;
  cursor: pointer;
  font-family: 'Archivo', sans-serif;
  font-size: 0.88rem;
  color: var(--preto);
  transition: background 0.15s, border-color 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mapa-item:hover { background: var(--creme); }
.mapa-item--ativo { background: rgba(80,64,160,0.1); border-color: var(--roxo); }

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  text-align: center;
}
.empty-state p { font-size: 0.9rem; font-weight: 600; color: var(--preto); margin-bottom: 0.3rem; }
.empty-state span { font-size: 0.8rem; color: var(--cinza); }
</style>

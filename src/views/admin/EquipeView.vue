<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { equipe, saveEquipe, descricaoGestao, saveDescricao, gestaoInfo, saveInfo } from '../../stores/equipe.js'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/admin/painel') }

const form = ref(equipe.value.map(d => ({ ...d })))
const descricao = ref(descricaoGestao.value)
const info = ref({ ...gestaoInfo.value })
const msg = ref({ tipo: '', texto: '' })
const fileInputs = ref([])

function comprimirImagem(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        let w = img.width, h = img.height
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

async function onFoto(i, e) {
  const file = e.target.files[0]
  if (!file) return
  form.value[i].foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFoto(i) {
  form.value[i].foto = ''
}

function salvar() {
  msg.value = { tipo: '', texto: '' }
  for (const d of form.value) {
    if (!d.presidente.trim()) {
      msg.value = { tipo: 'erro', texto: `Preencha o presidente da Diretoria ${d.diretoria}.` }
      return
    }
  }
  saveEquipe(form.value.map(d => ({ ...d, presidente: d.presidente.trim() })))
  saveDescricao(descricao.value.trim())
  saveInfo({ nomeChapa: info.value.nomeChapa.trim(), periodo: info.value.periodo.trim() })
  msg.value = { tipo: 'ok', texto: 'Equipe atualizada com sucesso!' }
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar />

    <div class="page-content">
      <button class="back-link" @click="voltar">← Voltar</button>
      <div class="page-heading">
        <h2>Gestão da <span>Equipe</span></h2>
      </div>

      <div class="paper">
        <p style="font-size:0.88rem;color:var(--cinza);margin-bottom:1.8rem;line-height:1.6;">
          Edite os nomes e fotos de cada diretoria. As alterações aparecem imediatamente na página <strong>Sobre</strong>.
        </p>

        <div class="info-grid">
          <div class="field" style="margin:0;">
            <label for="nome-chapa">Nome da chapa</label>
            <input id="nome-chapa" v-model="info.nomeChapa" type="text" placeholder="Ex: Compilando Futuros">
          </div>
          <div class="field" style="margin:0;">
            <label for="periodo">Período da gestão</label>
            <input id="periodo" v-model="info.periodo" type="text" placeholder="Ex: Mar 2025 – Mar 2026">
          </div>
        </div>

        <div class="secao-sep">Diretores</div>

        <div v-for="(d, i) in form" :key="d.diretoria" class="membro-row">
          <!-- Avatar / upload -->
          <div class="avatar-wrap">
            <img v-if="d.foto" :src="d.foto" class="avatar-img" :alt="d.presidente">
            <div v-else class="avatar-placeholder">
              <span>{{ d.presidente?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="avatar-actions">
              <button class="btn-foto" @click="fileInputs[i].click()">
                {{ d.foto ? 'Trocar' : 'Foto' }}
              </button>
              <button v-if="d.foto" class="btn-remover" @click="removerFoto(i)">✕</button>
            </div>
            <input
              :ref="el => fileInputs[i] = el"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onFoto(i, $event)"
            >
          </div>

          <!-- Campo nome -->
          <div class="field" style="margin:0;flex:1;">
            <label :for="`diretoria-${i}`">Diretoria {{ d.diretoria }}</label>
            <input
              :id="`diretoria-${i}`"
              v-model="form[i].presidente"
              type="text"
              placeholder="Nome do presidente"
            >
          </div>
        </div>

        <div class="field" style="margin-top:0.4rem;">
          <label for="descricao-gestao">Sobre a gestão atual</label>
          <textarea
            id="descricao-gestao"
            v-model="descricao"
            rows="5"
            placeholder="Conte um pouco sobre a chapa, seus objetivos e o que planejam para a gestão..."
          ></textarea>
          <div class="char-count">{{ descricao.length }} caracteres</div>
        </div>

        <div v-if="msg.texto" class="feedback-msg" :class="msg.tipo" style="margin-bottom:1rem;">
          {{ msg.texto }}
        </div>

        <button class="btn btn-primary" @click="salvar">Salvar equipe →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.membro-row {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1.4rem;
  padding-bottom: 1.4rem;
  border-bottom: 1.5px solid var(--creme-escuro);
}
.membro-row:last-of-type {
  border-bottom: none;
  margin-bottom: 1.8rem;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--creme-escuro);
}

.avatar-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--creme-escuro);
}
.avatar-placeholder span {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.4rem;
  color: var(--creme);
  line-height: 1;
}

.avatar-actions {
  display: flex;
  gap: 0.3rem;
}
.btn-foto {
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'Syne', sans-serif;
  padding: 3px 8px;
  border: 1.5px solid var(--roxo);
  border-radius: 2px;
  color: var(--roxo);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-foto:hover {
  background: var(--roxo);
  color: var(--creme);
}
.btn-remover {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 6px;
  border: 1.5px solid var(--cinza);
  border-radius: 2px;
  color: var(--cinza);
  background: transparent;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.btn-remover:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.char-count {
  font-size: 0.75rem;
  color: var(--cinza);
  text-align: right;
  margin-top: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.6rem;
}

.secao-sep {
  font-family: 'Syne', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cinza);
  border-top: 1.5px solid var(--creme-escuro);
  padding-top: 1.2rem;
  margin-bottom: 1.2rem;
}

@media (max-width: 500px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>

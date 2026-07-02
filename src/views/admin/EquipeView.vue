<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import {
  admins, addAdmin, removeAdmin, updateAdmin,
  descricaoGestao, saveDescricao, gestaoInfo, saveInfo, MESES,
  historicoGestoes, historicoVisivel, setHistoricoVisivel,
  arquivarGestaoAtual, removerGestaoHistorico,
} from '../../stores/equipe.js'
import { showToast } from '../../stores/toast.js'
import pencilIcon from '../../assets/icons/pencil.svg?raw'
import xIcon     from '../../assets/icons/x.svg?raw'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/admin/painel') }

// --- Informações da gestão ---
const info     = ref({ ...gestaoInfo.value })
const descricao = ref(descricaoGestao.value)
const infoSalvo = ref(false)

function salvarInfo() {
  saveInfo({
    nomeChapa: info.value.nomeChapa.trim(),
    mesInicio: info.value.mesInicio,
    anoInicio: info.value.anoInicio,
    mesFim:    info.value.mesFim,
    anoFim:    info.value.anoFim,
  })
  saveDescricao(descricao.value.trim())
  infoSalvo.value = true
  setTimeout(() => { infoSalvo.value = false }, 2000)
}

// --- Editar admin existente ---
const editandoId  = ref(null)
const editForm    = ref(null)
const fileEditRef = ref(null)

function iniciarEdicao(admin) {
  editandoId.value = admin.id
  editForm.value   = { ...admin }
}

function cancelarEdicao() {
  editandoId.value = null
  editForm.value   = null
}

async function onFotoEdit(e) {
  const file = e.target.files[0]
  if (!file) return
  editForm.value.foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFotoEdit() { editForm.value.foto = '' }

function salvarEdicao() {
  if (!editForm.value.nome.trim() || !editForm.value.email.trim()) return
  updateAdmin(editandoId.value, { ...editForm.value })
  showToast('Admin atualizado.', 'success')
  cancelarEdicao()
}

function confirmarRemocao(id, nome) {
  if (confirm(`Remover "${nome}" da equipe?`)) {
    if (editandoId.value === id) cancelarEdicao()
    removeAdmin(id)
  }
}

// --- Adicionar novo admin ---
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
  formAdd.value.foto = await comprimirImagem(file)
  e.target.value = ''
}

function removerFotoAdd() { formAdd.value.foto = '' }

function cadastrarAdmin() {
  const e = {}
  if (!formAdd.value.nome.trim())  e.nome  = true
  if (!formAdd.value.email.trim()) e.email = true
  errorsAdd.value = e
  if (Object.keys(e).length) return
  addAdmin({ ...formAdd.value })
  showToast(`Senha gerada e enviada para ${formAdd.value.email}`, 'success')
  resetFormAdd()
  mostraFormAdd.value = false
}

// --- Gestões anteriores ---
const confirmandoArquivar = ref(false)

function arquivar() {
  arquivarGestaoAtual()
  confirmandoArquivar.value = false
  showToast('Gestão arquivada no histórico.', 'success')
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

      <!-- Informações da gestão -->
      <div class="paper paper-mb">
        <p class="secao-sep">Informações da gestão</p>

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
                <input v-model="info.anoInicio" type="number" class="input-ano" placeholder="Ano" min="1990" max="2099">
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
                <input v-model="info.anoFim" type="number" class="input-ano" placeholder="Ano" min="1990" max="2099">
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

        <button class="btn btn-primary"
          :style="infoSalvo ? 'background:var(--verde);border-color:var(--verde);' : ''"
          @click="salvarInfo">
          {{ infoSalvo ? '✓ Salvo' : 'Salvar informações →' }}
        </button>
      </div>

      <!-- Header de administradores -->
      <div class="admins-header">
        <p class="label-sm" style="font-size:0.78rem;">Administradores</p>
        <button class="btn btn-outline btn-sm" @click="toggleFormAdd">
          {{ mostraFormAdd ? 'Cancelar' : '+ Adicionar admin' }}
        </button>
      </div>

      <!-- Formulário de adição -->
      <div v-if="mostraFormAdd" class="paper paper-mb add-form-box">
        <p class="secao-sep">Novo administrador</p>
        <p style="font-size:0.82rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
          Uma senha aleatória será gerada e enviada ao e-mail do administrador no primeiro acesso.
        </p>

        <div class="admin-form-grid">
          <div class="field">
            <label>Nome *</label>
            <input v-model="formAdd.nome" type="text" placeholder="Nome completo" maxlength="80"
              :class="{ invalid: errorsAdd.nome }">
            <span class="error-msg">Preencha o nome.</span>
          </div>
          <div class="field">
            <label>E-mail *</label>
            <input v-model="formAdd.email" type="email" placeholder="admin@email.com"
              :class="{ invalid: errorsAdd.email }">
            <span class="error-msg">Preencha o e-mail.</span>
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
          <label>Descrição <span class="field-hint">(opcional)</span></label>
          <textarea v-model="formAdd.descricao" rows="2" placeholder="Cargo, área de atuação, etc."></textarea>
        </div>

        <div class="admin-form-grid">
          <div class="field">
            <label>LinkedIn <span class="field-hint">(opcional)</span></label>
            <input v-model="formAdd.linkedin" type="url" placeholder="https://linkedin.com/in/...">
          </div>
          <div class="field">
            <label>GitHub <span class="field-hint">(opcional)</span></label>
            <input v-model="formAdd.git" type="url" placeholder="https://github.com/...">
          </div>
          <div class="field">
            <label>Lattes <span class="field-hint">(opcional)</span></label>
            <input v-model="formAdd.lattes" type="url" placeholder="http://lattes.cnpq.br/...">
          </div>
        </div>

        <!-- Foto -->
        <div class="field">
          <label>Foto <span class="field-hint">(opcional)</span></label>
          <div class="foto-row">
            <div class="avatar-sm">
              <img v-if="formAdd.foto" :src="formAdd.foto" class="avatar-img" alt="">
              <span v-else class="avatar-initial">{{ formAdd.nome?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <button class="btn-foto" @click="fileAddRef.click()">
              {{ formAdd.foto ? 'Trocar foto' : 'Escolher foto' }}
            </button>
            <button v-if="formAdd.foto" class="btn-remover-foto" @click="removerFotoAdd">Remover</button>
            <input ref="fileAddRef" type="file" accept="image/*" style="display:none" @change="onFotoAdd">
          </div>
        </div>

        <div class="btn-row" style="margin-top:0.4rem;">
          <button class="btn btn-primary" @click="cadastrarAdmin">Cadastrar admin →</button>
          <button class="btn btn-outline btn-sm" @click="toggleFormAdd">Cancelar</button>
        </div>
      </div>

      <!-- Lista de admins -->
      <div v-if="admins.length === 0 && !mostraFormAdd" class="empty-state">
        <p>Nenhum administrador cadastrado ainda.</p>
        <span>Clique em "+ Adicionar admin" para começar.</span>
      </div>

      <div v-for="admin in admins" :key="admin.id" class="paper paper-mb admin-card">

        <!-- Modo visualização -->
        <template v-if="editandoId !== admin.id">
          <div class="admin-summary">
            <div class="avatar-sm">
              <img v-if="admin.foto" :src="admin.foto" class="avatar-img" :alt="admin.nome">
              <span v-else class="avatar-initial">{{ admin.nome?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="admin-info">
              <div class="admin-nome">{{ admin.nome }}</div>
              <div class="admin-email">{{ admin.email }}</div>
              <div v-if="admin.periodo" class="admin-periodo-badge">{{ admin.periodo }}</div>
              <div v-if="admin.descricao" class="admin-desc">{{ admin.descricao }}</div>
              <div v-if="admin.linkedin || admin.git || admin.lattes" class="admin-link-row">
                <span v-if="admin.linkedin" class="admin-link-pill">LinkedIn</span>
                <span v-if="admin.git" class="admin-link-pill">GitHub</span>
                <span v-if="admin.lattes" class="admin-link-pill">Lattes</span>
              </div>
            </div>
            <div class="admin-btns">
              <button class="icon-btn" title="Editar" @click="iniciarEdicao(admin)" v-html="pencilIcon"></button>
              <button class="icon-btn icon-btn--danger" title="Remover" @click="confirmarRemocao(admin.id, admin.nome)" v-html="xIcon"></button>
            </div>
          </div>
        </template>

        <!-- Modo edição -->
        <template v-else>
          <p class="secao-sep" style="margin-top:0;">Editar administrador</p>

          <div class="admin-form-grid">
            <div class="field">
              <label>Nome *</label>
              <input v-model="editForm.nome" type="text" maxlength="80">
            </div>
            <div class="field">
              <label>E-mail *</label>
              <input v-model="editForm.email" type="email">
            </div>
            <div class="field">
              <label>Diretoria</label>
              <input v-model="editForm.diretoria" type="text" maxlength="60">
            </div>
            <div class="field">
              <label>Período <span class="field-hint">(ex.: 2024.2)</span></label>
              <input v-model="editForm.periodo" type="text" maxlength="10">
            </div>
          </div>

          <div class="field">
            <label>Descrição</label>
            <textarea v-model="editForm.descricao" rows="2"></textarea>
          </div>

          <div class="admin-form-grid">
            <div class="field">
              <label>LinkedIn</label>
              <input v-model="editForm.linkedin" type="url" placeholder="https://linkedin.com/in/...">
            </div>
            <div class="field">
              <label>GitHub</label>
              <input v-model="editForm.git" type="url" placeholder="https://github.com/...">
            </div>
            <div class="field">
              <label>Lattes</label>
              <input v-model="editForm.lattes" type="url" placeholder="http://lattes.cnpq.br/...">
            </div>
          </div>

          <div class="field">
            <label>Foto</label>
            <div class="foto-row">
              <div class="avatar-sm">
                <img v-if="editForm.foto" :src="editForm.foto" class="avatar-img" alt="">
                <span v-else class="avatar-initial">{{ editForm.nome?.[0]?.toUpperCase() || '?' }}</span>
              </div>
              <button class="btn-foto" @click="fileEditRef.click()">
                {{ editForm.foto ? 'Trocar foto' : 'Escolher foto' }}
              </button>
              <button v-if="editForm.foto" class="btn-remover-foto" @click="removerFotoEdit">Remover</button>
              <input ref="fileEditRef" type="file" accept="image/*" style="display:none" @change="onFotoEdit">
            </div>
          </div>

          <div class="btn-row">
            <button class="btn btn-primary" @click="salvarEdicao">Salvar →</button>
            <button class="btn btn-outline btn-sm" @click="cancelarEdicao">Cancelar</button>
          </div>
        </template>
      </div>

      <!-- ── Gestões anteriores ──────────────────── -->
      <div class="paper" style="margin-top:1.2rem;">
        <div class="hist-cabecalho">
          <div>
            <h2 class="paper-title" style="margin-bottom:2px;">Gestões anteriores</h2>
            <p style="font-size:0.82rem;color:var(--cinza);margin:0;">
              Snapshot público da gestão salvo no Sobre.
            </p>
          </div>
          <div class="hist-cabecalho-acoes">
            <label class="hist-toggle-label">
              <input type="checkbox" :checked="historicoVisivel" @change="setHistoricoVisivel($event.target.checked)">
              Visível no Sobre
            </label>
            <button v-if="!confirmandoArquivar" class="btn btn-outline btn-sm" @click="confirmandoArquivar = true">
              Arquivar gestão atual →
            </button>
          </div>
        </div>

        <div v-if="confirmandoArquivar" class="hist-confirm">
          <p style="font-size:0.88rem;margin:0 0 0.8rem;">
            Salva um snapshot da gestão <strong>{{ gestaoInfo.nomeChapa || 'atual' }}</strong> no histórico público. Confirma?
          </p>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary btn-sm" @click="arquivar">Confirmar →</button>
            <button class="btn btn-outline btn-sm" @click="confirmandoArquivar = false">Cancelar</button>
          </div>
        </div>

        <div v-if="historicoGestoes.length" class="hist-lista-admin">
          <div v-for="g in historicoGestoes" :key="g.id" class="hist-item-admin">
            <div class="hist-item-info">
              <span class="hist-chapa">{{ g.nomeChapa || 'Sem nome' }}</span>
              <span v-if="g.periodo" class="hist-periodo">{{ g.periodo }}</span>
              <span class="hist-membros-count">{{ g.membros?.length ?? 0 }} admin{{ (g.membros?.length ?? 0) !== 1 ? 's' : '' }}</span>
            </div>
            <button class="icon-btn icon-btn--danger" @click="removerGestaoHistorico(g.id)" title="Remover do histórico" v-html="xIcon"></button>
          </div>
        </div>
        <p v-else-if="!confirmandoArquivar" style="font-size:0.85rem;color:var(--cinza);margin-top:1rem;">
          Nenhuma gestão arquivada ainda.
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.admins-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.add-form-box {
  border-left: 4px solid var(--roxo);
}

.admin-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 1.2rem;
}

.admin-card { padding: 1.2rem 1.4rem; }

.admin-summary {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
}

.admin-info { flex: 1; min-width: 0; }

.admin-nome {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--preto);
  margin-bottom: 2px;
}

.admin-email {
  font-size: 0.82rem;
  color: var(--cinza);
  margin-bottom: 6px;
}

.admin-periodo-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 8px;
  border-radius: 2px;
  background: rgba(80,64,160,0.1);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.25);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.admin-desc {
  font-size: 0.85rem;
  color: var(--preto);
  opacity: 0.7;
  line-height: 1.5;
  margin-bottom: 8px;
}

.admin-link-row { display: flex; gap: 6px; flex-wrap: wrap; }

.admin-link-pill {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1.5px solid var(--creme-escuro);
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-btns {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); margin-bottom: 0.4rem; }
.empty-state span { font-size: 0.85rem; color: var(--cinza); }

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

@media (max-width: 680px) {
  .admin-form-grid { grid-template-columns: 1fr; }
}

/* Gestões anteriores */
.hist-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.hist-cabecalho-acoes {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
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
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1rem 1.2rem;
  margin-bottom: 1rem;
}

.hist-lista-admin { display: flex; flex-direction: column; gap: 6px; margin-top: 0.8rem; }

.hist-item-admin {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 10px 14px;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
}

.hist-item-info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.hist-chapa { font-size: 0.9rem; font-weight: 700; color: var(--roxo-escuro); }
.hist-periodo { font-size: 0.76rem; color: var(--cinza); }
.hist-membros-count { font-size: 0.74rem; color: var(--cinza); }
</style>

<script setup>
import { ref, reactive, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { professores, addProfessor, updateProfessor, deleteProfessor } from '../../stores/informacoes.js'
import { estruturas } from '../../stores/mapa.js'
import { showToast } from '../../stores/toast.js'

function nomeEstrutura(id) { return estruturas.value.find(e => e.id === id)?.nome ?? null }

// --------------- Formulário adicionar ---------------
const mostrarForm = ref(false)
const formAdd = reactive({ nome: '', estruturaId: '', lattes: '', googleAcademico: '', linkedin: '' })
const erros   = reactive({ nome: '' })

function validarNome(nome) {
  return nome.trim().length < 2 ? 'Nome obrigatório (mínimo 2 caracteres).' : ''
}

function validar(form) {
  erros.nome = validarNome(form.nome)
  return !erros.nome
}

function publicar() {
  if (!validar(formAdd)) return
  addProfessor({
    nome: formAdd.nome.trim(),
    estruturaId: formAdd.estruturaId ? Number(formAdd.estruturaId) : null,
    lattes: formAdd.lattes.trim(),
    googleAcademico: formAdd.googleAcademico.trim(),
    linkedin: formAdd.linkedin.trim(),
  })
  Object.assign(formAdd, { nome: '', estruturaId: '', lattes: '', googleAcademico: '', linkedin: '' })
  mostrarForm.value = false
  showToast('Professor cadastrado.', 'success')
}

function cancelarAdd() {
  Object.assign(formAdd, { nome: '', estruturaId: '', lattes: '', googleAcademico: '', linkedin: '' })
  erros.nome = ''
  mostrarForm.value = false
}

// --------------- Edição inline ---------------
const editandoId = ref(null)
const formEdit = reactive({ nome: '', estruturaId: '', lattes: '', googleAcademico: '', linkedin: '' })
const errosEdit = reactive({ nome: '' })

function abrirEdit(p) {
  editandoId.value = p.id
  errosEdit.nome = ''
  Object.assign(formEdit, {
    nome: p.nome,
    estruturaId: p.estruturaId ?? '',
    lattes: p.lattes ?? '',
    googleAcademico: p.googleAcademico ?? '',
    linkedin: p.linkedin ?? '',
  })
}

function salvarEdit(id) {
  errosEdit.nome = validarNome(formEdit.nome)
  if (errosEdit.nome) return
  updateProfessor(id, {
    nome: formEdit.nome.trim(),
    estruturaId: formEdit.estruturaId ? Number(formEdit.estruturaId) : null,
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
          <label class="label">Sala / Localização <span class="field-hint">(opcional — linka com o Mapa)</span></label>
          <select v-model="formAdd.estruturaId" class="input">
            <option value="">Nenhuma</option>
            <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>

        <div class="field">
          <label class="label">Lattes <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.lattes" type="url" class="input" placeholder="http://lattes.cnpq.br/...">
        </div>
        <div class="field">
          <label class="label">Google Acadêmico <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.googleAcademico" type="url" class="input" placeholder="https://scholar.google.com/...">
        </div>
        <div class="field">
          <label class="label">LinkedIn <span class="field-hint">(opcional)</span></label>
          <input v-model="formAdd.linkedin" type="url" class="input" placeholder="https://linkedin.com/in/...">
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
          <div class="pub-card-titulo">{{ p.nome }}</div>
          <div v-if="p.estruturaId" style="font-size:0.8rem;color:var(--cinza);margin-bottom:0.4rem;">
            Localização: {{ nomeEstrutura(p.estruturaId) }}
          </div>
          <div v-if="p.lattes || p.googleAcademico || p.linkedin" class="diretorio-links">
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
            <label class="label">Sala / Localização</label>
            <select v-model="formEdit.estruturaId" class="input">
              <option value="">Nenhuma</option>
              <option v-for="e in estruturas" :key="e.id" :value="e.id">{{ e.nome }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Lattes</label>
            <input v-model="formEdit.lattes" type="url" class="input">
          </div>
          <div class="field">
            <label class="label">Google Acadêmico</label>
            <input v-model="formEdit.googleAcademico" type="url" class="input">
          </div>
          <div class="field">
            <label class="label">LinkedIn</label>
            <input v-model="formEdit.linkedin" type="url" class="input">
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

.pub-card {
  background: var(--branco); border: 1.5px solid var(--creme-escuro); border-left: 4px solid var(--roxo);
  border-radius: 2px; padding: 1.2rem 1.4rem; margin-bottom: 0.8rem; box-shadow: 3px 3px 0 var(--roxo-escuro);
}
.pub-card-titulo { font-family: 'Archivo Black', sans-serif; font-weight: 700; font-size: 1rem; color: var(--preto); margin-bottom: 0.3rem; }
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

.textarea { min-height: 120px; resize: vertical; }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 0.8rem; }

.empty-state {
  background: var(--creme); border: 2px solid var(--creme-escuro); border-radius: 2px;
  padding: 3rem 2rem; text-align: center; box-shadow: 5px 5px 0 var(--roxo-escuro);
}
.empty-state p { font-size: 1rem; font-weight: 600; color: var(--preto); }
</style>

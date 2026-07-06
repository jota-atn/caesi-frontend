<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import { eventos, addEvento, updateEvento, removeEvento } from '../../stores/calendario.js'
import { showToast } from '../../stores/toast.js'

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES_EXT   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const pad = n => String(n).padStart(2, '0')
const fmtISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const agora = new Date()
const anoAtual = ref(agora.getFullYear())
const mesAtual = ref(agora.getMonth()) // 0-11
const hojeISO  = fmtISO(agora)

function mesAnterior() {
  if (mesAtual.value === 0) { mesAtual.value = 11; anoAtual.value-- } else mesAtual.value--
}
function mesSeguinte() {
  if (mesAtual.value === 11) { mesAtual.value = 0; anoAtual.value++ } else mesAtual.value++
}
function irParaHoje() {
  anoAtual.value = agora.getFullYear()
  mesAtual.value = agora.getMonth()
  selecionarDia(hojeISO)
}

const eventosPorDia = computed(() => {
  const mapa = {}
  for (const e of eventos.value) {
    if (!mapa[e.data]) mapa[e.data] = []
    mapa[e.data].push(e)
  }
  return mapa
})

const celulas = computed(() => {
  const primeiroDia = new Date(anoAtual.value, mesAtual.value, 1)
  const offset = primeiroDia.getDay() // 0 = domingo
  const inicio = new Date(anoAtual.value, mesAtual.value, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const iso = fmtISO(d)
    return {
      iso,
      dia: d.getDate(),
      outroMes: d.getMonth() !== mesAtual.value,
      hoje: iso === hojeISO,
      eventos: eventosPorDia.value[iso] ?? [],
    }
  })
})

// ── Painel do dia selecionado ────────────────────────────
const diaSelecionado = ref(hojeISO)
const eventosDoDia = computed(() => eventosPorDia.value[diaSelecionado.value] ?? [])

function selecionarDia(iso) {
  diaSelecionado.value = iso
  mostrarFormAdd.value = false
  editandoId.value = null
}

function formatDataSelecionada(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${dia} de ${MESES_EXT[mes - 1]} de ${ano}`
}

// ── Adicionar evento ──────────────────────────────────────
const mostrarFormAdd = ref(false)
const formAdd = ref({ nome: '', descricao: '' })
const errosAdd = ref({})

function toggleFormAdd() {
  mostrarFormAdd.value = !mostrarFormAdd.value
  if (!mostrarFormAdd.value) { formAdd.value = { nome: '', descricao: '' }; errosAdd.value = {} }
}

function salvarNovoEvento() {
  if (!formAdd.value.nome.trim()) { errosAdd.value = { nome: true }; return }
  addEvento({ nome: formAdd.value.nome.trim(), data: diaSelecionado.value, descricao: formAdd.value.descricao.trim() })
  formAdd.value = { nome: '', descricao: '' }
  errosAdd.value = {}
  mostrarFormAdd.value = false
  showToast('Evento adicionado ao calendário.', 'success')
}

// ── Editar evento standalone ─────────────────────────────
const editandoId = ref(null)
const editForm   = ref({ nome: '', descricao: '' })

function iniciarEdicao(e) {
  editandoId.value = e.id
  editForm.value = { nome: e.nome, descricao: e.descricao ?? '' }
}
function cancelarEdicao() { editandoId.value = null }

function salvarEdicao(id) {
  if (!editForm.value.nome.trim()) return
  updateEvento(id, { nome: editForm.value.nome.trim(), descricao: editForm.value.descricao.trim() })
  editandoId.value = null
  showToast('Evento atualizado.', 'success')
}

function excluirEvento(e) {
  if (confirm(`Remover o evento "${e.nome}" do calendário?`)) {
    removeEvento(e.id)
    if (editandoId.value === e.id) editandoId.value = null
    showToast('Evento removido.', 'info')
  }
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/painel" style="margin-bottom:1.2rem;" />
      <div class="page-heading">
        <h2>Gestão do <span>Calendário</span></h2>
      </div>

      <div class="cal-layout">
        <!-- Grade do mês -->
        <div class="paper cal-grid-paper">
          <div class="cal-header">
            <button class="btn btn-outline btn-sm" @click="mesAnterior">← </button>
            <div class="cal-titulo">{{ MESES_EXT[mesAtual] }} {{ anoAtual }}</div>
            <button class="btn btn-outline btn-sm" @click="mesSeguinte">→</button>
          </div>
          <button class="btn btn-outline btn-sm cal-hoje-btn" @click="irParaHoje">Hoje</button>

          <div class="cal-semana">
            <span v-for="d in DIAS_SEMANA" :key="d">{{ d }}</span>
          </div>

          <div class="cal-dias">
            <button
              v-for="c in celulas" :key="c.iso"
              class="cal-dia"
              :class="{ 'cal-dia--outro-mes': c.outroMes, 'cal-dia--hoje': c.hoje, 'cal-dia--selecionado': c.iso === diaSelecionado, 'cal-dia--com-evento': c.eventos.length > 0 }"
              @click="selecionarDia(c.iso)"
            >
              <span class="cal-dia-numero">{{ c.dia }}</span>
              <span v-if="c.eventos.length > 0" class="cal-dia-badge">{{ c.eventos.length }}</span>
            </button>
          </div>
        </div>

        <!-- Painel do dia -->
        <div class="paper cal-painel">
          <div class="cal-painel-header">
            <p class="label-sm" style="margin:0;">{{ formatDataSelecionada(diaSelecionado) }}</p>
            <button class="btn btn-outline btn-sm" @click="toggleFormAdd">
              {{ mostrarFormAdd ? 'Cancelar' : '+ Adicionar evento' }}
            </button>
          </div>

          <!-- Form de adição -->
          <div v-if="mostrarFormAdd" class="cal-form-add">
            <div class="field">
              <label>Nome *</label>
              <input v-model="formAdd.nome" type="text" maxlength="100" placeholder="Ex.: Maratona de Programação" :class="{ invalid: errosAdd.nome }">
              <span class="error-msg">Preencha o nome do evento.</span>
            </div>
            <div class="field">
              <label>Descrição <span class="field-hint">(opcional)</span></label>
              <textarea v-model="formAdd.descricao" rows="3" placeholder="Detalhes do evento…"></textarea>
            </div>
            <button class="btn btn-primary btn-sm" @click="salvarNovoEvento">Salvar evento →</button>
          </div>

          <!-- Lista de eventos do dia -->
          <div v-if="eventosDoDia.length === 0 && !mostrarFormAdd" class="empty-state" style="padding:2rem 1rem;">
            <p>Nenhum evento neste dia.</p>
          </div>

          <div v-for="e in eventosDoDia" :key="e.id" class="cal-evento-item">
            <template v-if="editandoId !== e.id">
              <div class="cal-evento-info">
                <div class="cal-evento-nome">{{ e.nome }}</div>
                <p v-if="e.descricao" class="cal-evento-desc">{{ e.descricao }}</p>
                <span v-if="e.formularioId" class="cal-evento-vinculo">Vinculado a formulário</span>
              </div>
              <div v-if="e.formularioId" class="cal-evento-actions">
                <RouterLink :to="`/admin/formularios/${e.formularioId}`" class="btn btn-outline btn-sm">Editar via formulário →</RouterLink>
              </div>
              <div v-else class="cal-evento-actions">
                <button class="btn btn-outline btn-sm" @click="iniciarEdicao(e)">Editar</button>
                <button class="btn btn-danger btn-sm" @click="excluirEvento(e)">Excluir</button>
              </div>
            </template>

            <template v-else>
              <div class="cal-form-add" style="width:100%;">
                <div class="field">
                  <label>Nome *</label>
                  <input v-model="editForm.nome" type="text" maxlength="100">
                </div>
                <div class="field">
                  <label>Descrição</label>
                  <textarea v-model="editForm.descricao" rows="3"></textarea>
                </div>
                <div class="btn-row">
                  <button class="btn btn-primary btn-sm" @click="salvarEdicao(e.id)">Salvar →</button>
                  <button class="btn btn-outline btn-sm" @click="cancelarEdicao">Cancelar</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 1.2rem;
  align-items: start;
}

@media (max-width: 860px) {
  .cal-layout { grid-template-columns: 1fr; }
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.cal-titulo {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  color: var(--roxo-escuro);
  text-transform: capitalize;
}

.cal-hoje-btn { margin-bottom: 0.8rem; }

.cal-semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}
.cal-semana span {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--cinza);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cal-dias {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-dia {
  position: relative;
  aspect-ratio: 1;
  border: 1.5px solid var(--creme-escuro);
  background: var(--branco);
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Archivo', sans-serif;
  font-size: 0.85rem;
  color: var(--preto);
  transition: border-color 0.15s, background 0.15s;
}
.cal-dia:hover { border-color: var(--roxo); }
.cal-dia--outro-mes { opacity: 0.35; }
.cal-dia--hoje { border-color: var(--amarelo); border-width: 2px; font-weight: 700; }
.cal-dia--selecionado { background: var(--roxo-escuro); color: var(--creme); border-color: var(--roxo-escuro); }
.cal-dia--com-evento:not(.cal-dia--selecionado) { background: rgba(80,64,160,0.08); }

.cal-dia-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.6rem;
  font-weight: 700;
  background: var(--amarelo);
  color: var(--roxo-escuro);
  border-radius: 50%;
  width: 15px;
  height: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cal-painel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.cal-form-add {
  background: var(--creme);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.cal-evento-item {
  border: 1.5px solid var(--creme-escuro);
  border-left: 4px solid var(--roxo);
  border-radius: 2px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
}

.cal-evento-nome {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--preto);
}

.cal-evento-desc {
  font-size: 0.83rem;
  color: var(--cinza);
  line-height: 1.5;
  margin-top: 4px;
}

.cal-evento-vinculo {
  display: inline-block;
  margin-top: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--roxo-escuro);
  background: rgba(80,64,160,0.1);
  border: 1px solid rgba(80,64,160,0.25);
  border-radius: 2px;
  padding: 2px 7px;
}

.cal-evento-actions {
  display: flex;
  gap: 8px;
  margin-top: 0.7rem;
  flex-wrap: wrap;
}

.empty-state {
  background: var(--creme);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  text-align: center;
}
.empty-state p { font-size: 0.9rem; color: var(--cinza); }
</style>

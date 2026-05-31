<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes, addFormulario } from '../../stores/formularios.js'

const filtro = ref('todos')
const busca  = ref('')

const TIPO_LABEL = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

const formulariosFiltrados = computed(() =>
  formularios.value.filter(f => {
    const matchFiltro = filtro.value === 'todos' || f.status === filtro.value
    const t = busca.value.toLowerCase()
    const matchBusca = !t || f.titulo.toLowerCase().includes(t) || f.descricao.toLowerCase().includes(t)
    return matchFiltro && matchBusca
  })
)

const totalAbertos   = computed(() => formularios.value.filter(f => f.status === 'aberto').length)
const totalPendentes = computed(() => inscricoes.value.filter(i => i.comprovante?.status === 'pendente').length)

function inscricoesCount(id) {
  return inscricoes.value.filter(i => i.formularioId === id).length
}
function pendenteCount(id) {
  return inscricoes.value.filter(i => i.formularioId === id && i.comprovante?.status === 'pendente').length
}
function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}
function formatPrazo(prazo) {
  return new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
}

// ── Criação de formulário ────────────────────────────────
const showNovoForm    = ref(false)
const novoFormSuccess = ref(false)
const novoFormErrors  = ref({})
const novoForm = ref({
  titulo: '', tipo: '', descricao: '',
  pago: false, valor: '', prazoInscricao: '',
  campos: [],
})

function cancelNovoForm() {
  showNovoForm.value = false
  novoFormSuccess.value = false
  novoFormErrors.value = {}
  novoForm.value = { titulo: '', tipo: '', descricao: '', pago: false, valor: '', prazoInscricao: '', campos: [] }
}

function addCampo() {
  novoForm.value.campos.push({ _id: Date.now(), label: '', tipo: 'texto', opcoesStr: '', obrigatorio: false, isQuantidade: false })
}

function removeCampo(index) {
  novoForm.value.campos.splice(index, 1)
}

function onTipoCampoChange(campo) {
  if (campo.tipo !== 'numero') campo.isQuantidade = false
}

function setQuantidadeCampo(index, value) {
  novoForm.value.campos.forEach((c, i) => { c.isQuantidade = i === index ? value : false })
}

function submitNovoForm() {
  const e = {}
  if (!novoForm.value.titulo.trim()) e.titulo = true
  if (!novoForm.value.tipo)          e.tipo = true
  if (novoForm.value.pago && (!novoForm.value.valor || Number(novoForm.value.valor) <= 0)) e.valor = true
  novoFormErrors.value = e
  if (Object.keys(e).length > 0) return

  const campos = novoForm.value.campos
    .filter(c => c.label.trim())
    .map(c => ({
      id: `campo_${c._id}`,
      label: c.label.trim(),
      tipo: c.tipo,
      obrigatorio: c.obrigatorio,
      ...(c.isQuantidade ? { isQuantidade: true } : {}),
      ...(c.tipo === 'select' ? { opcoes: c.opcoesStr.split(',').map(s => s.trim()).filter(Boolean) } : {}),
    }))

  addFormulario({
    titulo: novoForm.value.titulo.trim(),
    tipo: novoForm.value.tipo,
    descricao: novoForm.value.descricao.trim(),
    pago: novoForm.value.pago,
    valor: novoForm.value.pago ? Number(novoForm.value.valor) : null,
    prazoInscricao: novoForm.value.prazoInscricao || null,
    campos,
  })

  novoFormSuccess.value = true
  setTimeout(() => cancelNovoForm(), 1800)
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>
    <div class="deco-star" style="bottom:25%;left:1%;font-size:1.4rem;opacity:0.28;">✦</div>

    <Navbar :admin="true" />

    <div class="page-content">
      <div class="page-heading">
        <h2>Formulários <span>e Eventos</span></h2>
        <button class="btn btn-amarelo btn-sm" @click="showNovoForm ? cancelNovoForm() : (showNovoForm = true)">
          {{ showNovoForm ? '✕ Cancelar' : '+ Novo formulário' }}
        </button>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ formularios.length }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--verde">{{ totalAbertos }}</div>
          <div class="stat-label">Abertos</div>
        </div>
        <div class="stat-card stat-card--amarelo">
          <div class="stat-number stat-number--roxo">{{ totalPendentes }}</div>
          <div class="stat-label">Comp. Pendentes</div>
        </div>
      </div>

      <!-- Painel de criação -->
      <div v-if="showNovoForm" class="paper paper-mb-lg">
        <h3 class="paper-subtitle">Criar formulário</h3>

        <div v-if="novoFormSuccess" style="text-align:center;padding:1.2rem 0;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">✓</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;color:var(--verde);">Formulário criado!</div>
        </div>

        <form v-else @submit.prevent="submitNovoForm" novalidate>
          <div class="field-grid">
            <div class="field">
              <label>Título *</label>
              <input
                v-model="novoForm.titulo" type="text"
                placeholder="Ex.: Semana de Computação 2025"
                :class="{ invalid: novoFormErrors.titulo }"
              >
              <span class="error-msg">Preencha o título.</span>
            </div>
            <div class="field">
              <label>Tipo *</label>
              <select v-model="novoForm.tipo" :class="{ invalid: novoFormErrors.tipo }">
                <option value="" disabled>Selecione um tipo</option>
                <option value="evento-com-certificado">Evento com Certificado</option>
                <option value="evento-sem-certificado">Evento sem Certificado</option>
                <option value="venda">Venda</option>
                <option value="arrecadacao">Arrecadação</option>
              </select>
              <span class="error-msg">Selecione um tipo.</span>
            </div>
          </div>

          <div class="field">
            <label>Descrição</label>
            <textarea v-model="novoForm.descricao" placeholder="Descreva o evento, item ou finalidade…" rows="3" style="min-height:80px;" />
          </div>

          <div class="field-grid" style="align-items:end;">
            <label class="check-anon" style="margin-bottom:0;">
              <input v-model="novoForm.pago" type="checkbox">
              <span class="check-anon-label"><strong>Formulário pago</strong> — exige comprovante de pagamento</span>
            </label>
            <div class="field" style="margin-bottom:0;" v-if="novoForm.pago">
              <label>Valor (R$) *</label>
              <input
                v-model="novoForm.valor" type="number" min="0.01" step="0.01"
                placeholder="0,00"
                :class="{ invalid: novoFormErrors.valor }"
              >
              <span class="error-msg">Informe um valor válido.</span>
            </div>
          </div>

          <div class="field" style="margin-top:1.2rem;max-width:260px;">
            <label>Prazo de inscrição</label>
            <input v-model="novoForm.prazoInscricao" type="date">
          </div>

          <hr class="divider">

          <!-- Campos dinâmicos -->
          <div class="campos-section-header">
            <p class="label-sm">Campos do formulário</p>
            <button type="button" class="btn btn-outline btn-sm" @click="addCampo">+ Adicionar campo</button>
          </div>

          <div v-if="novoForm.campos.length === 0" style="font-size:0.85rem;color:var(--cinza);margin-bottom:1rem;">
            Nenhum campo adicionado. O formulário terá apenas nome e e-mail por padrão.
          </div>

          <div v-for="(campo, index) in novoForm.campos" :key="campo._id">
            <div class="campo-row">
              <select v-model="campo.tipo" class="campo-row-select" @change="onTipoCampoChange(campo)">
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="select">Seleção</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <input
                v-model="campo.label"
                class="campo-row-input"
                type="text"
                :placeholder="`Nome do campo ${index + 1}`"
              >
              <label class="campo-row-check">
                <input v-model="campo.obrigatorio" type="checkbox">
                Obrigatório
              </label>
              <label v-if="novoForm.pago && campo.tipo === 'numero'" class="campo-row-check" style="color:var(--roxo-escuro);font-weight:700;">
                <input
                  type="checkbox"
                  :checked="campo.isQuantidade"
                  @change="setQuantidadeCampo(index, $event.target.checked)"
                >
                Quantidade
              </label>
              <button type="button" class="btn btn-outline btn-sm" @click="removeCampo(index)">✕</button>
            </div>
            <input
              v-if="campo.tipo === 'select'"
              v-model="campo.opcoesStr"
              class="campo-opcoes-input"
              type="text"
              placeholder="Opções separadas por vírgula: P, M, G, GG"
            >
          </div>

          <div class="btn-row" style="margin-top:1.2rem;">
            <button type="submit" class="btn btn-primary btn-sm">Criar formulário</button>
            <button type="button" class="btn btn-outline btn-sm" @click="cancelNovoForm">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Busca + filtros -->
      <div class="filter-bar" role="group" aria-label="Filtrar formulários">
        <input v-model="busca" type="search" placeholder="Buscar por título ou descrição…">
        <button class="filter-btn" :class="{ active: filtro === 'todos' }"     :aria-pressed="filtro === 'todos'"     @click="filtro = 'todos'">Todos</button>
        <button class="filter-btn" :class="{ active: filtro === 'aberto' }"    :aria-pressed="filtro === 'aberto'"    @click="filtro = 'aberto'">Abertos</button>
        <button class="filter-btn" :class="{ active: filtro === 'encerrado' }" :aria-pressed="filtro === 'encerrado'" @click="filtro = 'encerrado'">Encerrados</button>
      </div>

      <!-- Lista de formulários -->
      <RouterLink
        v-for="f in formulariosFiltrados"
        :key="f.id"
        :to="`/admin/formularios/${f.id}`"
        class="form-card"
        :class="f.status"
      >
        <div class="form-card-info">
          <div class="form-card-tags">
            <span class="tipo-tag" :class="`tipo-${f.tipo}`">{{ TIPO_LABEL[f.tipo] }}</span>
            <span class="form-status-badge" :class="`form-status-${f.status}`">{{ f.status }}</span>
            <span v-if="pendenteCount(f.id) > 0" class="comp-badge comp-pendente">
              {{ pendenteCount(f.id) }} pendente{{ pendenteCount(f.id) > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="form-card-title">{{ f.titulo }}</div>
          <div class="form-card-desc">{{ f.descricao }}</div>
          <div class="form-card-meta">
            <span>{{ inscricoesCount(f.id) }} inscrição{{ inscricoesCount(f.id) !== 1 ? 'ões' : '' }}</span>
            <template v-if="f.pago">
              <span>·</span>
              <span>{{ formatValor(f.valor) }} / pessoa</span>
            </template>
            <template v-if="f.prazoInscricao">
              <span>·</span>
              <span>Prazo: {{ formatPrazo(f.prazoInscricao) }}</span>
            </template>
          </div>
        </div>
        <div class="form-card-right">
          <span class="msg-card-arrow">→</span>
        </div>
      </RouterLink>

      <div v-if="formulariosFiltrados.length === 0" class="empty-state">
        <p>{{ formularios.length === 0 ? 'Nenhum formulário criado ainda.' : 'Nenhum formulário encontrado.' }}</p>
        <span v-if="formularios.length === 0" style="font-size:0.85rem;">Use o botão acima para criar o primeiro.</span>
      </div>
    </div>
  </div>
</template>

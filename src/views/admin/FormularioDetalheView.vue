<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes, updateStatusComprovante, updateFormulario, deleteFormulario, emitirCertificados } from '../../stores/formularios.js'
import { usuarios } from '../../stores/usuarios.js'

const route  = useRoute()
const router = useRouter()

const id = Number(route.params.id)
const formulario = computed(() => formularios.value.find(f => f.id === id))

if (!formulario.value) router.replace('/admin/formularios')

const inscricoesDaForm = computed(() =>
  inscricoes.value.filter(i => i.formularioId === id)
)

const comprovantesPendentes = computed(() =>
  inscricoesDaForm.value.filter(i => i.comprovante?.status === 'pendente').length
)

function _qtd(i) {
  return formulario.value.tipo === 'venda' ? (Number(i.respostas?.__quantidade) || 1) : 1
}

const receitaConfirmada = computed(() => {
  if (!formulario.value?.pago) return null
  return inscricoesDaForm.value
    .filter(i => ['validado', 'arquivado'].includes(i.comprovante?.status))
    .reduce((soma, i) => soma + formulario.value.valor * _qtd(i), 0)
})

const receitaEsperada = computed(() => {
  if (!formulario.value?.pago) return null
  return inscricoesDaForm.value
    .reduce((soma, i) => soma + formulario.value.valor * _qtd(i), 0)
})

const receitaPendente = computed(() => {
  if (receitaEsperada.value === null) return null
  return receitaEsperada.value - (receitaConfirmada.value ?? 0)
})

const TIPO_LABEL = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

const COMP_LABEL = {
  pendente:  'Pendente',
  validado:  'Validado',
  arquivado: 'Arquivado',
}

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function formatValorCompacto(valor) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 10_000)    return `R$ ${(valor / 1_000).toFixed(1).replace('.', ',')}k`
  return formatValor(valor)
}

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function labelAvancar(status) {
  if (status === 'pendente')  return 'Validar'
  if (status === 'validado')  return 'Arquivar'
  return null
}

function exportarCSV() {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`

  const colsFixas   = ['E-mail', 'Inscrito em']
  const colsCampos  = formulario.value.campos.map(c => c.label)
  const colsExtras  = []
  if (formulario.value.tipo === 'venda') colsExtras.push('Quantidade')
  if (formulario.value.pago)             colsExtras.push('Status do comprovante')

  const cols = [...colsFixas, ...colsCampos, ...colsExtras]

  const linhas = inscricoesDaForm.value.map(i => {
    const row = [
      i.userEmail,
      formatData(i.criadoEm),
      ...formulario.value.campos.map(c => i.respostas?.[c.id] ?? ''),
    ]
    if (formulario.value.tipo === 'venda') row.push(i.respostas?.__quantidade ?? '')
    if (formulario.value.pago)             row.push(i.comprovante?.status ?? 'sem comprovante')
    return row.map(esc).join(',')
  })

  const csv  = [cols.map(esc).join(','), ...linhas].join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `inscricoes-${formulario.value.titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function dadosInscrito(inscricao) {
  return usuarios.value.find(u => u.email === inscricao.userEmail) ?? null
}

function avancarStatus(inscricaoId, statusAtual) {
  const proximo = statusAtual === 'pendente' ? 'validado' : 'arquivado'
  updateStatusComprovante(inscricaoId, proximo)
}

// ── Editar ───────────────────────────────────────────────
const editando    = ref(false)
const editSalvo   = ref(false)
const editErrors  = ref({})
const editForm    = ref({ titulo: '', descricao: '', prazoInscricao: '', valor: '', limiteVagas: '' })

function abrirEdicao() {
  editForm.value = {
    titulo:          formulario.value.titulo,
    descricao:       formulario.value.descricao ?? '',
    prazoInscricao:  formulario.value.prazoInscricao ?? '',
    valor:           formulario.value.valor ?? '',
    limiteVagas:     formulario.value.limiteVagas ?? '',
  }
  editErrors.value = {}
  editando.value = true
}

function cancelarEdicao() {
  editando.value = false
  editErrors.value = {}
}

function salvarEdicao() {
  const e = {}
  if (!editForm.value.titulo.trim()) e.titulo = true
  if (formulario.value.pago && (!editForm.value.valor || Number(editForm.value.valor) <= 0)) e.valor = true
  editErrors.value = e
  if (Object.keys(e).length > 0) return

  updateFormulario(id, {
    titulo:         editForm.value.titulo.trim(),
    descricao:      editForm.value.descricao.trim(),
    prazoInscricao: editForm.value.prazoInscricao || null,
    ...(formulario.value.pago ? { valor: Number(editForm.value.valor) } : {}),
    limiteVagas: editForm.value.limiteVagas ? Number(editForm.value.limiteVagas) : null,
  })
  editando.value = false
  editSalvo.value = true
  setTimeout(() => { editSalvo.value = false }, 2500)
}

// ── Encerrar / reabrir ───────────────────────────────────
function encerrarFormulario() {
  updateFormulario(id, { status: 'encerrado' })
}

function reabrirFormulario() {
  updateFormulario(id, { status: 'aberto' })
}

// ── Excluir ──────────────────────────────────────────────
function excluirFormulario() {
  if (confirm('Tem certeza que deseja excluir este formulário? Todas as inscrições serão removidas permanentemente.')) {
    deleteFormulario(id)
    router.push('/admin/formularios')
  }
}
</script>

<template>
  <div class="page" v-if="formulario">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1%;font-size:1.4rem;opacity:0.28;">✦</div>

    <Navbar :admin="true" />

    <div class="page-content">
      <RouterLink to="/admin/formularios" class="back-link">← Voltar aos formulários</RouterLink>

      <!-- Cabeçalho do formulário -->
      <div class="paper paper-mb">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
          <span class="tipo-tag" :class="`tipo-${formulario.tipo}`">{{ TIPO_LABEL[formulario.tipo] }}</span>
          <span class="form-status-badge" :class="`form-status-${formulario.status}`">{{ formulario.status }}</span>
        </div>

        <h1 class="msg-title">{{ formulario.titulo }}</h1>
        <p style="font-size:0.93rem;color:var(--cinza);line-height:1.6;margin-bottom:1.2rem;">{{ formulario.descricao }}</p>

        <hr class="divider">

        <div class="msg-meta">
          <div class="msg-meta-item">
            <span class="msg-meta-label">Criado em:</span>
            {{ formatData(formulario.criadoEm) }}
          </div>
          <div v-if="formulario.prazoInscricao" class="msg-meta-item">
            <span class="msg-meta-label">Prazo:</span> {{ formatData(formulario.prazoInscricao) }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Pagamento:</span>
            {{ formulario.pago ? `Pago — ${formatValor(formulario.valor)}` : 'Gratuito' }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Campos:</span> {{ formulario.campos.length }}
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">
            {{ inscricoesDaForm.length }}<span v-if="formulario.limiteVagas" style="font-size:1.1rem;opacity:0.45;">/{{ formulario.limiteVagas }}</span>
          </div>
          <div class="stat-label">{{ formulario.limiteVagas ? 'Vagas' : 'Inscrições' }}</div>
        </div>
        <div class="stat-card stat-card--amarelo">
          <div class="stat-number stat-number--roxo">{{ comprovantesPendentes }}</div>
          <div class="stat-label">Comp. Pendentes</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--receita" v-if="receitaConfirmada !== null">
            {{ formatValorCompacto(receitaConfirmada) }}
          </div>
          <div class="stat-number" v-else style="font-size:1.3rem;color:var(--cinza);">Gratuito</div>
          <div class="stat-label">Receita confirmada</div>
          <template v-if="receitaEsperada !== null">
            <div style="margin-top:6px;font-size:0.74rem;color:var(--cinza);line-height:1.4;">
              <span v-if="receitaPendente > 0" style="color:var(--roxo);font-weight:600;">
                {{ formatValorCompacto(receitaPendente) }} pendente
              </span>
              <span v-if="receitaPendente > 0"> · </span>
              <span>{{ formatValorCompacto(receitaEsperada) }} total</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Formulário de edição -->
      <div v-if="editando" class="paper paper-mb">
        <h3 class="paper-subtitle">Editar informações</h3>
        <form @submit.prevent="salvarEdicao" novalidate>
          <div class="field-grid">
            <div class="field">
              <label>Título *</label>
              <input v-model="editForm.titulo" type="text" :class="{ invalid: editErrors.titulo }">
              <span class="error-msg">Preencha o título.</span>
            </div>
            <div class="field">
              <label>Prazo de inscrição</label>
              <input v-model="editForm.prazoInscricao" type="date">
            </div>
          </div>
          <div class="field">
            <label>Descrição</label>
            <textarea v-model="editForm.descricao" rows="3" style="min-height:80px;" />
          </div>
          <div class="field-grid">
            <div v-if="formulario.pago" class="field">
              <label>Valor (R$) *</label>
              <input v-model="editForm.valor" type="number" min="0.01" step="0.01" :class="{ invalid: editErrors.valor }">
              <span class="error-msg">Informe um valor válido.</span>
            </div>
            <div class="field">
              <label>Limite de submissões <span class="field-hint">(opcional)</span></label>
              <input v-model="editForm.limiteVagas" type="number" min="1" step="1" placeholder="Ilimitado">
            </div>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary btn-sm">Salvar alterações</button>
            <button type="button" class="btn btn-outline btn-sm" @click="cancelarEdicao">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Ações do formulário -->
      <div class="paper paper-mb">
        <h3 class="paper-subtitle">Ações</h3>

        <div v-if="editSalvo" class="alert-atendida" style="margin-bottom:1rem;">
          <span style="font-size:1.3rem;">✓</span>
          <div>
            <div class="alert-atendida-title">Alterações salvas</div>
          </div>
        </div>

        <!-- Emitir certificados (somente evento-com-certificado) -->
        <template v-if="formulario.tipo === 'evento-com-certificado'">
          <hr class="divider">
          <p class="label-sm" style="margin-bottom:0.6rem;">Certificados</p>
          <div v-if="formulario.certificadosEmitidos" class="alert-atendida" style="margin-bottom:0;">
            <span style="font-size:1.3rem;">✓</span>
            <div>
              <div class="alert-atendida-title">Certificados emitidos</div>
              <div class="alert-atendida-sub">em {{ formatData(formulario.certificadosEmitidosEm) }} para {{ inscricoesDaForm.length }} inscrito{{ inscricoesDaForm.length !== 1 ? 's' : '' }}</div>
            </div>
          </div>
          <template v-else>
            <p style="font-size:0.84rem;color:var(--cinza);margin-bottom:0.8rem;line-height:1.5;">
              Emite certificados de participação para todos os inscritos. A ação não pode ser desfeita.
            </p>
            <button
              class="btn btn-amarelo btn-sm"
              :disabled="inscricoesDaForm.length === 0"
              @click="emitirCertificados(formulario.id)"
            >Emitir certificados ({{ inscricoesDaForm.length }})</button>
          </template>
        </template>

        <hr class="divider">

        <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.5;">
          Campos personalizados não podem ser alterados após a criação. Encerrar o formulário impede novas inscrições sem excluir as existentes.
        </p>

        <div class="btn-row">
          <button class="btn btn-outline btn-sm" @click="abrirEdicao" :disabled="editando">
            Editar informações
          </button>
          <button
            v-if="formulario.status === 'aberto'"
            class="btn btn-outline btn-sm"
            @click="encerrarFormulario"
          >Encerrar formulário</button>
          <button
            v-else
            class="btn btn-outline btn-sm"
            @click="reabrirFormulario"
          >Reabrir formulário</button>
          <button class="btn btn-danger btn-sm" @click="excluirFormulario">Excluir</button>
        </div>
      </div>

      <!-- Lista de inscrições -->
      <div class="paper">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <p class="label-sm">Inscrições ({{ inscricoesDaForm.length }})</p>
          <button
            class="btn btn-outline btn-sm"
            :disabled="inscricoesDaForm.length === 0"
            @click="exportarCSV"
          >↓ Exportar CSV</button>
        </div>

        <div v-if="inscricoesDaForm.length === 0" class="empty-state" style="padding:1.5rem 0;">
          <p>Nenhuma inscrição recebida ainda.</p>
        </div>

        <div
          v-for="inscricao in inscricoesDaForm"
          :key="inscricao.id"
          class="inscricao-row"
        >
          <div class="inscricao-info">
            <div class="inscricao-nome">{{ dadosInscrito(inscricao)?.nome ?? inscricao.respostas?.nome ?? inscricao.userEmail }}</div>
            <div class="inscricao-meta">
              {{ inscricao.userEmail }}
              <template v-if="dadosInscrito(inscricao)?.matricula"> · {{ dadosInscrito(inscricao).matricula }}</template>
              · Inscrito em {{ formatData(inscricao.criadoEm) }}
            </div>
          </div>

          <div class="inscricao-actions">
            <template v-if="inscricao.comprovante">
              <span class="comp-badge" :class="`comp-${inscricao.comprovante.status}`">
                {{ COMP_LABEL[inscricao.comprovante.status] }}
              </span>
              <span
                v-if="inscricao.comprovante.status !== 'arquivado'"
                style="font-size:0.78rem;color:var(--cinza);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                :title="inscricao.comprovante.nome"
              >{{ inscricao.comprovante.nome }}</span>
              <button
                v-if="labelAvancar(inscricao.comprovante.status)"
                class="btn btn-outline btn-sm"
                @click="avancarStatus(inscricao.id, inscricao.comprovante.status)"
              >{{ labelAvancar(inscricao.comprovante.status) }}</button>
            </template>
            <span v-else style="font-size:0.82rem;color:var(--cinza);">Sem comprovante</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

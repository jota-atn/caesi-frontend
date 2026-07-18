<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import Modal from '../../components/Modal.vue'
import EmptyState from '../../components/EmptyState.vue'
import { formularios, inscricoes, updateStatusComprovante, updateFormulario, deleteFormulario, emitirCertificados, aprovarCancelamento, recusarCancelamento, type Inscricao, type StatusComprovante } from '../../stores/formularios.ts'
import { showToast } from '../../stores/toast.ts'
import { useEscapeKey } from '../../composables/useEscapeKey.ts'
import { usePagination } from '../../composables/usePagination.ts'
import Pagination from '../../components/Pagination.vue'

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

const cancelamentosPendentes = computed(() =>
  inscricoesDaForm.value.filter(i => i.cancelamento?.solicitado).length
)

const filtroInsc = ref('todos')
const buscaInsc  = ref('')

const inscricoesFiltradas = computed(() =>
  inscricoesDaForm.value.filter(i => {
    if (filtroInsc.value === 'pendente'     && i.comprovante?.status !== 'pendente')  return false
    if (filtroInsc.value === 'validado'     && i.comprovante?.status !== 'validado')  return false
    if (filtroInsc.value === 'arquivado'    && i.comprovante?.status !== 'arquivado') return false
    if (filtroInsc.value === 'cancelamento' && !i.cancelamento?.solicitado)           return false
    const t = buscaInsc.value.toLowerCase().trim()
    if (t) {
      const d = dadosInscrito(i)
      const nome = String(d?.nome ?? i.respostas?.nome ?? i.userEmail).toLowerCase()
      if (!nome.includes(t) && !(i.userEmail ?? '').toLowerCase().includes(t) && !String(d?.matricula ?? '').toLowerCase().includes(t)) return false
    }
    return true
  })
)

const { page: inscPage, totalPages: inscTotalPages, paginated: inscricoesPaginadas, next: inscNext, prev: inscPrev, goTo: inscGoTo } = usePagination(inscricoesFiltradas, 10)

function _qtd(i: Inscricao) {
  return formulario.value?.tipo === 'venda' ? (Number(i.respostas?.__quantidade) || 1) : 1
}

const receitaConfirmada = computed(() => {
  const form = formulario.value
  if (!form?.pago) return null
  return inscricoesDaForm.value
    .filter(i => (['validado', 'arquivado'] as const).includes(i.comprovante?.status as 'validado' | 'arquivado'))
    .reduce((soma, i) => soma + (form.valor ?? 0) * _qtd(i), 0)
})

const receitaEsperada = computed(() => {
  const form = formulario.value
  if (!form?.pago) return null
  return inscricoesDaForm.value
    .reduce((soma, i) => soma + (form.valor ?? 0) * _qtd(i), 0)
})

const receitaPendente = computed(() => {
  if (receitaEsperada.value === null) return null
  return receitaEsperada.value - (receitaConfirmada.value ?? 0)
})

const TIPOS_EVENTO = ['evento-com-certificado', 'evento-sem-certificado']
const ehTipoEvento = computed(() => TIPOS_EVENTO.includes(formulario.value?.tipo ?? ''))

const TIPO_LABEL: Record<string, string> = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

const COMP_LABEL: Record<StatusComprovante, string> = {
  pendente:  'Pendente',
  validado:  'Validado',
  arquivado: 'Arquivado',
}

function formatValor(valor: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0)
}

function formatValorCompacto(valor: number) {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (valor >= 10_000)    return `R$ ${(valor / 1_000).toFixed(1).replace('.', ',')}k`
  return formatValor(valor)
}

function formatData(data: string | null | undefined) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function labelAvancar(status: StatusComprovante) {
  if (status === 'pendente')  return 'Validar'
  if (status === 'validado')  return 'Arquivar'
  return null
}

function exportarCSV() {
  const form = formulario.value
  if (!form) return
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const colsFixas   = ['E-mail', 'Inscrito em']
  const colsCampos  = form.campos.map(c => c.label)
  const colsExtras  = []
  if (form.tipo === 'venda') colsExtras.push('Quantidade')
  if (form.pago)             colsExtras.push('Status do comprovante')

  const cols = [...colsFixas, ...colsCampos, ...colsExtras]

  const linhas = inscricoesDaForm.value.map(i => {
    const row: unknown[] = [
      i.userEmail,
      formatData(i.criadoEm),
      ...form.campos.map(c => i.respostas?.[c.id] ?? ''),
    ]
    if (form.tipo === 'venda') row.push(i.respostas?.__quantidade ?? '')
    if (form.pago)             row.push(i.comprovante?.status ?? 'sem comprovante')
    return row.map(esc).join(',')
  })

  const csv  = [cols.map(esc).join(','), ...linhas].join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `inscricoes-${form.titulo.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function dadosInscrito(inscricao: Inscricao) {
  return {
    nome:      inscricao.respostas?._nome      ?? inscricao.userEmail ?? '—',
    email:     inscricao.respostas?._email     ?? inscricao.userEmail ?? '—',
    matricula: inscricao.respostas?._matricula ?? null,
  }
}

function avancarStatus(inscricaoId: number, statusAtual: StatusComprovante) {
  const proximo = statusAtual === 'pendente' ? 'validado' : 'arquivado'
  updateStatusComprovante(inscricaoId, proximo)
  showToast(proximo === 'validado' ? 'Comprovante validado.' : 'Comprovante arquivado.', proximo === 'validado' ? 'success' : 'info')
}

// ── Editar ───────────────────────────────────────────────
const editando    = ref(false)
const editSalvo   = ref(false)
const editErrors  = ref<Record<string, boolean>>({})
const editForm    = ref({ titulo: '', descricao: '', prazoInscricao: '', dataEvento: '', valor: '' as string | number, limiteVagas: '' as string | number })

function abrirEdicao() {
  const form = formulario.value
  if (!form) return
  editForm.value = {
    titulo:          form.titulo,
    descricao:       form.descricao ?? '',
    prazoInscricao:  form.prazoInscricao ?? '',
    dataEvento:      form.dataEvento ?? '',
    valor:           form.valor ?? '',
    limiteVagas:     form.limiteVagas ?? '',
  }
  editErrors.value = {}
  editando.value = true
}

function cancelarEdicao() {
  editando.value = false
  editErrors.value = {}
}

function salvarEdicao() {
  const form = formulario.value
  if (!form) return
  const e: Record<string, boolean> = {}
  if (!editForm.value.titulo.trim()) e.titulo = true
  if (form.pago && (!editForm.value.valor || Number(editForm.value.valor) <= 0)) e.valor = true
  if (editForm.value.limiteVagas !== '' && Number(editForm.value.limiteVagas) < 1) e.limiteVagas = true
  editErrors.value = e
  if (Object.keys(e).length > 0) return

  updateFormulario(id, {
    titulo:         editForm.value.titulo.trim(),
    descricao:      editForm.value.descricao.trim(),
    prazoInscricao: editForm.value.prazoInscricao || null,
    dataEvento:     editForm.value.dataEvento || null,
    ...(form.pago ? { valor: Number(editForm.value.valor) } : {}),
    limiteVagas: editForm.value.limiteVagas ? Number(editForm.value.limiteVagas) : null,
  })
  editando.value = false
  editSalvo.value = true
  setTimeout(() => { editSalvo.value = false }, 2500)
}

// ── Cancelamento de inscrição (admin) ────────────────────
interface ModalCancelamento {
  inscricao: Inscricao
  acao: 'aprovar' | 'recusar'
}

const modalCancelamento = ref<ModalCancelamento | null>(null)
const msgCancelamento = ref('')

useEscapeKey(() => { if (modalCancelamento.value) modalCancelamento.value = null })

function abrirModalCancelamento(inscricao: Inscricao, acao: 'aprovar' | 'recusar') {
  msgCancelamento.value = ''
  modalCancelamento.value = { inscricao, acao }
}

function confirmarModalCancelamento() {
  if (!modalCancelamento.value) return
  const { inscricao, acao } = modalCancelamento.value
  if (acao === 'aprovar') {
    aprovarCancelamento(inscricao.id)
    showToast('Cancelamento aprovado. Aluno notificado.')
  } else {
    recusarCancelamento(inscricao.id)
    showToast('Solicitação recusada. Aluno notificado.', 'info')
  }
  modalCancelamento.value = null
  msgCancelamento.value = ''
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

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/formularios" label="Voltar aos formulários" />

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
          <div v-if="formulario.dataEvento" class="msg-meta-item">
            <span class="msg-meta-label">Data do evento:</span> {{ formatData(formulario.dataEvento) }}
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
              <span v-if="(receitaPendente ?? 0) > 0" style="color:var(--roxo);font-weight:600;">
                {{ formatValorCompacto(receitaPendente ?? 0) }} pendente
              </span>
              <span v-if="(receitaPendente ?? 0) > 0"> · </span>
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
          <div v-if="ehTipoEvento" class="field">
            <label>Data do evento <span class="field-hint">(opcional — adiciona ao calendário público)</span></label>
            <input v-model="editForm.dataEvento" type="date">
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
              <input v-model="editForm.limiteVagas" type="number" min="1" step="1" placeholder="Ilimitado" :class="{ invalid: editErrors.limiteVagas }">
              <span class="error-msg">O limite deve ser maior que zero.</span>
            </div>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary btn-sm">Salvar alterações</button>
            <button type="button" class="btn btn-outline btn-sm" @click="cancelarEdicao">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Ações do formulário -->
      <div class="paper paper-mb" :class="{ 'paper--meio': editando }">
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
      <div class="paper paper--fim">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <p class="label-sm" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            Inscrições ({{ inscricoesDaForm.length }})
            <span v-if="cancelamentosPendentes > 0" class="cancelamento-badge">
              {{ cancelamentosPendentes }} cancelamento{{ cancelamentosPendentes !== 1 ? 's' : '' }} pendente{{ cancelamentosPendentes !== 1 ? 's' : '' }}
            </span>
          </p>
          <button
            class="btn btn-outline btn-sm"
            :disabled="inscricoesDaForm.length === 0"
            @click="exportarCSV"
          >↓ Exportar CSV</button>
        </div>

        <div class="filter-bar" style="margin-bottom:0.8rem;" role="group" aria-label="Filtrar inscrições">
          <input v-model="buscaInsc" type="search" placeholder="Buscar por nome ou e-mail…">
          <button class="filter-btn" :class="{ active: filtroInsc === 'todos' }"        @click="filtroInsc = 'todos'">Todos</button>
          <template v-if="formulario.pago">
            <button class="filter-btn" :class="{ active: filtroInsc === 'pendente' }"   @click="filtroInsc = 'pendente'">Pendente</button>
            <button class="filter-btn" :class="{ active: filtroInsc === 'validado' }"   @click="filtroInsc = 'validado'">Validado</button>
            <button class="filter-btn" :class="{ active: filtroInsc === 'arquivado' }"  @click="filtroInsc = 'arquivado'">Arquivado</button>
          </template>
          <button class="filter-btn" :class="{ active: filtroInsc === 'cancelamento' }" @click="filtroInsc = 'cancelamento'">Cancelamento</button>
        </div>

        <EmptyState v-if="inscricoesDaForm.length === 0" title="Nenhuma inscrição recebida ainda." style="padding:1.5rem 0;" />
        <EmptyState v-else-if="inscricoesFiltradas.length === 0" title="Nenhum resultado para este filtro." style="padding:1.5rem 0;" />

        <div
          v-for="inscricao in inscricoesPaginadas"
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
            <div v-if="inscricao.cancelamento?.solicitado" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="cancelamento-badge">Cancelamento solicitado</span>
              <span v-if="inscricao.cancelamento.motivo" style="font-size:0.79rem;color:var(--cinza);font-style:italic;">
                "{{ inscricao.cancelamento.motivo }}"
              </span>
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
                v-if="labelAvancar(inscricao.comprovante.status) && !inscricao.cancelamento?.solicitado"
                class="btn btn-outline btn-sm"
                @click="avancarStatus(inscricao.id, inscricao.comprovante.status)"
              >{{ labelAvancar(inscricao.comprovante.status) }}</button>
            </template>
            <span v-else style="font-size:0.82rem;color:var(--cinza);">Sem comprovante</span>
            <template v-if="inscricao.cancelamento?.solicitado">
              <button class="btn btn-outline btn-sm" @click="abrirModalCancelamento(inscricao, 'recusar')">Recusar</button>
              <button class="btn btn-danger btn-sm" @click="abrirModalCancelamento(inscricao, 'aprovar')">Aprovar</button>
            </template>
          </div>
        </div>

        <Pagination :page="inscPage" :totalPages="inscTotalPages" @prev="inscPrev" @next="inscNext" @goto="inscGoTo" />
      </div>
    </div>
  </div>

  <!-- Modal: cancelamento de inscrição -->
  <Modal v-if="modalCancelamento" title-id="modal-admin-cancel-title" @close="modalCancelamento = null">
    <div class="modal-title" id="modal-admin-cancel-title">
      {{ modalCancelamento.acao === 'aprovar' ? 'Aprovar cancelamento' : 'Recusar solicitação' }}
    </div>
    <div class="modal-body">
      <p v-if="modalCancelamento.acao === 'aprovar'">
        Confirme o cancelamento e informe ao aluno como será feito o reembolso. A inscrição será removida.
      </p>
      <p v-else>
        A solicitação será recusada e o aluno será notificado. A inscrição continua ativa.
      </p>
      <div class="modal-contato">
        <div class="modal-contato-label">Contato do aluno</div>
        <div class="modal-contato-nome">{{ dadosInscrito(modalCancelamento.inscricao)?.nome ?? modalCancelamento.inscricao.userEmail }}</div>
        <div class="modal-contato-email">{{ modalCancelamento.inscricao.userEmail }}</div>
      </div>
      <div v-if="modalCancelamento.inscricao.cancelamento?.motivo" style="margin-top:10px;font-size:0.82rem;color:var(--cinza);">
        Motivo: <em>"{{ modalCancelamento.inscricao.cancelamento.motivo }}"</em>
      </div>
    </div>
    <div class="field" style="margin-bottom:1.2rem;">
      <label style="font-size:0.84rem;font-weight:600;margin-bottom:4px;display:block;">
        Mensagem para o aluno
        <span v-if="modalCancelamento.acao === 'recusar'" style="font-weight:400;color:var(--cinza);"> (opcional)</span>
        <span v-else style="color:var(--vermelho);"> *</span>
      </label>
      <textarea
        v-model="msgCancelamento"
        rows="3"
        :placeholder="modalCancelamento.acao === 'aprovar'
          ? 'Ex: Faremos o reembolso via PIX em até 5 dias úteis. Entre em contato pelo e-mail do CAESI informando seu PIX.'
          : 'Ex: O pagamento já foi processado e o reembolso não é possível neste momento.'"
        style="width:100%;min-height:76px;"
      />
      <p v-if="modalCancelamento.acao === 'aprovar'" style="font-size:0.77rem;color:var(--cinza);margin-top:4px;">
        Esta mensagem chegará como notificação ao aluno. Use-a para combinar o reembolso.
      </p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline btn-sm" @click="modalCancelamento = null">Cancelar</button>
      <button
        class="btn btn-sm"
        :class="modalCancelamento.acao === 'aprovar' ? 'btn-danger' : 'btn-primary'"
        :disabled="modalCancelamento.acao === 'aprovar' && !msgCancelamento.trim()"
        @click="confirmarModalCancelamento"
      >{{ modalCancelamento.acao === 'aprovar' ? 'Confirmar aprovação' : 'Confirmar recusa' }}</button>
    </div>
  </Modal>
</template>

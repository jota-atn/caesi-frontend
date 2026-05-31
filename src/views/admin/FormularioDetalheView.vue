<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes, updateStatusComprovante } from '../../stores/formularios.js'

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

const campoQtd = computed(() =>
  formulario.value?.campos?.find(c => c.isQuantidade) ?? null
)

const receitaConfirmada = computed(() => {
  if (!formulario.value?.pago) return null
  return inscricoesDaForm.value
    .filter(i => ['validado', 'arquivado'].includes(i.comprovante?.status))
    .reduce((soma, i) => {
      const qtd = campoQtd.value ? Number(i.respostas?.[campoQtd.value.id]) || 1 : 1
      return soma + formulario.value.valor * qtd
    }, 0)
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

function formatPrazo(prazo) {
  return new Date(prazo + 'T00:00:00').toLocaleDateString('pt-BR')
}

function labelAvancar(status) {
  if (status === 'pendente')  return 'Validar'
  if (status === 'validado')  return 'Arquivar'
  return null
}

function avancarStatus(inscricaoId, statusAtual) {
  const proximo = statusAtual === 'pendente' ? 'validado' : 'arquivado'
  updateStatusComprovante(inscricaoId, proximo)
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
            {{ new Date(formulario.criadoEm + 'T00:00:00').toLocaleDateString('pt-BR') }}
          </div>
          <div v-if="formulario.prazoInscricao" class="msg-meta-item">
            <span class="msg-meta-label">Prazo:</span> {{ formatPrazo(formulario.prazoInscricao) }}
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
          <div class="stat-number">{{ inscricoesDaForm.length }}</div>
          <div class="stat-label">Inscrições</div>
        </div>
        <div class="stat-card stat-card--amarelo">
          <div class="stat-number stat-number--roxo">{{ comprovantesPendentes }}</div>
          <div class="stat-label">Comp. Pendentes</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--receita" v-if="receitaConfirmada !== null">
            {{ formatValor(receitaConfirmada) }}
          </div>
          <div class="stat-number" v-else style="font-size:1.3rem;color:var(--cinza);">Gratuito</div>
          <div class="stat-label">Receita confirmada</div>
        </div>
      </div>

      <!-- Lista de inscrições -->
      <div class="paper">
        <p class="label-sm" style="margin-bottom:1rem;">
          Inscrições ({{ inscricoesDaForm.length }})
        </p>

        <div v-if="inscricoesDaForm.length === 0" class="empty-state" style="padding:1.5rem 0;">
          <p>Nenhuma inscrição recebida ainda.</p>
        </div>

        <div
          v-for="inscricao in inscricoesDaForm"
          :key="inscricao.id"
          class="inscricao-row"
        >
          <div class="inscricao-info">
            <div class="inscricao-nome">{{ inscricao.respostas.nome ?? '—' }}</div>
            <div class="inscricao-meta">
              {{ inscricao.userEmail }}
              · Inscrito em {{ new Date(inscricao.criadoEm + 'T00:00:00').toLocaleDateString('pt-BR') }}
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

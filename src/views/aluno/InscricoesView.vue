<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes, cancelarInscricaoDireta, solicitarCancelamento } from '../../stores/formularios.js'
import { user } from '../../stores/auth.js'

const TIPO_LABEL = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

const COMP_LABEL = {
  pendente:  'Aguardando validação',
  validado:  'Pagamento confirmado',
  arquivado: 'Confirmado',
}

function getFormulario(formularioId) {
  return formularios.value.find(f => f.id === formularioId) ?? null
}

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

const minhasInscricoes = computed(() =>
  inscricoes.value
    .filter(i => i.userEmail === user.value?.email)
    .slice()
    .reverse()
)

const pagamentosPendentes = computed(() =>
  minhasInscricoes.value.filter(i => i.comprovante?.status === 'pendente').length
)

// ── Cancelamento ─────────────────────────────────────────
function podeCancelarDireto(inscricao) {
  const f = getFormulario(inscricao.formularioId)
  if (!f || f.tipo === 'arrecadacao') return false
  if (f.pago) return false
  if (inscricao.cancelamento?.solicitado) return false
  if (inscricao.certificado) return false
  if (f.prazoInscricao && new Date(f.prazoInscricao + 'T23:59:59') < new Date()) return false
  return true
}

function podeSolicitar(inscricao) {
  const f = getFormulario(inscricao.formularioId)
  if (!f || f.tipo === 'arrecadacao') return false
  if (!f.pago) return false
  if (inscricao.cancelamento?.solicitado) return false
  if (inscricao.certificado) return false
  return true
}

const modalDireto = ref(null)
const modalSolicitar = ref(null)
const motivoSolicitar = ref('')

function abrirModalDireto(inscricao) {
  modalDireto.value = inscricao
}

function confirmarCancelamentoDireto() {
  if (!modalDireto.value) return
  cancelarInscricaoDireta(modalDireto.value.id)
  modalDireto.value = null
}

function abrirModalSolicitar(inscricao) {
  motivoSolicitar.value = ''
  modalSolicitar.value = inscricao
}

function confirmarSolicitar() {
  if (!modalSolicitar.value) return
  solicitarCancelamento(modalSolicitar.value.id, motivoSolicitar.value)
  modalSolicitar.value = null
  motivoSolicitar.value = ''
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Minhas <span>Inscrições</span></h2>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ minhasInscricoes.length }}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card stat-card--amarelo">
          <div class="stat-number stat-number--roxo">{{ pagamentosPendentes }}</div>
          <div class="stat-label">Pagamentos pendentes</div>
        </div>
        <div class="stat-card stat-card--verde">
          <div class="stat-number stat-number--verde">
            {{ minhasInscricoes.filter(i => !i.comprovante || ['validado','arquivado'].includes(i.comprovante.status)).length }}
          </div>
          <div class="stat-label">Confirmadas</div>
        </div>
      </div>

      <template v-for="inscricao in minhasInscricoes" :key="inscricao.id">
        <RouterLink
          :to="`/aluno/formularios/${inscricao.formularioId}`"
          class="form-card aberto"
          v-if="getFormulario(inscricao.formularioId)"
        >
          <div class="form-card-info">
            <div class="form-card-tags">
              <span class="tipo-tag" :class="`tipo-${getFormulario(inscricao.formularioId).tipo}`">
                {{ TIPO_LABEL[getFormulario(inscricao.formularioId).tipo] }}
              </span>
              <span v-if="inscricao.comprovante" class="comp-badge" :class="`comp-${inscricao.comprovante.status}`">
                {{ COMP_LABEL[inscricao.comprovante.status] }}
              </span>
              <span v-else class="comp-badge comp-validado">Gratuito</span>
              <span v-if="inscricao.cancelamento?.solicitado" class="cancelamento-badge">Cancelamento solicitado</span>
            </div>
            <div class="form-card-title">{{ getFormulario(inscricao.formularioId).titulo }}</div>
            <div class="form-card-meta">
              <span>Inscrito em {{ formatData(inscricao.criadoEm) }}</span>
              <template v-if="inscricao.comprovante && inscricao.comprovante.status !== 'arquivado'">
                <span>·</span>
                <span style="font-size:0.78rem;">{{ inscricao.comprovante.nome }}</span>
              </template>
            </div>
            <div v-if="inscricao.certificado" style="margin-top:8px;">
              <RouterLink
                :to="`/aluno/certificado/${inscricao.id}`"
                class="btn btn-amarelo btn-sm"
                style="text-decoration:none;display:inline-flex;"
                @click.stop
              >Ver certificado</RouterLink>
            </div>

            <!-- Cancelamento -->
            <div
              v-if="podeCancelarDireto(inscricao) || podeSolicitar(inscricao)"
              style="margin-top:10px;"
              @click.stop
            >
              <button
                v-if="podeCancelarDireto(inscricao)"
                class="btn btn-danger btn-sm"
                @click="abrirModalDireto(inscricao)"
              >Cancelar inscrição</button>
              <button
                v-else
                class="btn btn-outline btn-sm"
                @click="abrirModalSolicitar(inscricao)"
              >Solicitar cancelamento</button>
            </div>
          </div>
          <div class="form-card-right">
            <span class="msg-card-arrow">→</span>
          </div>
        </RouterLink>
      </template>

      <div v-if="minhasInscricoes.length === 0" class="empty-state">
        <p>Você ainda não se inscreveu em nenhum formulário.</p>
        <RouterLink to="/aluno/formularios" class="btn btn-amarelo btn-sm" style="margin-top:1rem;">
          Ver formulários disponíveis
        </RouterLink>
      </div>
    </div>
  </div>

  <!-- Modal: cancelamento direto -->
  <Teleport to="body">
    <div v-if="modalDireto" class="modal-overlay" @click.self="modalDireto = null">
      <div class="modal-box">
        <div class="modal-title">Cancelar inscrição</div>
        <div class="modal-body">
          <p>Tem certeza que deseja cancelar sua inscrição em <strong>{{ getFormulario(modalDireto.formularioId)?.titulo }}</strong>?</p>
          <p v-if="getFormulario(modalDireto.formularioId)?.limiteVagas" style="margin-top:8px;padding:8px 10px;background:rgba(210,80,40,0.08);border-radius:2px;border-left:3px solid #C04020;">
            Atenção: se houver limite de vagas, pode não haver disponibilidade caso queira se inscrever novamente.
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="modalDireto = null">Voltar</button>
          <button class="btn btn-danger btn-sm" @click="confirmarCancelamentoDireto">Confirmar cancelamento</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal: solicitar cancelamento (pago) -->
  <Teleport to="body">
    <div v-if="modalSolicitar" class="modal-overlay" @click.self="modalSolicitar = null">
      <div class="modal-box">
        <div class="modal-title">Solicitar cancelamento</div>
        <div class="modal-body">
          <p>Sua solicitação será analisada pela gestão do CAESI. Você será notificado da decisão.</p>
          <p style="margin-top:6px;">Para cancelamentos com reembolso, a gestão entrará em contato com as instruções de devolução.</p>
        </div>
        <div class="field" style="margin-bottom:1.2rem;">
          <label style="font-size:0.84rem;font-weight:600;margin-bottom:4px;display:block;">
            Motivo <span style="font-weight:400;color:var(--cinza);">(opcional)</span>
          </label>
          <textarea
            v-model="motivoSolicitar"
            rows="3"
            placeholder="Descreva o motivo da desistência..."
            style="width:100%;min-height:76px;"
          />
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="modalSolicitar = null">Voltar</button>
          <button class="btn btn-danger btn-sm" @click="confirmarSolicitar">Enviar solicitação</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

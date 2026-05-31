<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { formularios, inscricoes, addInscricao } from '../../stores/formularios.js'
import { user } from '../../stores/auth.js'

const route  = useRoute()
const router = useRouter()

const id = Number(route.params.id)
const formulario = computed(() => formularios.value.find(f => f.id === id))

if (!formulario.value) router.replace('/aluno/formularios')

const TIPO_LABEL = {
  'evento-com-certificado': 'Evento c/ Certificado',
  'evento-sem-certificado': 'Evento s/ Certificado',
  venda: 'Venda',
  arrecadacao: 'Arrecadação',
}

function prazoExpirado(prazo) {
  if (!prazo) return false
  return new Date(prazo + 'T23:59:59') < new Date()
}

const inscricoesDaForm = computed(() =>
  inscricoes.value.filter(i => i.formularioId === id).length
)

const vagasEsgotadas = computed(() =>
  formulario.value?.limiteVagas != null &&
  inscricoesDaForm.value >= formulario.value.limiteVagas
)

const disponivel = computed(() =>
  formulario.value?.status === 'aberto' &&
  !prazoExpirado(formulario.value?.prazoInscricao) &&
  !vagasEsgotadas.value
)

const motivoBloqueio = computed(() => {
  if (formulario.value?.status !== 'aberto') return 'Este formulário está encerrado.'
  if (prazoExpirado(formulario.value?.prazoInscricao)) return 'O prazo de inscrição já encerrou.'
  if (vagasEsgotadas.value) return 'As vagas para este formulário já foram preenchidas.'
  return null
})

const jaInscrito = computed(() =>
  inscricoes.value.some(i => i.formularioId === id && i.userEmail === user.value?.email)
)

function formatData(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

// ── Estado do formulário de resposta ────────────────────
function valorInicial(campo) {
  if (campo.tipo === 'checkbox') return false
  const label = campo.label.toLowerCase()
  if (label.includes('nome'))                              return user.value?.nome      ?? ''
  if (label.includes('matrícula') || label.includes('matricula')) return user.value?.matricula ?? ''
  if (label.includes('e-mail')    || label.includes('email'))     return user.value?.email     ?? ''
  return ''
}

const respostas = ref(
  Object.fromEntries(
    (formulario.value?.campos ?? []).map(c => [c.id, valorInicial(c)])
  )
)
const quantidade     = ref(1)
const comprovanteNome = ref('')
const fileInputRef   = ref(null)
const submitError    = ref('')

const totalEstimado = computed(() => {
  if (formulario.value?.tipo !== 'venda' || !formulario.value.pago) return null
  return formulario.value.valor * (Number(quantidade.value) || 0)
})

function onFileChange(e) {
  const file = e.target.files?.[0]
  comprovanteNome.value = file ? file.name : ''
}

function submitForm() {
  submitError.value = ''

  for (const campo of formulario.value.campos) {
    if (campo.obrigatorio) {
      const val = respostas.value[campo.id]
      if (val === '' || val === null || val === undefined || val === false) {
        submitError.value = `O campo "${campo.label}" é obrigatório.`
        return
      }
    }
  }

  if (formulario.value.tipo === 'venda' && (!quantidade.value || Number(quantidade.value) < 1)) {
    submitError.value = 'Informe uma quantidade válida.'
    return
  }

  if (formulario.value.pago && !comprovanteNome.value) {
    submitError.value = 'Anexe o comprovante de pagamento.'
    return
  }

  const todasRespostas = { ...respostas.value }
  if (formulario.value.tipo === 'venda') {
    todasRespostas.__quantidade = Number(quantidade.value)
  }

  const comprovante = formulario.value.pago
    ? { nome: comprovanteNome.value, url: null }
    : null

  const result = addInscricao(id, user.value.email, todasRespostas, comprovante)
  if (result.error) {
    submitError.value = result.error
    return
  }

  router.push('/aluno/inscricoes')
}
</script>

<template>
  <div class="page" v-if="formulario">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>

    <Navbar />

    <div class="page-content">
      <RouterLink to="/aluno/formularios" class="back-link">← Formulários e eventos</RouterLink>

      <!-- Cabeçalho -->
      <div class="paper paper-mb">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
          <span class="tipo-tag" :class="`tipo-${formulario.tipo}`">{{ TIPO_LABEL[formulario.tipo] }}</span>
          <span v-if="!disponivel" class="form-status-badge form-status-encerrado">
            {{ formulario.status === 'encerrado' ? 'Encerrado' : 'Prazo esgotado' }}
          </span>
        </div>

        <h1 class="msg-title">{{ formulario.titulo }}</h1>
        <p style="font-size:0.93rem;color:var(--cinza);line-height:1.6;margin-bottom:1.2rem;">{{ formulario.descricao }}</p>

        <hr class="divider">

        <div class="msg-meta">
          <div v-if="formulario.prazoInscricao" class="msg-meta-item">
            <span class="msg-meta-label">Prazo:</span> {{ formatData(formulario.prazoInscricao) }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Pagamento:</span>
            {{ formulario.pago ? formatValor(formulario.valor) + (formulario.tipo === 'venda' ? ' / unidade' : ' / pessoa') : 'Gratuito' }}
          </div>
          <div v-if="formulario.limiteVagas" class="msg-meta-item">
            <span class="msg-meta-label">Vagas:</span>
            <span :style="vagasEsgotadas ? 'color:var(--vermelho);font-weight:600;' : ''">
              {{ inscricoesDaForm }}/{{ formulario.limiteVagas }}
            </span>
          </div>
        </div>
      </div>

      <!-- Já inscrito -->
      <div v-if="jaInscrito" class="paper">
        <div class="alert-atendida">
          <span style="font-size:1.6rem;">✓</span>
          <div>
            <div class="alert-atendida-title">Você já está inscrito neste formulário</div>
            <div class="alert-atendida-sub">
              <RouterLink to="/aluno/inscricoes" style="color:var(--roxo-escuro);font-weight:600;">
                Ver minhas inscrições →
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Indisponível (encerrado / prazo / vagas) -->
      <div v-else-if="!disponivel" class="paper">
        <div class="alert-erro" style="margin-bottom:0;">
          {{ motivoBloqueio }}
        </div>
      </div>

      <!-- Formulário de resposta -->
      <div v-else class="paper">
        <p class="label-sm" style="margin-bottom:1.5rem;">Preencha os dados abaixo</p>

        <form @submit.prevent="submitForm" novalidate>

          <!-- Campo de quantidade (venda) -->
          <div v-if="formulario.tipo === 'venda'" class="field">
            <label>Quantidade *</label>
            <input v-model.number="quantidade" type="number" min="1" step="1" placeholder="1" style="max-width:120px;">
            <div v-if="totalEstimado !== null" class="total-estimado">
              <span class="total-estimado-label">Total estimado</span>
              <span class="total-estimado-valor">{{ formatValor(totalEstimado) }}</span>
            </div>
          </div>

          <!-- Campos dinâmicos -->
          <template v-for="campo in formulario.campos" :key="campo.id">
            <div class="field">
              <template v-if="campo.tipo === 'checkbox'">
                <label class="check-anon">
                  <input type="checkbox" v-model="respostas[campo.id]">
                  <span class="check-anon-label">
                    {{ campo.label }}
                    <span v-if="campo.obrigatorio" style="color:var(--vermelho);"> *</span>
                  </span>
                </label>
              </template>
              <template v-else>
                <label>
                  {{ campo.label }}
                  <span v-if="campo.obrigatorio" style="color:var(--vermelho);"> *</span>
                </label>
                <input
                  v-if="campo.tipo === 'texto'"
                  v-model="respostas[campo.id]"
                  type="text"
                  :placeholder="campo.label"
                >
                <input
                  v-else-if="campo.tipo === 'numero'"
                  v-model.number="respostas[campo.id]"
                  type="number"
                >
                <select v-else-if="campo.tipo === 'select'" v-model="respostas[campo.id]">
                  <option value="" disabled>Selecione...</option>
                  <option v-for="op in campo.opcoes" :key="op" :value="op">{{ op }}</option>
                </select>
              </template>
            </div>
          </template>

          <!-- Upload de comprovante (formulários pagos) -->
          <div v-if="formulario.pago" class="field">
            <label>Comprovante de pagamento *</label>
            <input ref="fileInputRef" type="file" accept="image/*,.pdf" style="display:none;" @change="onFileChange">
            <div
              class="comprovante-area"
              :class="{ 'has-file': comprovanteNome }"
              @click="fileInputRef.click()"
            >
              <template v-if="comprovanteNome">
                <div class="comprovante-filename">{{ comprovanteNome }}</div>
                <p>Clique para trocar o arquivo</p>
              </template>
              <template v-else>
                <p style="margin-bottom:4px;">Clique para anexar o comprovante</p>
                <p style="font-size:0.78rem;">Imagem ou PDF</p>
              </template>
            </div>
          </div>

          <div v-if="submitError" class="alert-erro">{{ submitError }}</div>

          <div class="btn-row" style="margin-top:1.5rem;">
            <button type="submit" class="btn btn-amarelo">
              {{ formulario.pago ? 'Enviar inscrição e comprovante' : 'Confirmar inscrição' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

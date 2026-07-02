<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { mensagens } from '../stores/mensagens.js'

const route    = useRoute()
const input    = ref('')
const resultado = ref(null)
const naoEncontrado = ref(false)

const tipoLabel = {
  disciplina:     'Disciplina',
  professores:    'Professores',
  colegas:        'Colegas de curso',
  infraestrutura: 'Infraestrutura',
  ofertas:        'Ofertas e horários',
  grupos:         'Grupos estudantis',
  outros:         'Outros',
}

const statusLabel = {
  pendente:      'Pendente',
  em_andamento:  'Em andamento',
  atendida:      'Atendida',
}

const statusClass = {
  pendente:     'badge badge-pendente',
  em_andamento: 'badge badge-info',
  atendida:     'badge badge-atendida',
}

function consultar() {
  naoEncontrado.value = false
  resultado.value = null
  const protocolo = input.value.trim()
  if (!protocolo) return
  const found = mensagens.value.find(
    m => m.protocolo.toLowerCase() === protocolo.toLowerCase()
  )
  if (found) {
    resultado.value = found
  } else {
    naoEncontrado.value = true
  }
}

onMounted(() => {
  if (route.query.protocolo) {
    input.value = route.query.protocolo
    consultar()
  }
})
</script>

<template>
  <div class="page">
    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Consultar <span>protocolo</span></h2>
      </div>

      <div class="paper paper-mb-lg">
        <p class="consulta-intro">
          Digite o número de protocolo recebido ao enviar sua mensagem.
        </p>
        <form class="consulta-form" @submit.prevent="consultar">
          <input
            v-model="input"
            type="text"
            class="consulta-input"
            placeholder="#2025-1234"
            autocomplete="off"
            spellcheck="false"
          />
          <button type="submit" class="btn btn-primary">Consultar</button>
        </form>
      </div>

      <!-- Não encontrado -->
      <div v-if="naoEncontrado" class="alert-erro">
        Protocolo não encontrado. Verifique o número e tente novamente.
      </div>

      <!-- Resultado -->
      <div v-if="resultado" class="paper">
        <div class="consulta-header">
          <div class="protocolo-box">
            <div class="protocolo-label">Protocolo</div>
            <div class="protocolo-value">{{ resultado.protocolo }}</div>
          </div>
          <span :class="statusClass[resultado.status]">
            {{ statusLabel[resultado.status] }}
          </span>
        </div>

        <hr class="divider">

        <div class="msg-meta">
          <div class="msg-meta-item">
            <span class="msg-meta-label">Data</span><br>{{ resultado.data }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Tipo de relato</span><br>{{ tipoLabel[resultado.tipo] ?? resultado.tipo }}
          </div>
          <div v-if="resultado.periodo" class="msg-meta-item">
            <span class="msg-meta-label">Período</span><br>{{ resultado.periodo }}
          </div>
        </div>

        <p class="label-sm" style="margin-bottom:8px;">Mensagem enviada</p>
        <div class="msg-body">{{ resultado.corpo }}</div>

        <!-- Resposta do CAESI -->
        <template v-if="resultado.resposta">
          <div class="alert-resposta" style="margin-top:1.5rem;">
            <p class="label-sm" style="margin-bottom:10px;color:var(--roxo-escuro);">Resposta do CAESI</p>
            <div style="font-size:0.93rem;line-height:1.7;color:var(--preto);white-space:pre-wrap;">{{ resultado.resposta }}</div>
          </div>
        </template>

        <template v-else>
          <div class="alert-info" style="margin-top:1.5rem;margin-bottom:0;">
            <strong>Aguardando resposta.</strong>
            A equipe do CAESI ainda não respondeu esta mensagem.
            {{ resultado.status === 'pendente' ? 'Ela está na fila de atendimento.' : 'Está sendo analisada.' }}
          </div>
        </template>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.consulta-intro {
  font-size: 0.9rem;
  color: var(--cinza);
  margin-bottom: 1.2rem;
  line-height: 1.6;
}

.consulta-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.consulta-input {
  flex: 1;
  min-width: 180px;
  padding: 10px 14px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 1rem;
  color: var(--preto);
  letter-spacing: 0.06em;
  outline: none;
  transition: border-color 0.2s;
}
.consulta-input:focus { border-color: var(--roxo); }

.consulta-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

@media (max-width: 480px) {
  .consulta-form { flex-direction: column; }
  .consulta-form .btn { width: 100%; justify-content: center; }
}
</style>

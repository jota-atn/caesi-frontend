<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { mensagens, addComplemento } from '../stores/mensagens.js'

const route    = useRoute()
const input    = ref('')
const resultado = ref(null)
const naoEncontrado = ref(false)
const complementoTexto = ref('')
const complementoEnviado = ref(false)

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
  complementoTexto.value = ''
  complementoEnviado.value = false
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

function enviarComplemento() {
  const texto = complementoTexto.value.trim()
  if (!texto || !resultado.value) return
  addComplemento(resultado.value.id, texto)
  resultado.value = mensagens.value.find(m => m.id === resultado.value.id)
  complementoTexto.value = ''
  complementoEnviado.value = true
  setTimeout(() => { complementoEnviado.value = false }, 2500)
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
      <BackLink to="/" style="margin-bottom:1.2rem;" />
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

        <!-- Complementos já enviados -->
        <template v-if="resultado.complementos?.length">
          <hr class="divider" style="margin-top:1.5rem;">
          <p class="label-sm" style="margin-bottom:10px;">Informações adicionadas por você</p>
          <div class="complementos-lista">
            <div v-for="(c, i) in resultado.complementos" :key="i" class="complemento-item">
              <div class="complemento-data">{{ c.data }}</div>
              <div class="complemento-texto">{{ c.texto }}</div>
            </div>
          </div>
        </template>

        <!-- Adicionar complemento -->
        <template v-if="resultado.status !== 'atendida'">
          <hr class="divider" style="margin-top:1.5rem;">
          <p class="label-sm" style="margin-bottom:4px;">Adicionar mais informações</p>
          <p style="font-size:0.78rem;color:var(--cinza);margin-bottom:0.8rem;">
            Esqueceu de contar algo? Complemente seu relato sem perder o protocolo.
          </p>
          <div v-if="complementoEnviado" class="alert-atendida">
            <span style="font-size:1.2rem;">✓</span>
            <div class="alert-atendida-title">Complemento enviado!</div>
          </div>
          <form v-else class="field" style="margin-bottom:0;" @submit.prevent="enviarComplemento">
            <textarea v-model="complementoTexto" rows="3" maxlength="1000" placeholder="Escreva a informação adicional…"></textarea>
            <div class="btn-row" style="margin-top:0.6rem;">
              <button type="submit" class="btn btn-outline btn-sm" :disabled="!complementoTexto.trim()">Enviar complemento</button>
            </div>
          </form>
        </template>
        <template v-else>
          <p style="font-size:0.78rem;color:var(--cinza);margin-top:1.2rem;">
            Este ticket já foi atendido. Se for algo novo, abra um novo relato.
          </p>
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

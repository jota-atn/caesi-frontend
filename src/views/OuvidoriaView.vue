<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'
import { addMensagem, mensagens, addComplemento, type Mensagem, type StatusMensagem } from '../stores/mensagens.ts'
import { isAdmin } from '../stores/auth.ts'
import { isEmail } from '../utils/validation.ts'

const route = useRoute()

// ── Envio de ticket ──────────────────────────────────────────
const form = ref({ tipo: '', periodo: '', mensagem: '', nome: '', email: '' })
const errors = ref<Record<string, boolean>>({})
const charCount = ref(0)
const enviado = ref(false)
const protocolo = ref('')
const emailEnviado = ref(false)

function onInput(e: Event) {
  charCount.value = (e.target as HTMLTextAreaElement).value.length
}

function submit() {
  const e: Record<string, boolean> = {}
  if (!form.value.tipo)                       e.tipo = true
  if (!form.value.periodo.trim())             e.periodo = true
  if (form.value.mensagem.trim().length < 20) e.mensagem = true
  if (form.value.email.trim() && !isEmail(form.value.email)) e.email = true
  errors.value = e
  if (Object.keys(e).length === 0) {
    const nova = addMensagem({
      tipo:    form.value.tipo,
      periodo: form.value.periodo.trim(),
      corpo:   form.value.mensagem,
      nome:    form.value.nome.trim() || null,
      email:   form.value.email.trim() || null,
    })
    protocolo.value = nova.protocolo
    emailEnviado.value = !!form.value.email.trim()
    enviado.value = true
  }
}

function resetForm() {
  form.value = { tipo: '', periodo: '', mensagem: '', nome: '', email: '' }
  charCount.value = 0
  enviado.value = false
  emailEnviado.value = false
}

// ── Consultar protocolo (busca simples, embutida na página) ──
const protocoloBusca = ref('')
const resultado = ref<Mensagem | null>(null)
const naoEncontrado = ref(false)
const campoVazio = ref(false)
const complementoTexto = ref('')
const complementoEnviado = ref(false)

const tipoLabel: Record<string, string> = {
  disciplina:     'Disciplina',
  professores:    'Professores',
  colegas:        'Colegas de curso',
  infraestrutura: 'Infraestrutura',
  ofertas:        'Ofertas e horários',
  grupos:         'Grupos estudantis',
  outros:         'Outros',
}

const statusLabel: Record<StatusMensagem, string> = {
  pendente:      'Pendente',
  atendida:      'Atendida',
}

const statusClass: Record<StatusMensagem, string> = {
  pendente:     'badge badge-pendente',
  atendida:     'badge badge-atendida',
}

function consultar() {
  naoEncontrado.value = false
  resultado.value = null
  complementoTexto.value = ''
  complementoEnviado.value = false
  const p = protocoloBusca.value.trim()
  campoVazio.value = !p
  if (!p) return
  const found = mensagens.value.find(
    m => m.protocolo.toLowerCase() === p.toLowerCase()
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
  resultado.value = mensagens.value.find(m => m.id === resultado.value!.id) ?? null
  complementoTexto.value = ''
  complementoEnviado.value = true
  setTimeout(() => { complementoEnviado.value = false }, 2500)
}

function consultarStatusDoTicket(p: string) {
  protocoloBusca.value = p
  consultar()
  document.getElementById('ouvidoria-topo')?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  if (route.query.protocolo) {
    protocoloBusca.value = String(route.query.protocolo)
    consultar()
  }
})
</script>

<template>
  <div class="page">
    <Navbar />

    <div class="home-section" id="ouvidoria-topo" style="padding-top:2rem; scroll-margin-top:80px;">
      <div class="ouvidoria-topo-row">
        <BackLink to="/" />
        <RouterLink v-if="isAdmin" to="/admin/ouvidoria" class="btn btn-outline btn-outline-creme btn-sm">
          Gerenciar tickets →
        </RouterLink>
      </div>

      <div class="ouvidoria-intro">
        <div class="section-label">Ouvidoria</div>
        <h1 class="section-title">CAESI <span>Ouvidoria</span></h1>
        <div class="ouvidoria-divider"></div>
        <p class="ouvidoria-sub">
          Fale com o Centro Acadêmico de Ciência da Computação da UFCG.
          Envie sugestões, reclamações e elogios de forma anônima.
        </p>
      </div>

      <div class="ouvidoria-busca">
        <input
          v-model="protocoloBusca" type="text"
          placeholder="Digite seu nº de protocolo…"
          class="ouvidoria-busca-input"
          autocomplete="off" spellcheck="false"
          @input="campoVazio = false; naoEncontrado = false"
          @keyup.enter="consultar"
        >
        <button type="button" class="btn btn-outline" @click="consultar">Consultar</button>
      </div>

      <div v-if="campoVazio" class="alert-erro" style="margin-top:1rem;">
        Informe um número de protocolo.
      </div>
      <div v-if="naoEncontrado" class="alert-erro" style="margin-top:1rem;">
        Protocolo não encontrado. Verifique o número e tente novamente.
      </div>

      <div v-if="resultado" class="paper" style="margin-top:1.5rem;">
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

        <div v-if="resultado.status !== 'atendida'" class="alert-info" style="margin-top:1.5rem;margin-bottom:0;">
          <strong>Em análise.</strong> Seu relato está na fila de atendimento do CAESI.
        </div>

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

    <!-- Como funciona -->
    <section class="home-section">
      <div class="section-label">Ouvidoria</div>
      <h2 class="section-title">Como <span>funciona</span></h2>
      <div class="steps-grid">
        <div class="step-card">
          <span class="step-number">1</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </span>
          <div class="step-title">Escreva sua mensagem</div>
          <p class="step-desc">Preencha o formulário abaixo com o assunto, categoria e detalhes do que aconteceu.</p>
        </div>
        <div class="step-card">
          <span class="step-number">2</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </span>
          <div class="step-title">O CAESI recebe</div>
          <p class="step-desc">Nossa equipe lê e analisa cada mensagem com atenção. Você recebe um número de protocolo.</p>
        </div>
        <div class="step-card">
          <span class="step-number">3</span>
          <span class="step-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </span>
          <div class="step-title">Acompanhe o status</div>
          <p class="step-desc">Use o número de protocolo pra consultar o andamento do seu relato a qualquer momento.</p>
        </div>
      </div>
    </section>

    <!-- Formulário de envio -->
    <section class="home-section" id="enviar" style="scroll-margin-top:80px;">
      <div class="section-label">Envio direto</div>
      <h2 class="section-title">Enviar <span>mensagem</span></h2>

      <div class="paper">

        <div v-if="enviado" class="anon-success">
          <div class="check-circle">✓</div>
          <h3 style="font-family:'Archivo Black',sans-serif;font-size:1.3rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
            Ticket enviado!
          </h3>
          <p style="font-size:0.9rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.6;">
            Guarde o protocolo abaixo para acompanhar o andamento do seu relato.
            <template v-if="emailEnviado"> O protocolo também será enviado para o seu e-mail.</template>
          </p>
          <div class="protocolo-box">
            <div class="protocolo-label">Protocolo</div>
            <div class="protocolo-value">{{ protocolo }}</div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:1.2rem;">
            <button type="button" class="btn btn-primary btn-sm" @click="consultarStatusDoTicket(protocolo)">Consultar status →</button>
            <button class="btn btn-outline btn-sm" @click="resetForm">Enviar outro ticket</button>
          </div>
        </div>

        <div v-else-if="isAdmin" class="admin-no-msg">
          <div>
            <p class="admin-no-msg-title">Administradores não enviam tickets pela ouvidoria.</p>
            <p class="admin-no-msg-sub">Use o painel para gerenciar os tickets recebidos.</p>
          </div>
          <RouterLink to="/admin/ouvidoria" class="btn btn-outline btn-sm">
            Ir ao painel →
          </RouterLink>
        </div>

        <template v-else>
          <div class="alert-info">
            A identificação é <strong style="color:var(--roxo-escuro);">opcional</strong>.
            Após o envio você receberá um número de protocolo para acompanhar o status do seu relato.
          </div>

          <form @submit.prevent="submit" novalidate>
            <div class="field">
              <label>Tipo de relato *</label>
              <select v-model="form.tipo" :class="{ invalid: errors.tipo }">
                <option value="" disabled>Selecione o tipo de relato</option>
                <option value="disciplina">Disciplina</option>
                <option value="professores">Professores</option>
                <option value="colegas">Colegas de curso</option>
                <option value="infraestrutura">Infraestrutura</option>
                <option value="ofertas">Ofertas e horários</option>
                <option value="grupos">Grupos estudantis</option>
                <option value="outros">Outros</option>
              </select>
              <span class="error-msg" role="alert">Selecione o tipo de relato.</span>
            </div>

            <div class="field">
              <label>
                Período em que ocorreu *
                <span class="field-hint">(ex.: 2025.2)</span>
              </label>
              <input v-model="form.periodo" type="text" placeholder="Ex.: 2025.2" maxlength="20"
                :class="{ invalid: errors.periodo }">
              <span class="error-msg" role="alert">Informe o período em que o problema ocorreu.</span>
            </div>

            <div class="field">
              <label>
                Mensagem *
                <span class="field-hint">(mín. 20 caracteres)</span>
              </label>
              <textarea
                v-model="form.mensagem"
                placeholder="Descreva com detalhes o que aconteceu ou o que você sugere…"
                rows="5"
                maxlength="2000"
                :class="{ invalid: errors.mensagem }"
                @input="onInput"
              ></textarea>
              <span class="error-msg" role="alert">
                {{ form.mensagem.trim().length === 0 ? 'A mensagem não pode estar vazia.' : 'Mínimo 20 caracteres.' }}
              </span>
              <div class="char-counter" :class="{ warn: charCount > 1800 }">{{ charCount }} / 2000</div>
            </div>

            <div class="field-section">
              <p class="label-sm">Identificação <span class="field-hint" style="font-size:0.8rem;text-transform:none;letter-spacing:0;">(opcional)</span></p>
              <p style="font-size:0.82rem;color:var(--cinza);margin-bottom:1rem;line-height:1.6;">
                Se identificado, o CAESI sabe quem enviou o relato. De todo modo, use o número de protocolo pra acompanhar o status quando quiser.
              </p>
              <div class="ident-row">
                <div class="field">
                  <label>Nome</label>
                  <input v-model="form.nome" type="text" placeholder="Seu nome completo" maxlength="100">
                </div>
                <div class="field">
                  <label>E-mail</label>
                  <input v-model="form.email" type="email" placeholder="seu@email.com" :class="{ invalid: errors.email }">
                  <span class="error-msg" role="alert">Informe um e-mail válido.</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-amarelo">Enviar ticket →</button>
            </div>
          </form>
        </template>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.ouvidoria-topo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.ouvidoria-topo-row :deep(.back-link) { margin-bottom: 0; }

.ouvidoria-intro {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ouvidoria-intro .section-title {
  margin-bottom: 0;
}

.ouvidoria-divider {
  width: 48px;
  height: 4px;
  background: var(--amarelo);
  border-radius: 2px;
  margin: 1rem 0;
}

#ouvidoria-topo .alert-erro {
  background: var(--vermelho);
  border: none;
  color: var(--creme);
  font-weight: 800;
  box-shadow: 3px 3px 0 var(--roxo-escuro);
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}

.ouvidoria-sub {
  font-size: 0.95rem;
  color: rgba(242,230,196,0.8);
  max-width: 560px;
  line-height: 1.6;
  margin-bottom: 1.8rem;
}

.ouvidoria-busca {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 520px;
  margin: 0 auto;
}

.ouvidoria-busca-input {
  flex: 1;
  min-width: 220px;
  padding: 10px 14px;
  background: var(--branco);
  border: 2px solid var(--creme-escuro);
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 1rem;
  color: var(--preto);
  letter-spacing: 0.04em;
  outline: none;
  transition: border-color 0.2s;
}
.ouvidoria-busca-input:focus { border-color: var(--roxo); }

.consulta-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

@media (max-width: 480px) {
  .ouvidoria-busca { flex-direction: column; }
  .ouvidoria-busca .btn { width: 100%; justify-content: center; }
}
</style>

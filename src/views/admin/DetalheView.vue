<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import BackLink from '../../components/BackLink.vue'
import Badge from '../../components/Badge.vue'
import Tag from '../../components/Tag.vue'
import { mensagens, updateStatus, updateNota, updateResposta, deleteMensagem } from '../../stores/mensagens.js'

const TIPO_LABEL = {
  disciplina:     'Disciplina',
  professores:    'Professores',
  colegas:        'Colegas de curso',
  infraestrutura: 'Infraestrutura',
  ofertas:        'Ofertas e horários',
  grupos:         'Grupos estudantis',
  outros:         'Outros',
}

const route = useRoute()
const router = useRouter()

const id = Number(route.params.id)
const mensagem = computed(() => mensagens.value.find(m => m.id === id))

if (!mensagem.value) router.replace('/admin/mensagens')

const status   = ref(mensagem.value?.status ?? 'pendente')
const nota     = ref(mensagem.value?.nota ?? '')
const resposta = ref(mensagem.value?.resposta ?? '')
const notaSalva     = ref(false)
const respostaSalva = ref(false)
const emailAberto   = ref(false)
const emailAssunto  = ref('')
const emailCorpo    = ref('')
const emailEnviado  = ref(false)
const notifEmailMsg = ref('')

const atendida = computed(() => status.value === 'atendida')

function mostrarNotifEmail(texto) {
  notifEmailMsg.value = texto
  setTimeout(() => { notifEmailMsg.value = '' }, 3500)
}

function marcarAtendida() {
  status.value = 'atendida'
  updateStatus(id, 'atendida')
  if (mensagem.value?.email) {
    mostrarNotifEmail(`E-mail de notificação enviado para ${mensagem.value.email}`)
  }
}

function desfazer() {
  status.value = 'pendente'
  updateStatus(id, 'pendente')
}

function salvarNota() {
  updateNota(id, nota.value)
  notaSalva.value = true
  setTimeout(() => { notaSalva.value = false }, 2000)
}

function salvarResposta() {
  updateResposta(id, resposta.value)
  respostaSalva.value = true
  setTimeout(() => { respostaSalva.value = false }, 2000)
  if (resposta.value.trim() && mensagem.value?.email) {
    mostrarNotifEmail(`E-mail de notificação enviado para ${mensagem.value.email}`)
  }
}

function enviarEmail() {
  emailEnviado.value = true
  emailAberto.value = false
  emailAssunto.value = ''
  emailCorpo.value = ''
  setTimeout(() => { emailEnviado.value = false }, 3000)
}

function confirmarExcluir() {
  if (confirm('Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.')) {
    deleteMensagem(id)
    router.push('/admin/mensagens')
  }
}
</script>

<template>
  <div class="page" v-if="mensagem">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.38;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1%;font-size:1.4rem;opacity:0.28;">✦</div>

    <Navbar />

    <div class="page-content">
      <BackLink to="/admin/mensagens" label="Voltar ao painel" />

      <div class="paper paper-mb">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;flex-wrap:wrap;gap:8px;">
          <Tag :tipo="mensagem.tipo" />
          <Badge :status="status" />
        </div>

        <h1 class="msg-title">{{ TIPO_LABEL[mensagem.tipo] ?? mensagem.tipo }}</h1>

        <div class="msg-meta">
          <div class="msg-meta-item">
            <span class="msg-meta-label">Remetente:</span> {{ mensagem.nome ?? 'Anônimo' }}
          </div>
          <div v-if="mensagem.periodo" class="msg-meta-item">
            <span class="msg-meta-label">Período:</span> {{ mensagem.periodo }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Data:</span> {{ mensagem.data }}
          </div>
          <div class="msg-meta-item">
            <span class="msg-meta-label">Protocolo:</span> {{ mensagem.protocolo }}
          </div>
        </div>

        <hr class="divider">

        <p class="label-sm" style="margin-bottom:10px;">Mensagem</p>
        <div class="msg-body">{{ mensagem.corpo }}</div>

        <template v-if="mensagem.complementos?.length">
          <hr class="divider" style="margin-top:1.2rem;">
          <p class="label-sm" style="margin-bottom:10px;">
            Complementos do remetente
            <span style="font-size:0.72rem;color:var(--cinza);text-transform:none;letter-spacing:0;font-weight:400;">
              — adicionados depois do envio original
            </span>
          </p>
          <div class="complementos-lista">
            <div v-for="(c, i) in mensagem.complementos" :key="i" class="complemento-item">
              <div class="complemento-data">{{ c.data }}</div>
              <div class="complemento-texto">{{ c.texto }}</div>
            </div>
          </div>
        </template>
      </div>

      <div class="paper paper-mb">
        <div class="internal-note">
          <div class="internal-note-label">
            Anotação interna
            <span style="font-size:0.72rem;color:var(--cinza);text-transform:none;letter-spacing:0;font-weight:400;">
              — visível apenas para membros do CAESI
            </span>
          </div>
          <textarea v-model="nota" placeholder="Registre o que foi feito, próximos passos, quem ficou responsável…"></textarea>
        </div>
        <div class="save-row">
          <button
            class="btn btn-outline btn-sm"
            :style="notaSalva ? 'background:var(--verde);color:white;border-color:var(--verde);' : ''"
            @click="salvarNota"
          >{{ notaSalva ? '✓ Salvo' : 'Salvar anotação' }}</button>
        </div>
      </div>

      <!-- Contato direto por e-mail -->
      <div v-if="mensagem.email" class="paper paper-mb">
        <p class="label-sm" style="margin-bottom:4px;">Contato direto</p>
        <p style="font-size:0.76rem;color:var(--cinza);margin-bottom:1rem;">
          Enviar e-mail para
          <strong style="color:var(--preto);">{{ mensagem.nome ?? 'remetente' }}</strong>
          — {{ mensagem.email }}
        </p>

        <div v-if="emailEnviado" class="alert-atendida">
          <span style="font-size:1.3rem;">✓</span>
          <div class="alert-atendida-title">E-mail enviado!</div>
        </div>

        <template v-else>
          <button v-if="!emailAberto" class="btn btn-outline btn-sm" @click="emailAberto = true">
            Enviar e-mail
          </button>

          <div v-else>
            <div class="field" style="margin-bottom:0.8rem;">
              <label class="label-sm">Assunto</label>
              <input v-model="emailAssunto" type="text" placeholder="Ex.: Retorno sobre sua mensagem — {{ mensagem.protocolo }}">
            </div>
            <div class="field" style="margin-bottom:0.8rem;">
              <label class="label-sm">Mensagem</label>
              <textarea v-model="emailCorpo" rows="4" placeholder="Escreva o conteúdo do e-mail…"></textarea>
            </div>
            <div class="btn-row">
              <button class="btn btn-amarelo btn-sm" @click="enviarEmail">Enviar</button>
              <button class="btn btn-outline btn-sm" @click="emailAberto = false; emailAssunto = ''; emailCorpo = ''">Cancelar</button>
            </div>
          </div>
        </template>
      </div>

      <!-- Resposta pública -->
      <div class="paper paper-mb">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.8rem;flex-wrap:wrap;gap:8px;">
          <div>
            <p class="label-sm">Resposta pública</p>
            <p style="font-size:0.76rem;color:var(--cinza);margin-top:2px;">
              Visível ao remetente ao consultar o protocolo
            </p>
          </div>
        </div>
        <textarea
          v-model="resposta"
          placeholder="Escreva uma resposta para o remetente…"
          rows="4"
          class="internal-note textarea"
          style="width:100%;padding:10px 12px;background:var(--branco);border:2px solid var(--creme-escuro);border-radius:2px;font-family:'Archivo',sans-serif;font-size:0.9rem;color:var(--preto);resize:vertical;outline:none;transition:border-color 0.2s;"
          @focus="$event.target.style.borderColor='var(--roxo)'"
          @blur="$event.target.style.borderColor='var(--creme-escuro)'"
        ></textarea>
        <div class="save-row">
          <button
            class="btn btn-outline btn-sm"
            :style="respostaSalva ? 'background:var(--verde);color:white;border-color:var(--verde);' : ''"
            @click="salvarResposta"
          >{{ respostaSalva ? '✓ Salvo' : 'Salvar resposta' }}</button>
        </div>
      </div>

      <!-- Toast de e-mail mock -->
      <Transition name="toast">
        <div v-if="notifEmailMsg" class="notif-email-toast">
          {{ notifEmailMsg }}
        </div>
      </Transition>

      <div class="paper">
        <h3 class="paper-subtitle">Ação do CAESI</h3>

        <div v-if="!atendida">
          <p style="font-size:0.87rem;color:var(--cinza);margin-bottom:1.2rem;line-height:1.5;">
            Após tratar esta mensagem, marque-a como atendida. O remetente verá a atualização ao consultar o protocolo.
          </p>
          <div class="btn-row">
            <button class="btn btn-amarelo" @click="marcarAtendida">✓ Marcar como atendida</button>
            <button class="btn btn-outline btn-sm" @click="confirmarExcluir">Excluir mensagem</button>
          </div>
        </div>

        <div v-else>
          <div class="alert-atendida">
            <span style="font-size:1.6rem;">✓</span>
            <div>
              <div class="alert-atendida-title">Mensagem marcada como atendida</div>
              <div class="alert-atendida-sub">Salvo no sistema</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" @click="desfazer">↩ Desfazer</button>
        </div>
      </div>
    </div>
  </div>
</template>

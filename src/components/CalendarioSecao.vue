<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { isAdmin } from '../stores/auth.js'
import { eventos, proximosEventos, addEvento, updateEvento, removeEvento } from '../stores/calendario.js'
import { useEscapeKey } from '../composables/useEscapeKey.js'
import { showToast } from '../stores/toast.js'
import calendarIcon from '../assets/icons/calendar.svg?raw'

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function diaMes(data) {
  const [, mes, dia] = data.split('-').map(Number)
  return { dia, mes: MESES_ABREV[mes - 1] }
}

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES_EXT   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const padCal = n => String(n).padStart(2, '0')
const fmtISOCal = d => `${d.getFullYear()}-${padCal(d.getMonth() + 1)}-${padCal(d.getDate())}`

const agoraCal = new Date()
const anoAtualCal = ref(agoraCal.getFullYear())
const mesAtualCal = ref(agoraCal.getMonth())
const hojeISOCal  = fmtISOCal(agoraCal)

function mesAnteriorCal() {
  if (mesAtualCal.value === 0) { mesAtualCal.value = 11; anoAtualCal.value-- } else mesAtualCal.value--
}
function mesSeguinteCal() {
  if (mesAtualCal.value === 11) { mesAtualCal.value = 0; anoAtualCal.value++ } else mesAtualCal.value++
}

const eventosPorDiaCal = computed(() => {
  const mapa = {}
  for (const e of eventos.value) {
    if (!mapa[e.data]) mapa[e.data] = []
    mapa[e.data].push(e)
  }
  return mapa
})

const celulasCal = computed(() => {
  const primeiroDia = new Date(anoAtualCal.value, mesAtualCal.value, 1)
  const offset = primeiroDia.getDay()
  const inicio = new Date(anoAtualCal.value, mesAtualCal.value, 1 - offset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    const iso = fmtISOCal(d)
    return {
      iso,
      dia: d.getDate(),
      outroMes: d.getMonth() !== mesAtualCal.value,
      hoje: iso === hojeISOCal,
      eventos: eventosPorDiaCal.value[iso] ?? [],
    }
  })
})

const buscaCalendario = ref('')
const resultadosBuscaCalendario = computed(() => {
  const t = buscaCalendario.value.toLowerCase().trim()
  if (!t) return []
  return eventos.value.filter(e => e.nome.toLowerCase().includes(t))
})

// Preenche os quadradinhos vazios com eventos passados recentes quando
// não há próximos suficientes, pra seção nunca ficar com sobra de espaço.
const passadosCal = computed(() =>
  eventos.value
    .filter(e => e.data < hojeISOCal)
    .sort((a, b) => b.data.localeCompare(a.data))
)

const teasersRealCal = computed(() => {
  const prox = proximosEventos.value.slice(0, 6).map(e => ({ ...e, passado: false }))
  if (prox.length >= 6) return prox
  const passadosPreenchimento = passadosCal.value.slice(0, 6 - prox.length).map(e => ({ ...e, passado: true }))
  return [...prox, ...passadosPreenchimento]
})

// Completa até 6 quadradinhos com placeholders vazios (sem esticar/centralizar
// o pouco conteúdo real) quando há menos de 6 eventos reais no total.
const teasersGridCal = computed(() => {
  const reais = teasersRealCal.value
  if (reais.length === 0) return []
  const faltam = 6 - reais.length
  const placeholders = Array.from({ length: faltam }, (_, i) => ({ id: `placeholder-${i}`, placeholder: true }))
  return [...reais, ...placeholders]
})

const eventoModal = ref(null)
const diaModal = ref(null)
const novoEventoModal = ref(null) // { iso } quando admin está criando um evento numa data

function abrirEvento(e) {
  diaModal.value = null
  eventoModal.value = e
  eventoModoEdicao.value = false
}
function abrirDia(celula) {
  if (celula.eventos.length === 0) {
    if (isAdmin.value) abrirNovoEvento(celula.iso)
    return
  }
  if (celula.eventos.length === 1) { abrirEvento(celula.eventos[0]); return }
  diaModal.value = celula
}
function fecharEventoModal() { eventoModal.value = null; eventoModoEdicao.value = false }
function fecharDiaModal() { diaModal.value = null }

function formatDataExtCal(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${dia} de ${MESES_EXT[mes - 1]} de ${ano}`
}

function baixarIcs(evento) {
  const [ano, mes, dia] = evento.data.split('-')
  const dtstart = `${ano}${mes}${dia}`
  const uid = `evento-${evento.id}@caesi.ufcg`
  const esc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CAESI UFCG//Calendario//PT-BR',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstart}T000000Z`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `SUMMARY:${esc(evento.nome)}`,
    `DESCRIPTION:${esc(evento.descricao)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${evento.nome.toLowerCase().replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Admin: editar evento existente ───────────────────────
const eventoModoEdicao = ref(false)
const eventoEditForm   = ref({ nome: '', descricao: '' })

function iniciarEdicaoEvento() {
  eventoEditForm.value = { nome: eventoModal.value.nome, descricao: eventoModal.value.descricao ?? '' }
  eventoModoEdicao.value = true
}
function cancelarEdicaoEvento() { eventoModoEdicao.value = false }

function salvarEdicaoEvento() {
  if (!eventoEditForm.value.nome.trim()) return
  updateEvento(eventoModal.value.id, {
    nome: eventoEditForm.value.nome.trim(),
    descricao: eventoEditForm.value.descricao.trim(),
  })
  eventoModal.value = { ...eventoModal.value, nome: eventoEditForm.value.nome.trim(), descricao: eventoEditForm.value.descricao.trim() }
  eventoModoEdicao.value = false
  showToast('Evento atualizado.', 'success')
}

function excluirEvento() {
  if (!confirm(`Remover "${eventoModal.value.nome}" do calendário?`)) return
  removeEvento(eventoModal.value.id)
  showToast('Evento removido.', 'info')
  fecharEventoModal()
}

// ── Admin: criar evento numa data ────────────────────────
const novoEventoForm = ref({ nome: '', descricao: '' })

function abrirNovoEvento(iso) {
  diaModal.value = null
  novoEventoForm.value = { nome: '', descricao: '' }
  novoEventoModal.value = { iso }
}
function fecharNovoEventoModal() { novoEventoModal.value = null }

function salvarNovoEvento() {
  if (!novoEventoForm.value.nome.trim()) return
  addEvento({
    nome: novoEventoForm.value.nome.trim(),
    descricao: novoEventoForm.value.descricao.trim(),
    data: novoEventoModal.value.iso,
  })
  showToast('Evento adicionado ao calendário.', 'success')
  novoEventoModal.value = null
}

// ── Modais: fechar com Esc e travar o scroll enquanto algum estiver aberto ──
useEscapeKey(() => { fecharEventoModal(); fecharDiaModal(); fecharNovoEventoModal() })

const algumModalAberto = computed(() => !!eventoModal.value || !!diaModal.value || !!novoEventoModal.value)
watch(algumModalAberto, (aberto) => {
  document.body.style.overflow = aberto ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<template>
  <section class="home-section" id="calendario" style="scroll-margin-top:80px;">
    <div class="section-label">Agenda</div>
    <h2 class="section-title">Calendário do <span>CAESI</span></h2>

    <div class="cal-home-layout">
      <!-- Próximos eventos: quadradinhos à esquerda -->
      <div class="cal-home-teasers-col">
        <p class="cal-home-teasers-titulo">Eventos próximos</p>
        <div class="cal-home-teasers" :class="{ 'cal-home-teasers--vazio': teasersRealCal.length === 0 }">
          <div v-if="teasersRealCal.length === 0" class="cal-home-vazio">
            <span class="cal-home-vazio-icon" v-html="calendarIcon"></span>
            <p>Nenhum evento por aqui ainda.</p>
            <span>Fique de olho — novidades aparecem nesse espaço.</span>
          </div>
          <button
            v-for="e in teasersGridCal" :key="e.id"
            class="evento-teaser"
            :class="{ 'evento-teaser--passado': e.passado, 'evento-teaser--placeholder': e.placeholder }"
            :disabled="e.placeholder"
            @click="!e.placeholder && abrirEvento(e)"
          >
            <template v-if="!e.placeholder">
              <div class="evento-teaser-data">
                <span class="evento-teaser-dia">{{ diaMes(e.data).dia }}</span>
                <span class="evento-teaser-mes">{{ diaMes(e.data).mes }}</span>
              </div>
              <div class="evento-teaser-corpo">
                <div class="evento-teaser-nome">{{ e.nome }}</div>
                <p v-if="e.descricao" class="evento-teaser-desc">{{ e.descricao }}</p>
              </div>
              <span v-if="e.passado" class="evento-teaser-tag">Encerrado</span>
            </template>
            <span v-else class="evento-teaser-placeholder-dot"></span>
          </button>
        </div>
      </div>

      <!-- Grade de mês + busca à direita -->
      <div class="paper cal-home-paper">
        <input
          v-model="buscaCalendario" type="search" class="mapa-home-search"
          placeholder="Buscar evento…"
        >
        <div v-if="resultadosBuscaCalendario.length > 0" class="mapa-home-resultados">
          <button
            v-for="e in resultadosBuscaCalendario" :key="e.id"
            class="mapa-home-resultado-item"
            @click="abrirEvento(e); buscaCalendario = ''"
          >{{ e.nome }}</button>
        </div>
        <div v-else-if="buscaCalendario.trim()" class="mapa-home-resultados">
          <span class="mapa-home-sem-resultado">Nenhum evento encontrado.</span>
        </div>

        <div class="cal-home-header">
          <button class="cal-home-nav-btn" @click="mesAnteriorCal" aria-label="Mês anterior">←</button>
          <div class="cal-home-titulo">{{ MESES_EXT[mesAtualCal] }} {{ anoAtualCal }}</div>
          <button class="cal-home-nav-btn" @click="mesSeguinteCal" aria-label="Próximo mês">→</button>
        </div>

        <div class="cal-home-semana">
          <span v-for="d in DIAS_SEMANA" :key="d">{{ d }}</span>
        </div>
        <div class="cal-home-dias">
          <button
            v-for="c in celulasCal" :key="c.iso"
            class="cal-home-dia"
            :class="{ 'cal-home-dia--outro-mes': c.outroMes, 'cal-home-dia--hoje': c.hoje, 'cal-home-dia--com-evento': c.eventos.length > 0 }"
            :disabled="!isAdmin && c.eventos.length === 0"
            @click="abrirDia(c)"
          >
            {{ c.dia }}
            <span v-if="c.eventos.length > 0" class="cal-home-dia-dot"></span>
          </button>
        </div>
        <p v-if="isAdmin" style="font-size:0.76rem;color:var(--cinza);margin-top:0.6rem;">
          Clique num dia vazio pra adicionar um evento.
        </p>
      </div>
    </div>
  </section>

  <!-- Modal: detalhe de um evento -->
  <Teleport to="body">
    <div v-if="eventoModal" class="modal-overlay" @click.self="fecharEventoModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-evento-title" v-focus-trap>
        <template v-if="!eventoModoEdicao">
          <div class="modal-title" id="modal-evento-title">{{ eventoModal.nome }}</div>
          <div class="modal-body">
            <p style="font-size:0.85rem;color:var(--cinza);margin-bottom:0.6rem;">{{ formatDataExtCal(eventoModal.data) }}</p>
            <p v-if="eventoModal.descricao">{{ eventoModal.descricao }}</p>
            <p v-else style="color:var(--cinza);font-style:italic;">Sem descrição cadastrada.</p>
            <p v-if="eventoModal.formularioId" style="font-size:0.78rem;color:var(--cinza);margin-top:0.8rem;">
              Vinculado a um formulário — edite a data por lá pra manter tudo sincronizado.
            </p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="fecharEventoModal">Fechar</button>
            <template v-if="isAdmin && !eventoModal.formularioId">
              <button class="btn btn-outline btn-sm" @click="iniciarEdicaoEvento">Editar</button>
              <button class="btn btn-danger btn-sm" @click="excluirEvento">Excluir</button>
            </template>
            <RouterLink
              v-if="eventoModal.formularioId"
              :to="isAdmin ? `/admin/formularios/${eventoModal.formularioId}` : `/formularios/${eventoModal.formularioId}`"
              class="btn btn-outline btn-sm"
            >
              {{ isAdmin ? 'Editar formulário →' : 'Ver formulário →' }}
            </RouterLink>
            <button class="btn btn-primary btn-sm" @click="baixarIcs(eventoModal)">
              <span class="btn-icon" v-html="calendarIcon"></span> Adicionar ao calendário
            </button>
          </div>
        </template>

        <template v-else>
          <div class="modal-title">Editar evento</div>
          <div class="modal-body">
            <div class="field">
              <label>Nome *</label>
              <input v-model="eventoEditForm.nome" type="text" maxlength="100">
            </div>
            <div class="field">
              <label>Descrição</label>
              <textarea v-model="eventoEditForm.descricao" rows="3"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline btn-sm" @click="cancelarEdicaoEvento">Cancelar</button>
            <button class="btn btn-primary btn-sm" @click="salvarEdicaoEvento">Salvar →</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <!-- Modal: lista de eventos de um dia -->
  <Teleport to="body">
    <div v-if="diaModal" class="modal-overlay" @click.self="fecharDiaModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-dia-title" v-focus-trap>
        <div class="modal-title" id="modal-dia-title">{{ formatDataExtCal(diaModal.iso) }}</div>
        <div class="modal-body">
          <button
            v-for="e in diaModal.eventos" :key="e.id"
            class="cal-home-dia-evento-item"
            @click="abrirEvento(e)"
          >{{ e.nome }}</button>
        </div>
        <div class="modal-actions">
          <button v-if="isAdmin" class="btn btn-outline btn-sm" @click="abrirNovoEvento(diaModal.iso)">+ Adicionar evento</button>
          <button class="btn btn-outline btn-sm" @click="fecharDiaModal">Fechar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal: novo evento (admin) -->
  <Teleport to="body">
    <div v-if="novoEventoModal" class="modal-overlay" @click.self="fecharNovoEventoModal">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-novo-evento-title" v-focus-trap>
        <div class="modal-title" id="modal-novo-evento-title">Novo evento — {{ formatDataExtCal(novoEventoModal.iso) }}</div>
        <div class="modal-body">
          <div class="field">
            <label>Nome *</label>
            <input v-model="novoEventoForm.nome" type="text" maxlength="100" placeholder="Ex.: Maratona de Programação">
          </div>
          <div class="field">
            <label>Descrição <span class="field-hint">(opcional)</span></label>
            <textarea v-model="novoEventoForm.descricao" rows="3" placeholder="Detalhes do evento…"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="fecharNovoEventoModal">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="salvarNovoEvento">Salvar →</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

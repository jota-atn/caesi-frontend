<script setup>
import { ref, computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import MsgCard from '../../components/MsgCard.vue'
import { mensagens } from '../../stores/mensagens.js'
import { user } from '../../stores/auth.js'

const filtro = ref('todas')

const minhasMensagens = computed(() =>
  mensagens.value.filter(m =>
    m.email === user.value?.email || m.matricula === user.value?.matricula
  )
)

const mensagensFiltradas = computed(() =>
  filtro.value === 'todas'
    ? minhasMensagens.value
    : minhasMensagens.value.filter(m => m.status === filtro.value)
)

const totalPendente = computed(() => minhasMensagens.value.filter(m => m.status === 'pendente').length)
const totalAtendida = computed(() => minhasMensagens.value.filter(m => m.status === 'atendida').length)
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar />

    <div class="page-content">
      <div class="page-heading">
        <h2>Minhas <span>Mensagens</span></h2>
        <RouterLink to="/aluno/nova-mensagem" class="btn btn-amarelo btn-sm">+ Nova mensagem</RouterLink>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-number">{{ minhasMensagens.length }}</div>
          <div class="stat-label">Total enviadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-number--roxo">{{ totalPendente }}</div>
          <div class="stat-label">Pendentes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-number--verde">{{ totalAtendida }}</div>
          <div class="stat-label">Atendidas</div>
        </div>
      </div>

      <div class="filter-bar">
        <button class="filter-btn" :class="{ active: filtro === 'todas' }"   @click="filtro = 'todas'">Todas</button>
        <button class="filter-btn" :class="{ active: filtro === 'pendente' }" @click="filtro = 'pendente'">Pendentes</button>
        <button class="filter-btn" :class="{ active: filtro === 'atendida' }" @click="filtro = 'atendida'">Atendidas</button>
      </div>

      <MsgCard
        v-for="m in mensagensFiltradas"
        :key="m.id"
        :mensagem="m"
        :to="`/aluno/mensagem/${m.id}`"
      />

      <div v-if="mensagensFiltradas.length === 0" class="empty-state">
        <p>{{ minhasMensagens.length === 0 ? 'Você ainda não enviou nenhuma mensagem.' : 'Nenhuma mensagem encontrada.' }}</p>
        <RouterLink v-if="minhasMensagens.length === 0" to="/aluno/nova-mensagem" class="btn btn-amarelo btn-sm" style="margin-top:1rem;">
          Enviar primeira mensagem
        </RouterLink>
      </div>
    </div>
  </div>
</template>

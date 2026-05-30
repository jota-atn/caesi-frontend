<script setup>
import { computed } from 'vue'
import Navbar from '../../components/Navbar.vue'
import { mensagens } from '../../stores/mensagens.js'
import { usuarios } from '../../stores/usuarios.js'
import { equipe } from '../../stores/equipe.js'

const totalMensagens = computed(() => mensagens.value.length)
const pendentes      = computed(() => mensagens.value.filter(m => m.status === 'pendente').length)
const atendidas      = computed(() => mensagens.value.filter(m => m.status === 'atendida').length)

const totalUsuarios  = computed(() => usuarios.value.filter(u => u.role !== 'admin').length)
const ativos         = computed(() => usuarios.value.filter(u => u.role !== 'admin' && u.ativo !== false).length)
const inativos       = computed(() => usuarios.value.filter(u => u.role !== 'admin' && u.ativo === false).length)
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:110px;right:2%;font-size:1.2rem;opacity:0.4;">✦</div>
    <div class="deco-star" style="bottom:20%;left:1.2%;font-size:1.5rem;opacity:0.32;">✦</div>

    <Navbar :admin="true" />

    <div class="page-content">
      <div class="page-heading">
        <h2>Painel <span>Geral</span></h2>
      </div>

      <div class="paper paper-flush">

        <!-- Mensagens -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Mensagens</span>
            <span class="geral-row-badge" :class="pendentes > 0 ? 'alerta' : 'ok'">
              {{ pendentes > 0 ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Em dia' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ totalMensagens }}</span>
              <span class="geral-mini-label">Total</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--roxo);">{{ pendentes }}</span>
              <span class="geral-mini-label">Pendentes</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ atendidas }}</span>
              <span class="geral-mini-label">Atendidas</span>
            </div>
          </div>
          <RouterLink to="/admin/mensagens" class="geral-row-link">Ver painel →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Usuários -->
        <div class="geral-row">
          <div class="geral-row-left">
            <span class="geral-row-title">Usuários</span>
            <span class="geral-row-badge" :class="inativos > 0 ? 'alerta' : 'ok'">
              {{ inativos > 0 ? `${inativos} inativo${inativos > 1 ? 's' : ''}` : 'Todos ativos' }}
            </span>
          </div>
          <div class="geral-row-stats">
            <div class="geral-mini-stat">
              <span class="geral-mini-num">{{ totalUsuarios }}</span>
              <span class="geral-mini-label">Cadastrados</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--verde);">{{ ativos }}</span>
              <span class="geral-mini-label">Ativos</span>
            </div>
            <div class="geral-mini-stat">
              <span class="geral-mini-num" style="color:var(--cinza);">{{ inativos }}</span>
              <span class="geral-mini-label">Inativos</span>
            </div>
          </div>
          <RouterLink to="/admin/usuarios" class="geral-row-link">Gerenciar →</RouterLink>
        </div>

        <div class="geral-divider" />

        <!-- Equipe -->
        <div class="geral-row geral-row--equipe">
          <div class="geral-row-left">
            <span class="geral-row-title">Equipe</span>
          </div>
          <div class="geral-equipe-grid">
            <div v-for="d in equipe" :key="d.diretoria" class="geral-equipe-chip">
              <span class="geral-chip-dir">{{ d.diretoria }}</span>
              <span class="geral-chip-nome" :class="{ vazio: !d.presidente }">
                {{ d.presidente || '—' }}
              </span>
            </div>
          </div>
          <RouterLink to="/admin/equipe" class="geral-row-link">Editar →</RouterLink>
        </div>

      </div>
    </div>
  </div>
</template>

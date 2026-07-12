<template>
  <main class="ouvidoria-page">
    <header class="hero">
      <h1 class="hero-title">CAESI <span>Ouvidoria</span></h1>
      <p class="hero-sub">Um canal seguro, direto e confidencial com a representação estudantil.</p>
      
      <!-- Nova UX com as classes corretas de botão e campo -->
      <div class="hero-actions">
        <div class="field" style="margin-bottom: 0; min-width: 280px;">
          <input type="text" placeholder="Digite seu nº de protocolo..." v-model="protocoloBusca" />
        </div>
        <button @click="consultarProtocolo" class="btn btn-outline">Consultar</button>
      </div>
    </header>

    <section class="home-section">
      <h2 class="section-title">Como <span>funciona</span></h2>
      <div class="steps-grid">
        <div class="step-card">
          <span class="step-number">1</span>
          <div class="step-icon">
            <img src="@/assets/icons/pencil.svg" alt="Escrever" />
          </div>
          <h3 class="step-title">Escreva sua mensagem</h3>
          <p class="step-desc">Preencha o formulário abaixo de forma segura. Sua identidade é opcional.</p>
        </div>
        
        <div class="step-card">
          <span class="step-number">2</span>
          <div class="step-icon">
            <img src="@/assets/icons/inbox.svg" alt="Recebimento" />
          </div>
          <h3 class="step-title">O CAESI recebe</h3>
          <p class="step-desc">A mensagem é avaliada por nossa equipe com total sigilo.</p>
        </div>
        
        <div class="step-card">
          <span class="step-number">3</span>
          <div class="step-icon">
            <img src="@/assets/icons/check-circle.svg" alt="Acompanhar" />
          </div>
          <h3 class="step-title">Acompanhe o status</h3>
          <p class="step-desc">Use o número de protocolo para consultar o andamento da sua solicitação.</p>
        </div>
      </div>
    </section>

    <section class="home-section">
      <h2 class="section-title">Enviar <span>mensagem</span></h2>
      <div class="cal-home-paper" style="background: var(--creme); border-radius: 2px; box-shadow: 4px 4px 0 var(--roxo-escuro);"> 
        <form @submit.prevent="enviarMensagem">
          
          <div class="field">
            <label>TIPO DE RELATO *</label>
            <select v-model="form.tipo" required>
              <option value="" disabled>Selecione o tipo de relato...</option>
              <option value="denuncia">Denúncia</option>
              <option value="sugestao">Sugestão de Melhoria</option>
              <option value="duvida">Dúvida Geral</option>
              <option value="infra">Problema de Infraestrutura</option>
            </select>
          </div>

          <div class="field">
            <label>PERÍODO EM QUE OCORREU *</label>
            <select v-model="form.periodo" required>
              <option value="" disabled>Selecione o período...</option>
              <option value="2026.1">2026.1</option>
              <option value="2025.2">2025.2</option>
              <option value="2025.1">2025.1</option>
              <option value="2024.2">2024.2</option>
              <option value="anterior">Anterior a 2024.2</option>
              <option value="nao_se_aplica">Não sei / Não se aplica</option>
            </select>
          </div>

          <div class="field">
            <label>MENSAGEM * (mín. 20 caracteres)</label>
            <textarea v-model="form.mensagem" minlength="20" placeholder="Descreva com detalhes o que aconteceu ou o que você sugere..." required></textarea>
            <div class="char-counter">Mínimo de 20 caracteres</div>
          </div>

          <div class="field-section">
            <div class="admin-no-msg-title" style="margin-bottom: 8px;">Identificação (opcional)</div>
            <p class="admin-no-msg-sub" style="margin-bottom: 1.2rem;">Se identificar, garantimos sigilo. Deixe em branco se quiser manter anonimato.</p>
            
            <div class="ident-row">
              <div class="field">
                <label>NOME</label>
                <input type="text" v-model="form.nome" placeholder="Seu nome completo" />
              </div>
              <div class="field">
                <label>E-MAIL</label>
                <input type="email" v-model="form.email" placeholder="seu@email.com" />
              </div>
            </div>
          </div>

          <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary">Enviar relato →</button>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const protocoloBusca = ref('')

const form = ref({
  tipo: '',
  periodo: '',
  mensagem: '',
  nome: '',
  email: ''
})

const consultarProtocolo = () => {
  if (protocoloBusca.value.trim()) {
    router.push({ name: 'ouvidoria-consulta', query: { p: protocoloBusca.value } })
  }
}

const enviarMensagem = () => {
  // Aqui vai a lógica de integração com sua store (mensagens.js) ou API
  console.log('Enviando:', form.value)
  alert('Mensagem enviada! Anote seu protocolo: ABC-123')
}
</script>

<style scoped>
/* Adicione aqui ajustes específicos, importando o forms.css se não for global */
.ouvidoria-header { text-align: center; margin-bottom: 3rem; }
.busca-protocolo { display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
.busca-protocolo input { padding: 0.5rem 1rem; border-radius: 4px; border: 1px solid #ccc; width: 300px; }
/* ... (reaproveite as classes CSS do seu projeto) ... */
</style>
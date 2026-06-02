<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/') }

const form = ref({ nome: '', email: '', assunto: '', mensagem: '' })
const errors = ref({})
const enviado = ref(false)

function submit() {
  const e = {}
  if (!form.value.nome.trim())               e.nome = true
  if (!form.value.email.includes('@'))       e.email = true
  if (!form.value.assunto.trim())            e.assunto = true
  if (form.value.mensagem.trim().length < 10) e.mensagem = true
  errors.value = e
  if (Object.keys(e).length === 0) enviado.value = true
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:3rem;flex:1;max-width:640px;">
      <button class="back-link" style="margin-bottom:1.2rem;" @click="voltar">← Voltar</button>
      <div class="section-label">Fale conosco</div>
      <h1 class="section-title">Entre em <span>contato</span></h1>

      <div class="paper">

        <div v-if="enviado" class="anon-success">
          <div class="check-circle">✓</div>
          <h3 style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.25rem;color:var(--roxo-escuro);margin-bottom:0.5rem;">
            Mensagem enviada!
          </h3>
          <p style="font-size:0.9rem;color:var(--cinza);line-height:1.6;margin-bottom:1.2rem;">
            Recebemos sua mensagem e responderemos pelo e-mail informado em breve.
          </p>
          <button class="btn btn-outline btn-sm" @click="enviado = false; form.value = { nome: '', email: '', assunto: '', mensagem: '' }">
            Enviar outra mensagem
          </button>
        </div>

        <template v-else>
          <p style="font-size:0.88rem;color:var(--cinza);margin-bottom:1.5rem;line-height:1.6;">
            Este é o canal direto com a gestão do CAESI. Para reclamações e sugestões formais com protocolo,
            use a <RouterLink to="/#enviar" style="color:var(--roxo-escuro);font-weight:600;">ouvidoria</RouterLink>.
          </p>

          <form @submit.prevent="submit" novalidate>
            <div class="field-grid">
              <div class="field">
                <label>Nome *</label>
                <input v-model="form.nome" type="text" placeholder="Seu nome" :class="{ invalid: errors.nome }">
                <span class="error-msg" role="alert">Preencha seu nome.</span>
              </div>
              <div class="field">
                <label>E-mail *</label>
                <input v-model="form.email" type="email" placeholder="nome@ccc.ufcg.edu.br" :class="{ invalid: errors.email }">
                <span class="error-msg" role="alert">E-mail inválido.</span>
              </div>
            </div>

            <div class="field">
              <label>Assunto *</label>
              <input v-model="form.assunto" type="text" placeholder="Sobre o que você quer falar?" maxlength="100"
                :class="{ invalid: errors.assunto }">
              <span class="error-msg" role="alert">Preencha o assunto.</span>
            </div>

            <div class="field">
              <label>Mensagem *</label>
              <textarea v-model="form.mensagem" placeholder="Escreva aqui…" rows="5" maxlength="2000"
                :class="{ invalid: errors.mensagem }"></textarea>
              <span class="error-msg" role="alert">A mensagem é muito curta.</span>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-amarelo">Enviar mensagem →</button>
            </div>
          </form>
        </template>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

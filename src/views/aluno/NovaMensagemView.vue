<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../../components/Navbar.vue'
import { user } from '../../stores/auth.js'
import { addMensagem } from '../../stores/mensagens.js'

const router = useRouter()

const form = ref({ assunto: '', categoria: '', mensagem: '', anonimo: false })
const errors = ref({})
const charCount = ref(0)

function onMensagemInput(e) {
  charCount.value = e.target.value.length
}

function submit() {
  const e = {}
  if (!form.value.assunto.trim()) e.assunto = true
  if (!form.value.categoria)      e.categoria = true
  if (form.value.mensagem.trim().length < 20) e.mensagem = true
  errors.value = e
  if (Object.keys(e).length === 0) {
    const nova = addMensagem({
      assunto: form.value.assunto,
      categoria: form.value.categoria,
      corpo: form.value.mensagem,
      anonimo: form.value.anonimo,
      autor: form.value.anonimo ? 'Anônimo' : user.value.nome,
      email: user.value.email,
      matricula: user.value.matricula,
    })
    router.push(`/aluno/enviada?protocolo=${nova.protocolo}`)
  }
}
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:120px;right:3%;font-size:1.5rem;opacity:0.45;">✦</div>
    <div class="deco-star" style="top:350px;left:1.5%;font-size:0.85rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="bottom:12%;right:4%;font-size:1rem;opacity:0.4;">✦</div>

    <Navbar />

    <div class="page-content">
      <RouterLink to="/aluno/mensagens" class="back-link">← Minhas mensagens</RouterLink>

      <div class="page-heading">
        <h2>Nova <span>Mensagem</span></h2>
      </div>

      <div class="paper">
        <p style="font-size:0.88rem;color:var(--cinza);margin-bottom:1.5rem;line-height:1.6;">
          Sua mensagem será recebida pela equipe do CAESI. Você pode acompanhar o status pela lista de mensagens.
          Se preferir, envie de forma anônima — nenhum dado seu será associado à mensagem.
        </p>

        <form @submit.prevent="submit" novalidate>
          <div class="field">
            <label>Assunto *</label>
            <input v-model="form.assunto" type="text" placeholder="Descreva brevemente o tema" maxlength="100"
              :class="{ invalid: errors.assunto }">
            <span class="error-msg">Preencha o assunto da mensagem.</span>
          </div>

          <div class="field">
            <label>Categoria *</label>
            <select v-model="form.categoria" :class="{ invalid: errors.categoria }">
              <option value="" disabled>Selecione uma categoria</option>
              <option value="matricula">Matrícula e Sistema Acadêmico</option>
              <option value="infra">Infraestrutura e Espaço Físico</option>
              <option value="docente">Corpo Docente</option>
              <option value="estagio">Estágios e Oportunidades</option>
              <option value="eventos">Eventos e Atividades</option>
              <option value="sugestao">Sugestão de Melhoria</option>
              <option value="outro">Outro</option>
            </select>
            <span class="error-msg">Selecione uma categoria.</span>
          </div>

          <div class="field">
            <label>
              Mensagem *
              <span class="field-hint">(mín. 20 caracteres)</span>
            </label>
            <textarea
              v-model="form.mensagem"
              placeholder="Descreva sua mensagem com o máximo de detalhes possível…"
              rows="6"
              maxlength="2000"
              :class="{ invalid: errors.mensagem }"
              @input="onMensagemInput"
            ></textarea>
            <span class="error-msg">
              {{ form.mensagem.trim().length === 0 ? 'A mensagem não pode estar vazia.' : 'A mensagem deve ter pelo menos 20 caracteres.' }}
            </span>
            <div class="char-counter" :class="{ warn: charCount > 1800 }">{{ charCount }} / 2000</div>
          </div>

          <label class="check-anon">
            <input type="checkbox" v-model="form.anonimo">
            <div class="check-anon-label">
              <strong>Enviar anonimamente</strong><br>
              <span style="font-size:0.8rem;opacity:0.75;">Seu nome e matrícula não serão visíveis para o CAESI</span>
            </div>
          </label>

          <div v-if="form.anonimo" style="
            background:rgba(245,197,66,0.15);
            border:2px solid var(--amarelo);
            border-radius:2px;
            padding:10px 14px;
            font-size:0.85rem;
            color:var(--preto);
            margin-bottom:1.2rem;
            line-height:1.5;
          ">
            Ao enviar anonimamente, o CAESI <strong>não conseguirá te contatar</strong> para dar retorno individual.
          </div>

          <hr class="divider">

          <div class="btn-row" style="justify-content:flex-end;">
            <RouterLink to="/aluno/mensagens" class="btn btn-outline">Cancelar</RouterLink>
            <button type="submit" class="btn btn-amarelo">Enviar mensagem →</button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

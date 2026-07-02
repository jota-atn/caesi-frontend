<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { admins, descricaoGestao, gestaoInfo, periodoFormatado, historicoGestoes, historicoVisivel } from '../stores/equipe.js'

const expandido = ref(null)
function toggleGestao(id) { expandido.value = expandido.value === id ? null : id }

const router = useRouter()
function voltar() { window.history.state?.back ? router.back() : router.push('/') }
import mapPinIcon from '../assets/icons/map-pin.svg?raw'
import mailIcon from '../assets/icons/mail.svg?raw'
import instagramIcon from '../assets/icons/instagram.svg?raw'
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:500px;left:1.5%;font-size:1rem;opacity:0.25;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:3.5rem;flex:1;">
      <button class="back-link" style="margin-bottom:1.2rem;" @click="voltar">← Voltar</button>
      <div class="section-label">Quem somos</div>
      <h1 class="section-title">Sobre o <span>CAESI</span></h1>

      <div class="paper paper-mb-lg">
        <h2 class="paper-title">Missão</h2>
        <p style="font-size:0.95rem;color:var(--preto);line-height:1.75;margin-bottom:1.2rem;">
          O CAESI, Centro Acadêmico de Ciência da Computação, é a entidade estudantil
          que representa os alunos do curso de Ciência da Computação da UFCG. Nossa missão é defender
          os direitos e interesses dos estudantes, promover a integração acadêmica e facilitar a comunicação
          entre o corpo discente e a instituição.
        </p>
        <p style="font-size:0.95rem;color:var(--preto);line-height:1.75;">
          A ouvidoria é um dos nossos canais mais importantes: um espaço para que qualquer aluno possa
          relatar problemas, sugerir melhorias ou entrar em contato com o CAESI de forma segura, inclusive anônima.
        </p>
      </div>

      <div class="paper paper-mb-lg">
        <div class="gestao-header">
          <div>
            <h2 class="paper-title" style="margin-bottom:0;">Gestão atual</h2>
            <div v-if="gestaoInfo.nomeChapa" class="chapa-nome">{{ gestaoInfo.nomeChapa }}</div>
          </div>
          <div v-if="periodoFormatado" class="chapa-periodo">{{ periodoFormatado }}</div>
        </div>
        <div v-if="admins.length === 0" style="font-size:0.9rem;color:var(--cinza);padding:0.5rem 0;">
          Nenhum administrador cadastrado ainda.
        </div>
        <div v-else class="equipe-carrossel">
          <div v-for="a in admins" :key="a.id" class="membro-card">
            <div class="membro-avatar">
              <img v-if="a.foto" :src="a.foto" :alt="a.nome" class="membro-foto">
              <span v-else class="membro-inicial">{{ a.nome?.[0]?.toUpperCase() || '?' }}</span>
            </div>
            <div class="membro-nome">{{ a.nome }}</div>
            <div v-if="a.diretoria" class="membro-periodo">{{ a.diretoria }}</div>
            <div v-else-if="a.periodo" class="membro-periodo">{{ a.periodo }}</div>
            <div v-if="a.email" class="membro-email">{{ a.email }}</div>
            <div v-if="a.descricao" class="membro-desc">{{ a.descricao }}</div>
            <div v-if="a.linkedin || a.git || a.lattes" class="membro-links">
              <a v-if="a.linkedin" :href="a.linkedin" target="_blank" rel="noopener" class="membro-link">LinkedIn</a>
              <a v-if="a.git"      :href="a.git"      target="_blank" rel="noopener" class="membro-link">GitHub</a>
              <a v-if="a.lattes"   :href="a.lattes"   target="_blank" rel="noopener" class="membro-link">Lattes</a>
            </div>
          </div>
        </div>

        <div v-if="descricaoGestao" class="gestao-desc">
          <div class="label-sm" style="margin-bottom:0.6rem;">Sobre a gestão</div>
          <p class="gestao-texto">{{ descricaoGestao }}</p>
        </div>
      </div>

      <div v-if="historicoVisivel && historicoGestoes.length" class="paper paper-mb-lg">
        <h2 class="paper-title" style="margin-bottom:1.2rem;">Gestões anteriores</h2>
        <div class="hist-lista">
          <div v-for="g in historicoGestoes" :key="g.id" class="hist-item">
            <button class="hist-header" @click="toggleGestao(g.id)">
              <div class="hist-header-info">
                <span class="hist-chapa">{{ g.nomeChapa }}</span>
                <span v-if="g.periodo" class="hist-periodo">{{ g.periodo }}</span>
              </div>
              <span class="hist-chevron" :class="{ aberto: expandido === g.id }">▾</span>
            </button>
            <div v-if="expandido === g.id" class="hist-body">
              <p v-if="g.descricao" class="hist-desc">{{ g.descricao }}</p>
              <div v-if="g.membros?.length" class="hist-membros">
                <div v-for="m in g.membros" :key="m.nome + m.diretoria" class="hist-membro">
                  <div class="hist-membro-avatar">
                    <img v-if="m.foto" :src="m.foto" :alt="m.nome" class="hist-membro-foto">
                    <span v-else class="hist-membro-inicial">{{ m.nome?.[0]?.toUpperCase() || '?' }}</span>
                  </div>
                  <div v-if="m.diretoria" class="label-sm" style="margin-bottom:2px;">{{ m.diretoria }}</div>
                  <div style="font-size:0.88rem;font-weight:600;color:var(--preto);">{{ m.nome }}</div>
                  <div v-if="m.periodo" style="font-size:0.76rem;color:var(--cinza);">{{ m.periodo }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="paper">
        <h2 class="paper-title">Onde nos encontrar</h2>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;color:var(--preto);">
            <span v-html="mapPinIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            Sala do CAESI — Bloco CP, UFCG, Campina Grande – PB
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;">
            <span v-html="mailIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            <a href="mailto:caesi@ccc.ufcg.edu.br"
              style="color:var(--roxo-escuro);font-weight:600;text-decoration:none;">caesi@ccc.ufcg.edu.br</a>
          </div>
          <div style="display:flex;align-items:center;gap:10px;font-size:0.92rem;color:var(--preto);">
            <span v-html="instagramIcon" style="display:flex;flex-shrink:0;color:var(--roxo-escuro);width:17px;height:17px;"></span>
            <a href="https://instagram.com/caesiufcg" target="_blank" rel="noopener"
              style="color:var(--roxo-escuro);font-weight:600;text-decoration:none;">@caesiufcg</a>&nbsp;no Instagram
          </div>
        </div>
      </div>
    </div>

    <SiteFooter />
  </div>
</template>

<style scoped>
.equipe-carrossel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.5rem;
}
.equipe-carrossel::-webkit-scrollbar { height: 4px; }
.equipe-carrossel::-webkit-scrollbar-track { background: var(--creme-escuro); border-radius: 2px; }
.equipe-carrossel::-webkit-scrollbar-thumb { background: var(--roxo); border-radius: 2px; }

.membro-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 1.2rem 0.8rem 1rem;
  gap: 0.35rem;
  flex: 0 0 180px;
  scroll-snap-align: start;
}

.membro-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
}

.membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 1.6rem;
  color: var(--creme);
  line-height: 1;
}

.membro-nome {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--preto);
  line-height: 1.3;
}

.membro-periodo {
  font-size: 0.69rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  background: rgba(80,64,160,0.1);
  color: var(--roxo-escuro);
  border: 1px solid rgba(80,64,160,0.22);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 4px;
}

.membro-email {
  font-size: 0.76rem;
  color: var(--cinza);
  margin-top: 4px;
  word-break: break-all;
}

.membro-desc {
  font-size: 0.78rem;
  color: var(--preto);
  opacity: 0.65;
  line-height: 1.5;
  margin-top: 6px;
  text-align: center;
}

.membro-links {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.membro-link {
  font-size: 0.67rem;
  font-weight: 700;
  font-family: 'Archivo Black', sans-serif;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1.5px solid var(--roxo);
  color: var(--roxo-escuro);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 0.15s, color 0.15s;
}
.membro-link:hover { background: var(--roxo); color: var(--creme); }

.gestao-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.chapa-nome {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--roxo);
  margin-top: 4px;
}

.chapa-periodo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--cinza);
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: center;
}

.gestao-desc {
  margin-top: 1.6rem;
  padding-top: 1.4rem;
  border-top: 1.5px solid var(--creme-escuro);
}

.gestao-texto {
  font-size: 0.95rem;
  color: var(--preto);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
}

/* Gestões anteriores */
.hist-lista { display: flex; flex-direction: column; gap: 0.5rem; }

.hist-item {
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  overflow: hidden;
}

.hist-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px 16px;
  background: var(--branco);
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.hist-header:hover { background: rgba(80,64,160,0.04); }

.hist-header-info { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.hist-chapa { font-size: 0.92rem; font-weight: 700; color: var(--roxo-escuro); }
.hist-periodo { font-size: 0.78rem; color: var(--cinza); }

.hist-chevron {
  font-size: 1.1rem;
  color: var(--cinza);
  flex-shrink: 0;
  transition: transform 0.2s;
  line-height: 1;
}
.hist-chevron.aberto { transform: rotate(180deg); }

.hist-body {
  padding: 1rem 1.2rem 1.2rem;
  border-top: 1.5px solid var(--creme-escuro);
  background: var(--creme);
}

.hist-desc {
  font-size: 0.88rem;
  color: var(--preto);
  line-height: 1.75;
  margin: 0 0 1rem;
  white-space: pre-line;
}

.hist-membros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
}

.hist-membro {
  background: var(--branco);
  border: 1.5px solid var(--creme-escuro);
  border-radius: 2px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.hist-membro-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--roxo-escuro);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 4px;
}

.hist-membro-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hist-membro-inicial {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.1rem;
  color: var(--creme);
  line-height: 1;
}
</style>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Navbar from '../components/Navbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import BackLink from '../components/BackLink.vue'

const titulos = [
  { id: 'titulo-1', num: 'I',   texto: 'Princípios e Finalidades' },
  { id: 'titulo-2', num: 'II',  texto: 'Direitos e Deveres dos Filiados' },
  { id: 'titulo-3', num: 'III', texto: 'Administração e Atribuições' },
  { id: 'titulo-4', num: 'IV',  texto: 'Patrimônio e Recursos Financeiros' },
  { id: 'titulo-5', num: 'V',   texto: 'Processos Eleitorais' },
  { id: 'titulo-6', num: 'VI',  texto: 'Penalidades' },
  { id: 'titulo-7', num: 'VII', texto: 'Anexos' },
]

function ir(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const activeId   = ref('titulo-1')
const tocAberto  = ref(true)
let observer

onMounted(() => {
  const sections = document.querySelectorAll('.est-titulo')
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) activeId.value = entry.target.id
      })
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  )
  sections.forEach(s => observer.observe(s))
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="page">
    <div class="deco-star" style="top:160px;right:2%;font-size:1.3rem;opacity:0.3;">✦</div>
    <div class="deco-star" style="top:700px;left:1.5%;font-size:1rem;opacity:0.2;">✦</div>

    <Navbar />

    <div class="home-section" style="padding-top:3.5rem;flex:1;">
      <BackLink to="/" style="margin-bottom:1.2rem;" />
      <div class="section-label">Documentação oficial</div>
      <h1 class="section-title">Estatuto do <span>CAESI</span></h1>

      <!-- Meta -->
      <div class="paper paper-mb-lg est-meta">
        <div>
          <div class="label-sm">Entidade</div>
          <div class="est-meta-val">Centro Acadêmico dos Estudantes de Ciência da Computação — CAESI</div>
        </div>
        <div>
          <div class="label-sm">Sede</div>
          <div class="est-meta-val">Rua Aprígio Veloso, 822 — Bodocongó, Campina Grande – PB</div>
        </div>
        <div>
          <div class="label-sm">Sigla</div>
          <div class="est-meta-val" style="font-weight:700;">CAESI</div>
          <div style="font-size:0.78rem;color:var(--cinza);margin-top:2px;">Centro Acadêmico dos Estudantes de Informática</div>
        </div>
      </div>

      <!-- ─── TÍTULO I ──────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-1">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO I</div>
            <div class="est-titulo-texto">Do Centro Acadêmico de Ciência da Computação,<br>seus Princípios e Finalidades</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">I</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Da Entidade</h3>
          <div class="art">
            <p><strong>Art. 1º</strong> O "Centro Acadêmico dos Estudantes de Ciência da Computação" é órgão de coordenação e representação do corpo discente do Bacharelado em Ciência da Computação da UFCG, com sede na Rua Aprígio Veloso, 822, Bodocongó, Campina Grande – PB.</p>
            <p class="par">§ 1º A entidade utiliza a sigla <strong>CAESI</strong> (Centro Acadêmico dos Estudantes de Informática).</p>
            <p class="par">§ 2º O poder emana dos estudantes de graduação do curso.</p>
            <p class="par">§ 3º A Diretoria atua com independência de órgãos governamentais ou não-governamentais.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Dos Princípios e Finalidades</h3>
          <div class="art">
            <p><strong>Art. 2º</strong> São finalidades do CAESI:</p>
            <ol class="incisos" type="I">
              <li>Congregar e representar estudantes, promovendo sua união em torno de problemas e defesa de direitos;</li>
              <li>Promover aproximação e solidariedade entre os corpos discente, docente, técnico-administrativo e a comunidade;</li>
              <li>Manter relações com demais órgãos de representação estudantil;</li>
              <li>Fomentar o respeito aos direitos humanos e às liberdades individuais.</li>
            </ol>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo III — Do Estatuto</h3>
          <div class="art">
            <p><strong>Art. 3º</strong> Os artigos do estatuto são identificados por numeração ordinal seguida de um número entre parênteses que indica a categoria de modificação. A numeração ordinal é única em todo o documento.</p>
          </div>
          <div class="art">
            <p><strong>Art. 4º</strong> Os artigos são classificados em 5 categorias conforme o quórum exigido para alteração:</p>
            <div class="est-table-wrap">
              <table class="est-table">
                <thead><tr><th>Categoria</th><th>Formato</th><th>Quórum</th></tr></thead>
                <tbody>
                  <tr><td>0</td><td>Virtual ou presencial</td><td>50% + 1</td></tr>
                  <tr><td>1</td><td>Virtual ou presencial</td><td>2/3</td></tr>
                  <tr><td>2</td><td>Presencial</td><td>50% + 1</td></tr>
                  <tr><td>3</td><td>Presencial</td><td>2/3</td></tr>
                  <tr><td>4</td><td>Presencial</td><td>95%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="art">
            <p><strong>Art. 5º</strong> Qualquer membro pode solicitar à Diretoria Geral a adição, alteração ou remoção de artigos.</p>
            <p class="par"><strong>Parágrafo único.</strong> Solicitações aprovadas pela Diretoria são discutidas em Assembleia Geral.</p>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO II ─────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-2">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO II</div>
            <div class="est-titulo-texto">Dos Direitos e Deveres dos Filiados</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">II</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Dos Filiados</h3>
          <div class="art">
            <p><strong>Art. 6º</strong> São membros do CAESI todos os estudantes com vínculo ativo ao curso de Bacharelado em Ciência da Computação da UFCG.</p>
            <p class="par"><strong>Parágrafo único.</strong> A desvinculação ocorre por jubilação, cancelamento de matrícula ou aplicação de punição prevista neste estatuto.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Dos Direitos</h3>
          <div class="art">
            <p><strong>Art. 7º</strong> Aos membros é assegurado:</p>
            <ol class="incisos" type="I">
              <li>Assistir e participar em qualquer reunião ou instância deliberativa do CAESI;</li>
              <li>Usufruir dos benefícios oferecidos pela entidade;</li>
              <li>Votar e ser votado para cargos eletivos;</li>
              <li>Os demais direitos previstos neste estatuto.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 8º</strong> Nenhum membro poderá ser punido sem que lhe seja garantida ciência prévia da acusação e oportunidade de defesa.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo III — Dos Deveres</h3>
          <div class="art">
            <p><strong>Art. 9º</strong> São deveres dos membros:</p>
            <ol class="incisos" type="I">
              <li>Respeitar e cumprir as disposições deste estatuto;</li>
              <li>Acatar as decisões das instâncias deliberativas;</li>
              <li>Participar das atividades quando convocado;</li>
              <li>Zelar pelo patrimônio histórico, moral e material do CAESI;</li>
              <li>Zelar pela sede do CAESI;</li>
              <li>Indenizar o CAESI por danos causados ao patrimônio;</li>
              <li>Levar ao conhecimento da Diretoria fatos relevantes à entidade.</li>
            </ol>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO III ────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-3">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO III</div>
            <div class="est-titulo-texto">Da Administração e Atribuições Específicas</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">III</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Da Administração</h3>
          <div class="art">
            <p><strong>Art. 10º</strong> São órgãos administrativos do CAESI:</p>
            <ol class="incisos" type="I">
              <li>Assembleia Geral;</li>
              <li>Diretoria.</li>
            </ol>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Da Assembleia Geral</h3>

          <div class="art">
            <p><strong>Art. 11º</strong> A Assembleia Geral é o órgão máximo de deliberação do CAESI.</p>
            <p class="par">§ 1º Todos os membros têm direito a voz e voto.</p>
            <p class="par">§ 2º A pauta é previamente definida; a discussão ocorre na ordem estabelecida; a elaboração de ata é obrigatória.</p>
            <p class="par">§ 3º As decisões tomadas são de cumprimento obrigatório.</p>
            <p class="par">§ 4º A Assembleia é presidida por membro da Diretoria, exceto quando esta for acusada de irregularidades.</p>
          </div>
          <div class="art">
            <p><strong>Art. 12º</strong> A Assembleia Geral pode ser realizada em caráter Ordinário ou Extraordinário.</p>
          </div>

          <h4 class="est-secao">Seção I — Da Assembleia Geral Ordinária</h4>

          <div class="art">
            <p><strong>Art. 13º</strong> A convocação da Assembleia Geral Ordinária compete exclusivamente aos membros da Diretoria, podendo ocorrer em qualquer dia, exceto em período de recesso escolar.</p>
            <p class="par">§ 1º O prazo mínimo de antecedência para convocação é de 7 (sete) dias corridos.</p>
            <p class="par">§ 2º A convocação deve ser realizada com pauta e local definidos, disponibilizando lista para assinatura dos interessados.</p>
            <p class="par">§ 3º A lista de interessados fica disponível por 5 (cinco) dias corridos; a assinatura não obriga presença.</p>
            <p class="par">§ 4º O número de assinaturas de não-diretores deve ser maior que o de diretores.</p>
            <p class="par">§ 5º O quórum mínimo é de 60% dos interessados.</p>
            <p class="par">§ 6º O descumprimento de qualquer parágrafo deste artigo invalida a assembleia.</p>
          </div>
          <div class="art">
            <p><strong>Art. 14º</strong> A Assembleia Geral Ordinária pode ser realizada em plataforma eletrônica acessível via laboratórios do curso.</p>
            <p class="par">§ 1º A plataforma deve permitir participação exclusiva de membros, suporte a votações e histórico acessível.</p>
            <p class="par">§ 2º Os membros são identificados por identificador único.</p>
            <p class="par">§ 3º Os demais procedimentos seguem o artigo anterior.</p>
            <p class="par">§ 4º Deve conter enquete de aprovação; a lista de presença é composta pelos votantes.</p>
            <p class="par">§ 5º O descumprimento invalida a assembleia.</p>
          </div>

          <h4 class="est-secao">Seção II — Da Assembleia Geral Extraordinária</h4>

          <div class="art">
            <p><strong>Art. 15º</strong> Qualquer membro pode convocar a Assembleia Geral Extraordinária, podendo ocorrer em qualquer dia do ano.</p>
            <p class="par">§ 1º Deve ser realizada no campus Campina Grande, em caráter público.</p>
            <p class="par">§ 2º O prazo mínimo de antecedência é de 2 (dois) dias corridos, com pauta e local obrigatoriamente definidos.</p>
            <p class="par">§ 3º O quórum mínimo é de 50 (cinquenta) membros.</p>
            <p class="par">§ 4º O descumprimento invalida a assembleia.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo III — Da Diretoria</h3>

          <div class="art">
            <p><strong>Art. 16º</strong> A Diretoria é o órgão executivo e legislativo do CAESI, constituída pelas seguintes diretorias:</p>
            <ul class="incisos-ul">
              <li><strong>Diretoria Geral</strong> — composta por todos os Diretores;</li>
              <li><strong>Diretorias Executivas:</strong> Administrativa, Assistência Estudantil, Cultura e Lazer, e Financeira;</li>
              <li><strong>Diretorias Provisórias</strong> — criadas conforme necessidade.</li>
            </ul>
            <p class="par">§ 1º As reuniões ordinárias ocorrem em períodos indeterminados, com aviso de no mínimo 2 dias de antecedência e pauta previamente definida; a elaboração de ata é obrigatória.</p>
            <p class="par">§ 2º O quórum mínimo é de 50% dos membros da Diretoria.</p>
            <p class="par">§ 3º As Diretorias Provisórias são criadas em Assembleia Geral mediante submissão de projetos com objetivos e prazos definidos. O submissor recebe o título de Representante e deve informar as atividades à Diretoria Geral. Outros membros podem aderir na própria assembleia.</p>
          </div>
          <div class="art">
            <p><strong>Art. 17º</strong> O abandono da Diretoria pode ocorrer:</p>
            <ol class="incisos" type="I">
              <li>Por documentação assinada pela maioria dos membros da Diretoria;</li>
              <li>Por documento subscrito por 50% ou mais dos alunos do curso, garantindo à Diretoria prazo de 15 dias para apresentar defesa em Assembleia.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 18º</strong> Cada diretoria é composta por um diretor e ao menos um membro executivo.</p>
            <p class="par"><strong>Parágrafo único.</strong> Na ausência do diretor, um membro executivo pode ser nomeado substituto.</p>
          </div>
          <div class="art">
            <p><strong>Art. 19º</strong> A Diretoria Geral pode extinguir ou criar diretorias mediante aprovação em Assembleia Geral.</p>
          </div>
          <div class="art">
            <p><strong>Art. 20º</strong> Cada Diretoria é responsável pela divulgação de suas atividades.</p>
          </div>

          <h4 class="est-secao">Seção I — Das Atribuições dos Integrantes da Diretoria</h4>

          <div class="art">
            <p><strong>Art. 21º</strong> Compete à Diretoria Geral:</p>
            <ol class="incisos" type="I">
              <li>Representar o CAESI em juízo ou extrajudicialmente;</li>
              <li>Executar as decisões da Assembleia Geral;</li>
              <li>Convocar e presidir a Assembleia Geral e as reuniões;</li>
              <li>Aprovar movimentações de recursos financeiros;</li>
              <li>Modificar o estatuto mediante aprovação em Assembleia.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 22º</strong> Compete à Diretoria Administrativa:</p>
            <ol class="incisos" type="I">
              <li>Secretariar assembleias e reuniões; lavrar e assinar atas;</li>
              <li>Redigir e expedir documentos, assinando em conjunto com membro da Diretoria Geral;</li>
              <li>Zelar e guardar os documentos do CAESI;</li>
              <li>Elaborar plano de custos de eventos e disponibilizá-lo à Diretoria Financeira.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 23º</strong> Compete à Diretoria de Assistência Estudantil:</p>
            <ol class="incisos" type="I">
              <li>Recolher demandas dos membros;</li>
              <li>Auxiliar alunos com dificuldades, promovendo monitores e grupos de estudo;</li>
              <li>Promover palestras, reuniões, exposições, minicursos e eventos científicos;</li>
              <li>Elaborar plano de custos e disponibilizá-lo à Diretoria Financeira.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 24º</strong> Compete à Diretoria de Cultura e Lazer:</p>
            <ol class="incisos" type="I">
              <li>Divulgar as atividades do CAESI;</li>
              <li>Manter-se informada das atividades de outras secretarias e órgãos da UFCG;</li>
              <li>Realizar e promover competições internas e externas;</li>
              <li>Dar manutenção ao material esportivo;</li>
              <li>Realizar e promover eventos internos e externos;</li>
              <li>Organizar e publicar plano de custo para eventos.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 25º</strong> Compete à Diretoria Financeira:</p>
            <ol class="incisos" type="I">
              <li>Exercer controle direto dos bens materiais do CAESI;</li>
              <li>Elaborar plano de finanças;</li>
              <li>Zelar e guardar documentos e livros contábeis;</li>
              <li>Prestar contas em Assembleia Geral (balanço anual e final de gestão);</li>
              <li>Disponibilizar prestação de contas mensal em plataforma digital.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 26º</strong> Compete às Diretorias Provisórias cumprir o papel designado em Assembleia Geral, sendo dissolvidas após a conclusão das atividades.</p>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO IV ─────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-4">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO IV</div>
            <div class="est-titulo-texto">Do Patrimônio e dos Recursos Financeiros</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">IV</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Do Patrimônio</h3>
          <div class="art">
            <p><strong>Art. 27º</strong> O patrimônio do CAESI é constituído por bens móveis e imóveis adquiridos por compra, doação ou legado, bem como por dados, registros e documentos da entidade.</p>
          </div>
          <div class="art">
            <p><strong>Art. 28º</strong> Os bens patrimoniais são inalienáveis, salvo decisão contrária em Assembleia Geral.</p>
            <p class="par"><strong>Parágrafo único.</strong> Os bens devem ser catalogados, tombados e publicados em plataforma de acesso universal.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Da Arrecadação dos Recursos Financeiros</h3>
          <div class="art">
            <p><strong>Art. 29º</strong> Os recursos do CAESI são provenientes de:</p>
            <ol class="incisos" type="I">
              <li>Repasse das Carteiras de Estudante;</li>
              <li>Rendas de promoções culturais, artísticas, esportivas, recreativas, técnicas e científicas;</li>
              <li>Patrocínios das atividades citadas;</li>
              <li>Doações.</li>
            </ol>
            <p class="par"><strong>Parágrafo único.</strong> Doações requerem documentação elaborada pela Diretoria Financeira.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo III — Dos Gastos e Prestação de Contas</h3>
          <div class="art">
            <p><strong>Art. 30º</strong> São gastos de manutenção do CAESI:</p>
            <ol class="incisos" type="I">
              <li>Material de escritório;</li>
              <li>Material de limpeza;</li>
              <li>Bens patrimoniais do CAESI.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 31º</strong> São gastos para eventos do CAESI:</p>
            <ol class="incisos" type="I">
              <li>Publicidade;</li>
              <li>Alimentação;</li>
              <li>Espaço;</li>
              <li>Equipamento;</li>
              <li>Transporte;</li>
              <li>Terceiros.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 32º</strong> Semestralmente, a Diretoria Financeira realiza balanço patrimonial, publicando a demonstração em plataforma de acesso universal para fins de auditoria. Irregularidades identificadas exigem denúncia formal.</p>
            <p class="par"><strong>Parágrafo único.</strong> Conflito de interesses em gastos requer votação interna; em caso de empate, o voto de minerva cabe ao Diretor Financeiro.</p>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO V ──────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-5">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO V</div>
            <div class="est-titulo-texto">Dos Processos Eleitorais</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">V</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Das Eleições</h3>
          <div class="art">
            <p><strong>Art. 33º</strong> As eleições são geridas por uma Comissão Eleitoral durante o período de aulas e compreendem:</p>
            <ol class="incisos" type="I">
              <li>Divulgação do período eleitoral;</li>
              <li>Registro prévio das chapas;</li>
              <li>Homologação das chapas;</li>
              <li>Formação da Comissão Eleitoral;</li>
              <li>Realização do voto sigiloso com inviolabilidade das urnas.</li>
            </ol>
            <p class="par">§ 1º Os candidatos se organizam em chapas, que devem exibir plano de propostas e os nomes com respectivos cargos.</p>
            <p class="par">§ 2º O voto é livre e secreto.</p>
            <p class="par">§ 3º Em caso de empate, realiza-se nova votação.</p>
            <p class="par">§ 4º O quórum mínimo é de 10% dos membros votantes (15% em caso de chapa única).</p>
          </div>
          <div class="art">
            <p><strong>Art. 34º</strong> O mandato da Diretoria eleita é de no máximo 1 (um) ano corrido a partir da posse.</p>
            <p class="par"><strong>Parágrafo único.</strong> Em caso de greve, a contagem do mandato é interrompida.</p>
          </div>
          <div class="art">
            <p><strong>Art. 35º</strong> O período eleitoral inicia-se 45 dias antes do fim da gestão vigente, com 15 dias reservados para a formação de chapas.</p>
            <p class="par">§ 1º A gestão vigente divulga as datas. Em caso de abandono, a Assembleia Geral convoca novo processo.</p>
            <p class="par">§ 2º Um fiscal da gestão vigente homologa as chapas; este não pode ser candidato.</p>
            <p class="par">§ 3º Para homologação, o candidato deve: estar regularmente matriculado no curso; não disputar 2ª reeleição consecutiva; e não estar sob punição.</p>
            <p class="par">§ 4º Debate entre chapas é realizado até 4 dias antes do pleito, mediado pela Comissão Eleitoral.</p>
            <p class="par">§ 5º O voto ocorre em urna(s), com quantidade e local definidos pela Comissão.</p>
            <p class="par">§ 6º A apuração e a divulgação do resultado ocorrem no mesmo dia da votação.</p>
            <p class="par">§ 7º A posse deve acontecer em no máximo 1 (uma) semana após a divulgação do resultado.</p>
            <p class="par">§ 8º A reeleição é permitida.</p>
            <p class="par">§ 9º Não sendo legitimada a eleição, a Comissão reinicia o processo no dia seguinte.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Da Comissão Eleitoral</h3>
          <div class="art">
            <p><strong>Art. 36º</strong> A Comissão Eleitoral é composta por 1 (um) membro indicado por cada chapa por urna, mais 1 (um) fiscal da gestão vigente.</p>
            <p class="par">§ 1º As chapas devem indicar seus fiscais, cada qual com direito a 1 suplente.</p>
            <p class="par">§ 2º A Comissão tem legitimidade exclusiva para deliberar sobre assuntos eleitorais; a gestão vigente não pode interferir em suas decisões.</p>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO VI ─────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-6">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO VI</div>
            <div class="est-titulo-texto">Das Penalidades</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">VI</span>
        </div>

        <div class="est-cap-section">
          <div class="art">
            <p><strong>Art. 37º</strong> Todos os membros são passíveis de penalidades por descumprimento deste estatuto.</p>
          </div>
          <div class="art">
            <p><strong>Art. 38º</strong> Qualquer membro do departamento pode realizar uma denúncia.</p>
          </div>
          <div class="art">
            <p><strong>Art. 39º</strong> Em caso de irregularidade pela Diretoria, a Assembleia Geral poderá suspender suas atividades por tempo determinado, nomeando uma comissão sindicante para as devidas apurações.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo I — Da Denúncia</h3>
          <div class="art">
            <p><strong>Art. 40º</strong> A denúncia, devidamente documentada, deve ser submetida a um membro da Diretoria Administrativa.</p>
            <p class="par">§ 1º A Diretoria Geral disponibiliza formulário acessível para esse fim.</p>
            <p class="par">§ 2º O formulário, definido em comum acordo pela Diretoria Administrativa, deve conter: membro(s) denunciado(s), descrição da denúncia e e-mail do(s) denunciante(s).</p>
            <p class="par">§ 3º Após o recebimento, a Diretoria Administrativa: notifica o denunciado (garantindo anonimato do denunciante); documenta o relato do denunciado; e cria uma comissão avaliadora.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo II — Da Comissão Avaliadora</h3>
          <div class="art">
            <p><strong>Art. 41º</strong> A Comissão Avaliadora tem por objetivo confirmar a validade da denúncia.</p>
          </div>
          <div class="art">
            <p><strong>Art. 42º</strong> É formada por membros da Diretoria Geral e membros do CAESI convocados por sorteio.</p>
            <p class="par">§ 1º A quantidade de membros é definida pela Diretoria Administrativa.</p>
            <p class="par">§ 2º Não pode haver maioria de membros de uma mesma Diretoria.</p>
          </div>
          <div class="art">
            <p><strong>Art. 43º</strong> A denúncia é considerada inválida se não infringir artigo do estatuto ou não for comprovadamente verdadeira.</p>
            <p class="par">§ 1º Denúncias inválidas são justificadas, documentadas com assinaturas e entregues ao denunciante; o denunciado é notificado.</p>
            <p class="par">§ 2º Denúncias válidas são justificadas, documentadas com assinaturas e encaminhadas ao júri, preservando o anonimato de ambas as partes.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo III — Do Júri</h3>
          <div class="art">
            <p><strong>Art. 44º</strong> O Júri tem por objetivo absolver ou condenar o denunciado.</p>
          </div>
          <div class="art">
            <p><strong>Art. 45º</strong> É formado exclusivamente por membros do CAESI convocados por sorteio.</p>
            <p class="par">§ 1º O número de membros é igual ao da Comissão Avaliadora.</p>
            <p class="par">§ 2º A reunião é mediada pelo presidente da Diretoria Administrativa.</p>
          </div>
          <div class="art">
            <p><strong>Art. 46º</strong> A condenação requer maioria dos membros do Júri.</p>
            <p class="par"><strong>Parágrafo único.</strong> A decisão é declarativa e não documentada.</p>
          </div>
          <div class="art">
            <p><strong>Art. 47º</strong> A punição é determinada com base na categoria do artigo infringido:</p>
            <ol class="incisos" type="I">
              <li><strong>Peso 0:</strong> perda do direito a voz na próxima assembleia;</li>
              <li><strong>Peso 1:</strong> perda do direito a voz e voto na próxima assembleia;</li>
              <li><strong>Peso 2:</strong> perda do direito a voz nas próximas 6 assembleias;</li>
              <li><strong>Peso 3:</strong> perda do direito a voz e voto nas próximas 6 assembleias, com impedimento de participar de atividades;</li>
              <li><strong>Peso 4:</strong> perda do direito a voz e voto nas próximas 12 assembleias, com impedimento de participar de atividades.</li>
            </ol>
          </div>
          <div class="art">
            <p><strong>Art. 48º</strong> Após a decisão, a denúncia documentada com assinaturas do Júri é entregue ao presidente da Diretoria Administrativa.</p>
            <p class="par">§ 1º Cabe à Diretoria Administrativa notificar o denunciante e o denunciado.</p>
            <p class="par">§ 2º A condenação é anunciada na próxima Assembleia Geral, preservando o anonimato do denunciante.</p>
          </div>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Capítulo IV — Do Sorteio de Convocação</h3>
          <div class="art">
            <p><strong>Art. 49º</strong> As convocações por sorteio são realizadas pela Diretoria Administrativa.</p>
          </div>
          <div class="art">
            <p><strong>Art. 50º</strong> O sorteio parte da lista de presença da última Assembleia Geral.</p>
            <p class="par">§ 1º Se o sorteado for membro de diretoria, o sorteio é repetido.</p>
            <p class="par">§ 2º Se for impossível compor a lista exclusivamente da última Assembleia, agrega-se a lista de qualquer Assembleia anterior e a lista de presença de cadeira do terceiro período.</p>
          </div>
        </div>
      </section>

      <!-- ─── TÍTULO VII ────────────────────────────────────────── -->
      <section class="est-titulo paper paper-mb-lg" id="titulo-7">
        <div class="est-titulo-header">
          <div>
            <div class="est-titulo-num">TÍTULO VII</div>
            <div class="est-titulo-texto">Anexos</div>
          </div>
          <span class="est-titulo-deco" aria-hidden="true">VII</span>
        </div>

        <div class="est-cap-section">
          <h3 class="est-cap">Anexo I — Critério de Modificação de Artigos</h3>
          <p style="font-size:0.88rem;color:var(--cinza);margin-bottom:1rem;">
            Relação entre a categoria de um artigo e o quórum necessário para sua alteração em Assembleia Geral.
          </p>
          <div class="est-table-wrap">
            <table class="est-table">
              <thead>
                <tr><th>Categoria</th><th>Formato</th><th>Aprovação necessária</th></tr>
              </thead>
              <tbody>
                <tr><td>0</td><td>Virtual ou presencial</td><td>Maioria simples (50% + 1)</td></tr>
                <tr><td>1</td><td>Virtual ou presencial</td><td>2/3 dos presentes</td></tr>
                <tr><td>2</td><td>Presencial</td><td>Maioria simples (50% + 1)</td></tr>
                <tr><td>3</td><td>Presencial</td><td>2/3 dos presentes</td></tr>
                <tr><td>4</td><td>Presencial</td><td>95% dos presentes</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>

    <!-- Sumário flutuante -->
    <nav class="toc-sidebar" :class="{ 'toc-sidebar--fechado': !tocAberto }" aria-label="Sumário">
      <button class="toc-sidebar-title" @click="tocAberto = !tocAberto" :aria-expanded="tocAberto">
        Sumário
        <span class="toc-chevron" :class="{ 'toc-chevron--aberto': tocAberto }">▾</span>
      </button>
      <Transition name="toc-slide">
        <div v-show="tocAberto" class="toc-sidebar-body">
          <button
            v-for="t in titulos" :key="t.id"
            class="toc-sidebar-item"
            :class="{ 'toc-sidebar-ativo': activeId === t.id }"
            @click="ir(t.id)"
          >
            <span class="toc-sidebar-num" :class="{ 'toc-sidebar-num-ativo': activeId === t.id }">{{ t.num }}</span>
            <span class="toc-sidebar-texto">{{ t.texto }}</span>
          </button>
        </div>
      </Transition>
    </nav>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* ── Meta ────────────────────────────────────────────────── */
.est-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-start;
}
.est-meta-val {
  font-size: 0.95rem;
  color: var(--preto);
  margin-top: 4px;
}

/* ── Título ──────────────────────────────────────────────── */
.est-titulo {
  scroll-margin-top: 5rem;
}
.est-titulo.paper::before {
  background: var(--amarelo);
}
.est-titulo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: -2rem -2rem 1.8rem;
  padding: 1.1rem 2rem;
  background: var(--amarelo);
  border-radius: 2px 2px 0 0;
  overflow: hidden;
}
.est-titulo-num {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 800;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: rgba(80, 64, 160, 0.6);
  text-transform: uppercase;
  margin-bottom: 4px;
}
.est-titulo-texto {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.35;
  color: var(--roxo-escuro);
}
.est-titulo-deco {
  font-family: 'Archivo Black', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  color: rgba(80, 64, 160, 0.12);
  line-height: 1;
  flex-shrink: 0;
  user-select: none;
  letter-spacing: -0.02em;
}

/* ── Seções de Capítulo ──────────────────────────────────── */
.est-cap-section + .est-cap-section {
  border-top: 1.5px solid var(--creme-escuro);
  margin-top: 1.8rem;
  padding-top: 1.8rem;
}

/* ── Capítulo / Seção ────────────────────────────────────── */
.est-cap {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--roxo-escuro);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1.2rem;
}
.est-secao {
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--roxo);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 1.6rem 0 1rem;
  padding-left: 0.7rem;
  border-left: 3px solid var(--roxo);
}

/* ── Artigos ─────────────────────────────────────────────── */
.art {
  margin-bottom: 1.1rem;
}
.art:last-child { margin-bottom: 0; }
.art p {
  font-size: 0.93rem;
  color: var(--preto);
  line-height: 1.8;
  margin: 0;
}
.art p > strong:first-child {
  color: var(--roxo-escuro);
}
.par {
  margin-top: 0.45rem !important;
  padding-left: 1.2rem;
  border-left: 2px solid rgba(80, 64, 160, 0.2);
}

/* ── Listas ──────────────────────────────────────────────── */
.incisos {
  margin: 0.6rem 0 0;
  padding-left: 2rem;
  font-size: 0.93rem;
  color: var(--preto);
  line-height: 1.8;
}
.incisos li { margin-bottom: 0.2rem; }
.incisos-ul {
  margin: 0.6rem 0 0;
  padding-left: 1.5rem;
  font-size: 0.93rem;
  color: var(--preto);
  line-height: 1.8;
  list-style: disc;
}
.incisos-ul li { margin-bottom: 0.3rem; }

/* ── Tabela ──────────────────────────────────────────────── */
.est-table-wrap { overflow-x: auto; margin-top: 0.8rem; }
.est-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}
.est-table th {
  background: var(--roxo-escuro);
  color: var(--creme);
  padding: 8px 14px;
  text-align: left;
  font-family: 'Archivo Black', sans-serif;
  font-weight: 700;
  font-size: 0.74rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.est-table td {
  padding: 8px 14px;
  border-bottom: 1px solid var(--creme-escuro);
  color: var(--preto);
}
.est-table tbody tr:last-child td { border-bottom: none; }
.est-table tbody tr:hover td { background: rgba(80, 64, 160, 0.05); }

/* ── Mobile ──────────────────────────────────────────────── */
@media (max-width: 600px) {
  .est-titulo-header { margin: -1.2rem -1.2rem 1.4rem; padding: 1rem 1.2rem; }
  .est-titulo-deco { font-size: 2.8rem; }
}

/* ── TOC Sidebar flutuante ───────────────────────────────── */
.toc-sidebar {
  display: none;
}

@media (min-width: 1280px) {
  .toc-sidebar {
    display: flex;
    flex-direction: column;
    gap: 3px;
    position: fixed;
    left: max(1.25rem, calc(50vw - 480px - 210px));
    top: 5.5rem;
    width: 188px;
    background: var(--creme);
    border-radius: 2px;
    padding: 0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
    z-index: 90;
    overflow: hidden;
  }
}

.toc-sidebar-title {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--roxo-escuro);
  padding: 0.7rem 0.9rem 0.6rem;
  background: var(--amarelo);
  border: none;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s;
}
.toc-sidebar-title:hover { background: var(--kraft); }

.toc-chevron {
  font-size: 0.9rem;
  line-height: 1;
  transition: transform 0.22s;
  transform: rotate(-90deg);
}
.toc-chevron--aberto { transform: rotate(0deg); }

.toc-slide-enter-active,
.toc-slide-leave-active {
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top;
}
.toc-slide-enter-from,
.toc-slide-leave-to {
  opacity: 0;
  transform: scaleY(0.92);
}

.toc-sidebar-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.6rem 0.6rem;
}

.toc-sidebar-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--branco);
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  text-align: left;
  padding: 6px 8px;
  border-radius: 0 2px 2px 0;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}
.toc-sidebar-item:hover {
  border-left-color: var(--roxo);
  background: rgba(80, 64, 160, 0.04);
}
.toc-sidebar-ativo {
  border-left-color: var(--roxo-escuro) !important;
  background: rgba(80, 64, 160, 0.09) !important;
}

.toc-sidebar-num {
  display: inline-block;
  background: var(--roxo-escuro);
  color: var(--creme);
  padding: 1px 5px;
  border-radius: 2px;
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.57rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  margin-top: 3px;
}
.toc-sidebar-num-ativo {
  background: var(--roxo);
}
.toc-sidebar-texto {
  font-size: 0.79rem;
  color: var(--preto);
  line-height: 1.3;
}

</style>

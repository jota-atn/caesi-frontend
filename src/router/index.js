import { createRouter, createWebHistory } from 'vue-router'

import HomeView            from '../views/HomeView.vue'
import SobreView           from '../views/SobreView.vue'
import EstatutoView        from '../views/EstatutoView.vue'
import ContatoView         from '../views/ContatoView.vue'
import LoginView           from '../views/LoginView.vue'
import CadastroView        from '../views/CadastroView.vue'
import PerfilView          from '../views/PerfilView.vue'
import MensagensView       from '../views/aluno/MensagensView.vue'
import NovaMensagemView    from '../views/aluno/NovaMensagemView.vue'
import MensagemEnviadaView from '../views/aluno/MensagemEnviadaView.vue'
import AlunoDetalheView    from '../views/aluno/DetalheView.vue'
import GeralView           from '../views/admin/GeralView.vue'
import PainelView          from '../views/admin/PainelView.vue'
import DetalheView         from '../views/admin/DetalheView.vue'
import UsuariosView        from '../views/admin/UsuariosView.vue'
import EquipeView          from '../views/admin/EquipeView.vue'
import NotFoundView        from '../views/NotFoundView.vue'

const routes = [
  { path: '/',                       component: HomeView },
  { path: '/sobre',                  component: SobreView },
  { path: '/estatuto',               component: EstatutoView },
  { path: '/contato',                component: ContatoView },
  { path: '/login',                  component: LoginView },
  { path: '/cadastro',               component: CadastroView },
  { path: '/perfil',                 component: PerfilView,          meta: { auth: true } },
  { path: '/aluno/mensagens',        component: MensagensView,       meta: { auth: true, aluno: true } },
  { path: '/aluno/nova-mensagem',    component: NovaMensagemView,    meta: { auth: true, aluno: true } },
  { path: '/aluno/enviada',          component: MensagemEnviadaView, meta: { auth: true, aluno: true } },
  { path: '/aluno/mensagem/:id',     component: AlunoDetalheView,    meta: { auth: true, aluno: true } },
  { path: '/admin',                  redirect: '/admin/painel' },
  { path: '/admin/painel',           component: GeralView,           meta: { auth: true, admin: true } },
  { path: '/admin/mensagens',        component: PainelView,          meta: { auth: true, admin: true } },
  { path: '/admin/mensagens/:id',    component: DetalheView,         meta: { auth: true, admin: true } },
  { path: '/admin/usuarios',         component: UsuariosView,        meta: { auth: true, admin: true } },
  { path: '/admin/equipe',           component: EquipeView,          meta: { auth: true, admin: true } },
  { path: '/:pathMatch(.*)*',        component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const stored = localStorage.getItem('caesi_user')
  const user = stored ? JSON.parse(stored) : null

  if (to.meta.auth && !user) return '/login'
  if (to.meta.admin && user?.role !== 'admin') return '/aluno/mensagens'
  if (to.meta.aluno && user?.role === 'admin') return '/admin/painel'
  if ((to.path === '/login' || to.path === '/cadastro') && user) {
    return user.role === 'admin' ? '/admin/painel' : '/aluno/mensagens'
  }
})

export default router

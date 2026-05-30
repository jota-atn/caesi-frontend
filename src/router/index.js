import { createRouter, createWebHistory } from 'vue-router'
import { user } from '../stores/auth.js'

const routes = [
  { path: '/',                       component: () => import('../views/HomeView.vue') },
  { path: '/sobre',                  component: () => import('../views/SobreView.vue') },
  { path: '/estatuto',               component: () => import('../views/EstatutoView.vue') },
  { path: '/contato',                component: () => import('../views/ContatoView.vue') },
  { path: '/login',                  component: () => import('../views/LoginView.vue') },
  { path: '/cadastro',               component: () => import('../views/CadastroView.vue') },
  { path: '/perfil',                 component: () => import('../views/PerfilView.vue'),                    meta: { auth: true } },
  { path: '/aluno/mensagens',        component: () => import('../views/aluno/MensagensView.vue'),           meta: { auth: true, aluno: true } },
  { path: '/aluno/nova-mensagem',    component: () => import('../views/aluno/NovaMensagemView.vue'),        meta: { auth: true, aluno: true } },
  { path: '/aluno/enviada',          component: () => import('../views/aluno/MensagemEnviadaView.vue'),     meta: { auth: true, aluno: true } },
  { path: '/aluno/mensagem/:id',     component: () => import('../views/aluno/DetalheView.vue'),             meta: { auth: true, aluno: true } },
  { path: '/admin',                  redirect: '/admin/painel' },
  { path: '/admin/painel',           component: () => import('../views/admin/GeralView.vue'),               meta: { auth: true, admin: true } },
  { path: '/admin/mensagens',        component: () => import('../views/admin/PainelView.vue'),              meta: { auth: true, admin: true } },
  { path: '/admin/mensagens/:id',    component: () => import('../views/admin/DetalheView.vue'),             meta: { auth: true, admin: true } },
  { path: '/admin/usuarios',         component: () => import('../views/admin/UsuariosView.vue'),            meta: { auth: true, admin: true } },
  { path: '/admin/equipe',           component: () => import('../views/admin/EquipeView.vue'),              meta: { auth: true, admin: true } },
  { path: '/:pathMatch(.*)*',        component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const u = user.value

  if (to.meta.auth && !u) return '/login'
  if (to.meta.admin && u?.role !== 'admin') return '/aluno/mensagens'
  if (to.meta.aluno && u?.role === 'admin') return '/admin/painel'
  if ((to.path === '/login' || to.path === '/cadastro') && u) {
    return u.role === 'admin' ? '/admin/painel' : '/aluno/mensagens'
  }
})

export default router

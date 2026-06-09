import { createRouter, createWebHistory } from 'vue-router'
import { isAdmin } from '../stores/auth.js'

const routes = [
  { path: '/',                       component: () => import('../views/HomeView.vue') },
  { path: '/sobre',                  component: () => import('../views/SobreView.vue') },
  { path: '/estatuto',               component: () => import('../views/EstatutoView.vue') },
  { path: '/contato',                component: () => import('../views/ContatoView.vue') },
  { path: '/ouvidoria/consulta',     component: () => import('../views/OuvidoriaConsultaView.vue') },
  { path: '/formularios',            component: () => import('../views/aluno/FormulariosView.vue') },
  { path: '/formularios/:id',        component: () => import('../views/aluno/FormularioDetalheView.vue') },
  { path: '/admin',                  component: () => import('../views/admin/LoginView.vue') },
  { path: '/admin/painel',           component: () => import('../views/admin/PainelView.vue'),              meta: { admin: true } },
  { path: '/admin/mensagens',        component: () => import('../views/admin/MensagensView.vue'),           meta: { admin: true } },
  { path: '/admin/mensagens/:id',    component: () => import('../views/admin/DetalheView.vue'),             meta: { admin: true } },
  { path: '/admin/equipe',           component: () => import('../views/admin/EquipeView.vue'),              meta: { admin: true } },
  { path: '/admin/formularios',      component: () => import('../views/admin/FormulariosView.vue'),         meta: { admin: true } },
  { path: '/admin/formularios/:id',  component: () => import('../views/admin/FormularioDetalheView.vue'),   meta: { admin: true } },
  { path: '/admin/tasks',            component: () => import('../views/admin/TasksView.vue'),               meta: { admin: true } },
  { path: '/:pathMatch(.*)*',        component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.admin && !isAdmin.value) return '/admin'
  if (to.path === '/admin' && isAdmin.value) return '/admin/painel'
})

export default router

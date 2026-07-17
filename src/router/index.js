import { createRouter, createWebHistory } from 'vue-router'
import { isAdmin, mustChangePassword } from '../stores/auth.js'

const routes = [
  { path: '/',                       component: () => import('../views/HomeView.vue') },
  { path: '/sobre',                  component: () => import('../views/SobreView.vue') },
  { path: '/estatuto',               component: () => import('../views/EstatutoView.vue') },
  { path: '/ouvidoria',              component: () => import('../views/OuvidoriaView.vue') },
  { path: '/ouvidoria/consulta',     component: () => import('../views/OuvidoriaConsultaView.vue') },
  { path: '/mural',                  component: () => import('../views/MuralView.vue') },
  { path: '/mural/:id',              component: () => import('../views/MuralDetalheView.vue') },
  { path: '/portal',                 component: () => import('../views/PortalView.vue') },
  { path: '/portal/:id',             component: () => import('../views/PortalDetalheView.vue') },
  { path: '/formularios',            component: () => import('../views/FormulariosView.vue') },
  { path: '/formularios/:id',        component: () => import('../views/FormularioDetalheView.vue') },
  { path: '/informacoes',                    component: () => import('../views/InformacoesView.vue') },
  { path: '/informacoes/editais',            component: () => import('../views/InformacoesEditaisView.vue') },
  { path: '/informacoes/tamburetei',         component: () => import('../views/InformacoesTamburereiView.vue') },
  { path: '/informacoes/professores',        component: () => import('../views/InformacoesProfessoresView.vue') },
  { path: '/informacoes/laboratorios',       component: () => import('../views/InformacoesLaboratoriosView.vue') },
  { path: '/informacoes/laboratorios/:id',   component: () => import('../views/LaboratorioDetalheView.vue') },
  { path: '/admin',                  component: () => import('../views/admin/LoginView.vue') },
  { path: '/admin/trocar-senha',     component: () => import('../views/admin/TrocarSenhaView.vue'),         meta: { admin: true } },
  { path: '/admin/painel',           component: () => import('../views/admin/PainelView.vue'),              meta: { admin: true } },
  { path: '/admin/mensagens',        component: () => import('../views/admin/MensagensView.vue'),           meta: { admin: true } },
  { path: '/admin/mensagens/:id',    component: () => import('../views/admin/DetalheView.vue'),             meta: { admin: true } },
  { path: '/admin/equipe',           component: () => import('../views/admin/EquipeView.vue'),              meta: { admin: true } },
  { path: '/admin/formularios',      component: () => import('../views/admin/FormulariosView.vue'),         meta: { admin: true } },
  { path: '/admin/formularios/:id',  component: () => import('../views/admin/FormularioDetalheView.vue'),   meta: { admin: true } },
  { path: '/admin/tasks',            component: () => import('../views/admin/TasksView.vue'),               meta: { admin: true } },
  { path: '/admin/mural',           component: () => import('../views/admin/MuralView.vue'),               meta: { admin: true } },
  { path: '/admin/calendario',      component: () => import('../views/admin/CalendarioView.vue'),          meta: { admin: true } },
  { path: '/admin/portal',          component: () => import('../views/admin/PortalView.vue'),               meta: { admin: true } },
  { path: '/admin/mapa',            component: () => import('../views/admin/MapaView.vue'),                 meta: { admin: true } },
  { path: '/admin/informacoes',                  component: () => import('../views/admin/InformacoesView.vue'),               meta: { admin: true } },
  { path: '/admin/informacoes/editais',          component: () => import('../views/admin/InformacoesEditaisView.vue'),        meta: { admin: true } },
  { path: '/admin/informacoes/tamburetei',       component: () => import('../views/admin/InformacoesTamburereiView.vue'),     meta: { admin: true } },
  { path: '/admin/informacoes/professores',      component: () => import('../views/admin/InformacoesProfessoresView.vue'),    meta: { admin: true } },
  { path: '/admin/informacoes/laboratorios',     component: () => import('../views/admin/InformacoesLaboratoriosView.vue'),   meta: { admin: true } },
  { path: '/workspace/:token',       component: () => import('../views/WorkspaceView.vue') },
  { path: '/cobrinha-caesi',         component: () => import('../views/CobrinhaView.vue') },
  { path: '/:pathMatch(.*)*',        component: () => import('../views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const path = to.path.length > 1 ? to.path.replace(/\/+$/, '') : to.path

  if (to.meta.admin && !isAdmin.value) return '/admin'
  if (to.meta.admin && mustChangePassword.value && path !== '/admin/trocar-senha') return '/admin/trocar-senha'
  if (path === '/admin' && isAdmin.value) return mustChangePassword.value ? '/admin/trocar-senha' : '/admin/painel'
})

export default router

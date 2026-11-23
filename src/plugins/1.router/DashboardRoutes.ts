import type { RouteRecordRaw } from 'vue-router'
import admin from '@/plugins/1.router/middlewares/admin'
import authenticated from '@/plugins/1.router/middlewares/authenticated'
import ensureCsrfTokenSet from '@/plugins/1.router/middlewares/ensureCsrfTokenSet'

const DashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'dashboard.index',
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated, admin],
      resource: 'dashboard',
    },
    component: () => import('../../views/pages/dashboard/Dashboard.vue'),
  },
]

export default DashboardRoutes

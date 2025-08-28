import ensureCsrfTokenSet from "@/plugins/1.router/middlewares/ensureCsrfTokenSet";
import guest from "@/plugins/1.router/middlewares/guest";
import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('../../views/pages/authentication/Login.vue'),
    meta: {
      middleware: [ensureCsrfTokenSet],
      title: 'Home'
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../../views/pages/authentication/Login.vue'),
    meta: {
      middleware: [ensureCsrfTokenSet],
      title: 'Login'
    },
  },
  {
    path: '/forget-password',
    name: 'forget_password',
    component: () => import('@/views/pages/authentication/Forgot.vue'),
    meta: {
      middleware: [ensureCsrfTokenSet, guest],
      title: 'Forget Password'
    },
  },
  {
    path: '/reset-password/:token/:email',
    name: 'reset_password',
    component: () => import('@/views/pages/authentication/Reset.vue'),
    meta: {
      middleware: [ensureCsrfTokenSet, guest],
      title: 'Forget Password'
    },
  },
];

export default routes;

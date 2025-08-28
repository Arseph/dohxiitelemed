import AuthRoutes from '@/plugins/1.router/AuthRoutes';
import middleware from '@/plugins/1.router/middlewares/middleware';
import ModuleRoutes from '@/plugins/1.router/ModuleRoutes';
import ProfileRoutes from '@/plugins/1.router/ProfileRoutes';
import { setupLayouts } from 'virtual:generated-layouts';
import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router/auto';
import { createRouter, createWebHistory } from 'vue-router/auto';
import store from '../../store';

function recursiveLayouts(route: RouteRecordRaw): RouteRecordRaw {
  if (route.children?.length) { // Optional chaining and length check
    for (let i = 0; i < route.children.length; i++) {
      route.children[i] = recursiveLayouts(route.children[i]);
    }
  }

  return setupLayouts([route])[0]; // Return the layout for the current route
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 60 };
    }
    return { top: 0 };
  },
  extendRoutes: () => [
    ...ModuleRoutes.map(route => recursiveLayouts(route)),
    ...ProfileRoutes.map(route => recursiveLayouts(route)),
    ...AuthRoutes
  ],
});

// Ensure middleware is properly handled with the store
router.beforeEach(middleware(store));

export { router };

export default function (app: App) {
  app.use(router);
}

import authenticated from "@/plugins/1.router/middlewares/authenticated";
import ensureCsrfTokenSet from "@/plugins/1.router/middlewares/ensureCsrfTokenSet";
import { RouteRecordRaw } from "vue-router";

// Define your dynamic modules with route metadata
const modules = [,
  { name: "homes", singular: "home" },
  { name: "tele", singular: "tele" },
];

// Generate routes dynamically based on the modules array
const generatedRoutes: Array<RouteRecordRaw> = modules.flatMap((module) => [
  {
    path: `/${module.name}`,
    name: `${module.name}.index`,
    meta: {
      resource: module.name,
    },
     component: () => loadComponent(module.name), // Dynamic imports for list views
   // component: () => import(`../../views/pages/${module.name}/List.vue`),
  },
  {
    path: `/${module.name}/create`,
    name: `${module.name}.create`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: module.name,
    },
    component: () => import(`../../views/pages/${module.name}/Form.vue`), // Dynamic imports for create form
  },
  {
    path: `/${module.name}/:id/edit`,
    name: `${module.name}.edit`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: module.name,
    },
    component: () => import(`../../views/pages/${module.name}/Form.vue`), // Dynamic imports for edit form
  },
  {
    path: `/${module.name}/view/:id`,
    name: `${module.name}.view`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: module.name,
    },
    component: () => import(`../../views/pages/${module.name}/View.vue`), // Dynamic imports for edit form
  },
]);
async function loadComponent(moduleName: string) {
  try {
    return await import(`../../views/pages/${moduleName}/List.vue`);
  } catch (error) {
    return import(`../../pages/coming-soon.vue`);
  }
}
export default generatedRoutes;

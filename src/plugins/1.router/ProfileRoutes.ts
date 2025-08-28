import authenticated from "@/plugins/1.router/middlewares/authenticated";
import ensureCsrfTokenSet from "@/plugins/1.router/middlewares/ensureCsrfTokenSet";
import { RouteRecordRaw } from "vue-router";

const ProfileRoutes: RouteRecordRaw[] = [
  {
    path: `/profile`,
    name: `profile.index`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: 'profile',
    },
    component: () => import(`../../views/pages/profile/Profile.vue`),
  },
  {
    path: `/profile/edit`,
    name: `profile.edit`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: 'profile_edit',
    },
    component: () => import(`../../views/pages/profile/Edit.vue`),
  },
  {
    path: `/profile/qrscan`,
    name: `profile.qrscan`,
    meta: {
      middleware: [ensureCsrfTokenSet, authenticated],
      resource: 'profile_qrscan',
    },
    component: () => import(`../../views/pages/profile/QrScanner.vue`),
  },
]

export default ProfileRoutes;

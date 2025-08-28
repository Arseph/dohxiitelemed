import { NavigationGuardNext } from "vue-router";
import { Store } from "vuex";

interface MiddlewareContext {
  next: NavigationGuardNext;
  store: Store<any>;
}

export default async function guest({ next, store }: MiddlewareContext): Promise<void | boolean> {
  if (!store.getters["auth/checked"]) {
    store.commit("auth/SET_CHECKED");
    await store.dispatch("auth/user");
  }

  if (store.getters["auth/authenticated"]) {
    next({ name: "home" });
    return false;
  }
}

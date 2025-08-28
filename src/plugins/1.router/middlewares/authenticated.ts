import { NavigationGuardNext } from "vue-router";
import { Store } from "vuex";

interface MiddlewareContext {
  next: NavigationGuardNext;
  store: Store<any>;
}

export default async function authenticated({ next, store }: MiddlewareContext): Promise<void | boolean> {
  // Fetch user if not already checked
  if (!store.getters["auth/checked"]) {
    store.commit("auth/SET_CHECKED");
    await store.dispatch("auth/user");
  }

  // Redirect to login if not authenticated
  if (!store.getters["auth/authenticated"]) {
    next({ name: "login" });
    return false;
  }
}

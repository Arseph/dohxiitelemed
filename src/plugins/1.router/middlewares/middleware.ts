import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import type { Store } from 'vuex';

export default (store: Store<any>) => async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> => {
  const middlewareArray = to.meta.middleware as Array<{
    (context: {
      store: Store<any>;
      to: RouteLocationNormalized;
      from: RouteLocationNormalized;
      next: NavigationGuardNext;
    }): Promise<boolean | void> | boolean | void;
  }> | undefined;

  if (middlewareArray) {
    for (const middleware of middlewareArray) {
      const result = await middleware({ store, to, from, next });
      if (result === false) {
        return; // Stop navigation if middleware returns false.
      }
    }
  }
  next(); // Proceed with navigation if all middleware passes.
};

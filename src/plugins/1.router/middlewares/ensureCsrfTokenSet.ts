import type { NavigationGuardNext } from 'vue-router'
import type { Store } from 'vuex'

export default async function ensureCsrfTokenSet({
  next,
  store,
}: {
  next: NavigationGuardNext
  store: Store<any>
}): Promise<void> {
  if (!document.cookie.includes('XSRF-TOKEN'))
    await store.dispatch('auth/generateCsrfToken')
}

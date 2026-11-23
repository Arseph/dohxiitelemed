import type { NavigationGuardNext } from 'vue-router'
import type { Store } from 'vuex'
import { canSeeDashboard } from '@/utils/roles'

interface MiddlewareContext {
  next: NavigationGuardNext
  store: Store<any>
}

// Run after `authenticated`: sends users canSeeDashboard refuses back to Home.
export default function admin({ next, store }: MiddlewareContext): void | boolean {
  if (!canSeeDashboard(store.getters['auth/user']?.level)) {
    next({ name: 'homes.index' })

    return false
  }
}

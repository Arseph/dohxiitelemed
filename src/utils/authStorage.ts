// Where the signed-in session lives, decided by "Remember me" at login:
//   remembered     -> localStorage: survives closing the browser
//   not remembered -> sessionStorage: cleared when the tab closes
// Always read through these helpers rather than localStorage directly, or a
// session that isn't remembered looks signed out.

const KEYS = ['auth_token', 'auth_user', 'auth_profile'] as const

type AuthKey = typeof KEYS[number]

// The store currently holding the token. A non-remembered session wins, because
// it is the more recent sign-in in this tab.
const activeStore = (): Storage =>
  sessionStorage.getItem('auth_token') ? sessionStorage : localStorage

export const authStorage = {
  get(key: AuthKey): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },

  // Writes next to the token, so cached user data never outlives the session it belongs to.
  set(key: AuthKey, value: string): void {
    activeStore().setItem(key, value)
  },

  startSession(token: string, remember: boolean): void {
    this.clear()
    ;(remember ? localStorage : sessionStorage).setItem('auth_token', token)
  },

  clear(): void {
    for (const key of KEYS) {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  },
}

export const getAuthToken = (): string | null => authStorage.get('auth_token')

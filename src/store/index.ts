import { createStore } from 'vuex'
import auth from './auth.store'
import type { RootState } from './types'

// Import other modules

// Create the Vuex store
const store = createStore<RootState>({
  modules: {
    auth,

    // Register other modules here
  },
  strict: process.env.NODE_ENV !== 'production',
})

export default store

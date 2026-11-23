import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { axiosIns } from '@/plugins/axios';
import { authStorage } from '@/utils/authStorage';
import type { Commit, Dispatch, Module } from 'vuex';
import type { RootState } from './types';

interface User {
  id: number;
  emp_id: number;
  username: string;
  fname?: string;
  mname?: string | null;
  lname?: string;
  title?: string | null;
  contact?: string | null;
  designation?: string | null;
  license_no?: string | null;
  picture?: string | null;
  facility?: { id: number; facilityname: string } | null;
  level: string;
  last_login: string | null;
  login_status: string;
  status: string;
  created_at: string | null;
  email: string | null;
  email_verified_at: string | null;
  is_committee: number;
  is_division_head: string;
  is_hr_admin: string;
  is_pdoho_head: number;
  is_section_head: string;
  is_superadmin: string;
  updated_at: string;
  void: number;
}

interface Profile {
  data: any;
}

export interface AuthState {
  checked: boolean
  user: User | null
  profile: Profile | null
}

const auth: Module<AuthState, RootState> = {
  namespaced: true,
  state: {
    checked: false,
    user: null,
    profile: null,
  },
  getters: {
    checked(state: AuthState): boolean {
      return state.checked
    },
    authenticated(state: AuthState): boolean {
      return !!state.user
    },
    user(state: AuthState): User | null {
      return state.user
    },
    profile(state: AuthState): Profile | null {
      return state.profile
    },
  },
  mutations: {
    SET_CHECKED(state: AuthState): void {
      state.checked = true
    },
    SET_USER(state: AuthState, value: User | null): void {
      state.user = value
      if (value) {
        authStorage.set('auth_user', JSON.stringify(value))
      }
    },
    SET_PROFILE(state: AuthState, value: Profile | null): void {
      state.profile = value
    },
  },
  actions: {
    async generateCsrfToken({ dispatch }: { dispatch: Dispatch }): Promise<void> {
      const cachedToken = authStorage.get('auth_token')
      if(!cachedToken) {
        await axiosIns.get('/sanctum/csrf-cookie')
      }
    },
    async login(
      { commit, dispatch }: { commit: Commit; dispatch: Dispatch },
      form: any
    ): Promise<void> {
      try {
        const response = await axiosIns.post('api/auth/login', form)
        const token = response.data.accessToken
        if (token) {
          authStorage.startSession(token, Boolean(form.remember))
          await dispatch('user')
        }
      } catch (error) {
        throw error
      }
    },
    async user({ commit }: { commit: Commit }): Promise<void> {
      const { isOnline } = useOnlineStatus()
      const cachedUser = authStorage.get('auth_user')
      try {
        if(!cachedUser) {
          if (isOnline.value) {
            const { data } = await axiosIns.get('/api/employee/me')
            commit('SET_USER', data)
          } else {
            if (cachedUser) {
              commit('SET_USER', JSON.parse(cachedUser))
            }
          }
        } else {
          if (!isOnline.value) {
            const { data } = await axiosIns.get('/api/employee/me')
            commit('SET_USER', data)
          } else {
            if (cachedUser) {
              commit('SET_USER', JSON.parse(cachedUser))
            }
          }
        }
      } catch {
        commit('SET_USER', null)
      } finally {
        commit('SET_CHECKED')
      }
    },

    // Bypasses the cached auth_user so profile pages show saved changes.
    async refreshUser({ commit }: { commit: Commit }): Promise<void> {
      const { data } = await axiosIns.get('/api/employee/me')
      commit('SET_USER', data)
    },

    async userProfile(): Promise<Blob | null> {
      try {
        const { data } = await axiosIns.get('/api/employee/profile-pic', { responseType: 'blob' })
        return data
      } catch {
        return null
      }
    },

    async logout({ commit }: { commit: Commit }): Promise<void> {
      try {
        await axiosIns.get('/api/auth/logout')
      } catch (_) {}
      authStorage.clear()
      commit('SET_USER', null)
      commit('SET_PROFILE', null)
      commit('SET_CHECKED')
    },
  },
}

export default auth

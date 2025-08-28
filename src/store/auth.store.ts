import { useOnlineStatus } from '@/composables/useOnlineStatus';
import { axiosIns } from '@/plugins/axios';
import type { Commit, Dispatch, Module } from 'vuex';
import type { RootState } from './types';

interface User {
  id: number;
  emp_id: number;
  username: string;
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
        localStorage.setItem('auth_user', JSON.stringify(value))
      }
    },
    SET_PROFILE(state: AuthState, value: Profile | null): void {
      state.profile = value
    },
  },
  actions: {
    async generateCsrfToken({ dispatch }: { dispatch: Dispatch }): Promise<void> {
      const cachedToken = localStorage.getItem('auth_token')
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
          localStorage.setItem('auth_token', token)
          await dispatch('user')
        }
      } catch (error) {
        throw error
      }
    },
    async user({ commit }: { commit: Commit }): Promise<void> {
      const { isOnline } = useOnlineStatus()
      const cachedUser = localStorage.getItem('auth_user')
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
    async profile({ commit }: { commit: Commit }): Promise<void> {
      const { isOnline } = useOnlineStatus()
      const cachedProfile = localStorage.getItem('auth_profile')
      try {
        if(!cachedProfile) {
          if (isOnline.value) {
            const { data } = await axiosIns.get('/api/employee/profile-pic', {
              responseType: 'blob',
            })
            localStorage.setItem('auth_profile', data)
            commit('SET_PROFILE', data)
          } else {
            if (cachedProfile) {
              commit('SET_PROFILE', cachedProfile)
            }
          }
        } else {
          const { data } = await axiosIns.get('/api/employee/profile-pic', {
            responseType: 'blob',
          })
          localStorage.setItem('auth_profile', data)
          commit('SET_PROFILE', data)
        }
      } catch {
        commit('SET_PROFILE', null)
      } finally {
        commit('SET_CHECKED')
      }
    },
    async logout({ commit }: { commit: Commit }): Promise<void> {
      try {
        await axiosIns.get('/api/auth/logout')
      } catch (_) {}
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('auth_profile')
      commit('SET_USER', null)
      commit('SET_PROFILE', null)
      commit('SET_CHECKED')
    },
  },
}

export default auth

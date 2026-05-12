import { defineStore } from 'pinia'
import * as authApi from '@/services/authApi'

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user_info') || '{}')
  } catch {
    return {}
  }
}

function isBackendUnavailable(error) {
  const emptyProxyFailure =
    error?.response?.status === 500 && (error.response.data === '' || error.response.data == null)

  return error?.code === 'ERR_NETWORK' || error?.message === 'Network Error' || emptyProxyFailure
}

function isLocalFallbackEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_FALLBACK !== 'false'
}

function createLocalDevUser(username) {
  const displayName = username?.trim() || '本地学习者'
  const safeName = displayName.replace(/[^\w-]/g, '-').slice(0, 32) || 'learner'

  return {
    id: `local-dev-${safeName}`,
    username: displayName,
    email: `${safeName}@local.dev`,
    sessionId: `local-dev-${safeName}-${Date.now()}`,
    scoreActionList: []
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: readStoredUser(),
    loading: false
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.user?.sessionId),
    displayName: (state) => state.user?.username || state.user?.userName || '学习者'
  },
  actions: {
    persist(user) {
      this.user = user || {}
      if (user?.sessionId) {
        localStorage.setItem('user_info', JSON.stringify(user))
      } else {
        localStorage.removeItem('user_info')
      }
    },
    async login(username, password) {
      this.loading = true
      try {
        const user = await authApi.login(username, password)
        this.persist(user)
        return user
      } catch (error) {
        if (isBackendUnavailable(error)) {
          if (isLocalFallbackEnabled()) {
            const user = createLocalDevUser(username)
            this.persist(user)
            return user
          }
          throw new Error('无法连接登录服务，请确认后端服务已启动')
        }
        throw error
      } finally {
        this.loading = false
      }
    },
    async register({ username, email, password, code }) {
      this.loading = true
      try {
        await authApi.verifyCode(email, code)
        await authApi.signup(username, email, password)
        const user = await authApi.login(username, password)
        this.persist(user)
        return user
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await authApi.logout()
      } catch {
        // Local logout should still succeed when the backend session has expired.
      }
      this.persist({})
    }
  }
})

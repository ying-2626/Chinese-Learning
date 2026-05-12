import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authApi from '@/services/authApi'
import { useAuthStore } from './auth'

vi.mock('@/services/authApi', () => ({
  login: vi.fn(),
  logout: vi.fn()
}))

describe('auth store', () => {
  const storage = new Map()

  beforeEach(() => {
    vi.clearAllMocks()
    storage.clear()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage.get(key) || null),
      setItem: vi.fn((key, value) => storage.set(key, value)),
      removeItem: vi.fn((key) => storage.delete(key))
    })
    setActivePinia(createPinia())
  })

  it('persists the legacy user_info shape with sessionId', () => {
    const store = useAuthStore()
    store.persist({ sessionId: 'abc', username: 'learner' })

    expect(store.isLoggedIn).toBe(true)
    expect(JSON.parse(localStorage.getItem('user_info'))).toEqual({
      sessionId: 'abc',
      username: 'learner'
    })
  })

  it('creates a local development session when backend login is unreachable', async () => {
    const networkError = new Error('Network Error')
    networkError.code = 'ERR_NETWORK'
    authApi.login.mockRejectedValueOnce(networkError)

    const store = useAuthStore()
    const user = await store.login('yara', '123')

    expect(user).toMatchObject({
      id: 'local-dev-yara',
      username: 'yara',
      email: 'yara@local.dev',
      scoreActionList: []
    })
    expect(user.sessionId).toMatch(/^local-dev-yara-/)
    expect(store.isLoggedIn).toBe(true)
    expect(JSON.parse(localStorage.getItem('user_info')).sessionId).toBe(user.sessionId)
  })

  it('handles Vite proxy 500s as a local backend outage in development', async () => {
    const proxyError = new Error('Request failed with status code 500')
    proxyError.response = { status: 500, data: '' }
    authApi.login.mockRejectedValueOnce(proxyError)

    const store = useAuthStore()
    const user = await store.login('yara', '123')

    expect(user.username).toBe('yara')
    expect(user.sessionId).toMatch(/^local-dev-yara-/)
    expect(store.isLoggedIn).toBe(true)
  })
})

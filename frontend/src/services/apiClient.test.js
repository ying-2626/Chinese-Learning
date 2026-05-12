import { describe, expect, it, vi } from 'vitest'
import { getSessionId, getStoredUser, unwrapResult } from './apiClient'

describe('apiClient helpers', () => {
  it('unwraps backend Result payloads when code is 0', () => {
    expect(unwrapResult({ data: { code: 0, result: { ok: true } } })).toEqual({ ok: true })
  })

  it('throws backend messages when code is not 0', () => {
    expect(() => unwrapResult({ data: { code: 1, message: '登录失败' } })).toThrow('登录失败')
  })

  it('reads the legacy sessionId from localStorage.user_info', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ sessionId: 'session-123', username: 'demo' }),
      setItem: vi.fn(),
      removeItem: vi.fn()
    })

    expect(getStoredUser()).toEqual({ sessionId: 'session-123', username: 'demo' })
    expect(getSessionId()).toBe('session-123')
    vi.unstubAllGlobals()
  })
})

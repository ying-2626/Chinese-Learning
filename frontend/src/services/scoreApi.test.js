import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn()
  },
  getStoredUser: vi.fn(() => ({})),
  unwrapResult: vi.fn((response) => response.data.result)
}))

describe('scoreApi', () => {
  beforeEach(async () => {
    const { apiClient, getStoredUser } = await import('./apiClient')
    apiClient.get.mockReset()
    getStoredUser.mockReset()
    getStoredUser.mockReturnValue({})
  })

  it('maps backend result 0 to an empty score history list', async () => {
    const { apiClient } = await import('./apiClient')
    const { findCurrentUserScoreActions } = await import('./scoreApi')
    apiClient.get.mockResolvedValueOnce({ data: { code: 0, result: 0 } })

    await expect(findCurrentUserScoreActions()).resolves.toEqual([])
  })

  it('uses local development score history without calling the backend', async () => {
    const { apiClient, getStoredUser } = await import('./apiClient')
    const { findCurrentUserScoreActions } = await import('./scoreApi')
    getStoredUser.mockReturnValueOnce({
      sessionId: 'local-dev-yara-123',
      scoreActionList: [{ id: 2, totalScore: 92 }]
    })

    await expect(findCurrentUserScoreActions()).resolves.toEqual([{ id: 2, totalScore: 92 }])
    expect(apiClient.get).not.toHaveBeenCalled()
  })
})

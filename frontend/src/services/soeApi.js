import { apiClient, unwrapResult } from './apiClient'

export async function createSoeWebSocketUrl({ refText, evalMode, scoreCoeff = 1.0 }) {
  const response = await apiClient.post('/api/tencent/soe/websocket-url', {
    refText,
    evalMode,
    scoreCoeff
  })
  return unwrapResult(response)
}

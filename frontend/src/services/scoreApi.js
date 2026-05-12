import { apiClient, getStoredUser, unwrapResult } from './apiClient'

export async function uploadAudioFile(audioBlob) {
  const formData = new FormData()
  formData.append('audioFile', audioBlob, 'recording.mp3')

  const response = await apiClient.post('/scoreAction/uploadAudioFile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return unwrapResult(response)
}

export async function createScoreAction(scoreData) {
  const response = await apiClient.post('/scoreAction/createScoreAction', scoreData, {
    headers: { 'Content-Type': 'application/json' }
  })
  return unwrapResult(response)
}

export async function findCurrentUserScoreActions() {
  const storedUser = getStoredUser()
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_LOCAL_FALLBACK !== 'false' &&
    storedUser?.sessionId?.startsWith('local-dev-')
  ) {
    return Array.isArray(storedUser.scoreActionList) ? storedUser.scoreActionList : []
  }

  const response = await apiClient.get('/user/findCurrentUserScoreActions')
  const result = unwrapResult(response)
  return result === 0 || !result ? [] : result
}

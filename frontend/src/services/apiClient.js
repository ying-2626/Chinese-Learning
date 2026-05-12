import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user_info') || '{}')
  } catch {
    return {}
  }
}

export function getSessionId() {
  return getStoredUser()?.sessionId || ''
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true
})

apiClient.interceptors.request.use((config) => {
  const sessionId = getSessionId()
  if (sessionId) {
    config.headers = config.headers || {}
    config.headers.session = sessionId
  }
  return config
})

export function unwrapResult(response) {
  const payload = response?.data
  if (payload?.code === 0) {
    return payload.result
  }
  throw new Error(payload?.message || '请求失败，请稍后重试')
}

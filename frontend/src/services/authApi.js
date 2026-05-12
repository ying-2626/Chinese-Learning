import { apiClient, unwrapResult } from './apiClient'

export async function login(username, password) {
  const response = await apiClient.post('/user/login', null, {
    params: { username, password }
  })
  return unwrapResult(response)
}

export async function sendCode(email) {
  const response = await apiClient.post('/user/sendCode', null, {
    params: { email }
  })
  return unwrapResult(response)
}

export async function verifyCode(email, code) {
  const response = await apiClient.post('/user/verifyCode', null, {
    params: { email, code }
  })
  const result = unwrapResult(response)
  if (result === false) {
    throw new Error('验证码不正确，请重新输入')
  }
  return result
}

export async function signup(username, email, password) {
  const response = await apiClient.post('/user/signup', null, {
    params: { username, email, password }
  })
  return unwrapResult(response)
}

export async function logout() {
  const response = await apiClient.post('/user/logout')
  return unwrapResult(response)
}

export async function getUserInfo() {
  const response = await apiClient.get('/user/getUserInfo')
  return unwrapResult(response)
}

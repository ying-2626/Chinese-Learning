export class SessionClient {
  constructor(baseUrl = '/api/interaction', { getHeaders = () => ({}) } = {}) {
    this.baseUrl = baseUrl;
    this.getHeaders = getHeaders;
  }

  async request(path, body, signal) {
    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST', credentials: 'same-origin', signal,
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : '';
      const error = new Error(response.status === 401 ? `登录已失效，请重新登录（HTTP 401）。${message}` : message || `请求失败 (${response.status})`);
      error.status = response.status;
      error.code = data?.code;
      throw error;
    }
    if (data === null) throw new Error('服务返回了无效的 JSON，请稍后重试。');
    return data;
  }

  create() { return this.request('session', {}); }
  submit(event, signal) { return this.request('event', event, signal); }
  interrupt(sessionId, turnId) { return this.request('interrupt', { sessionId, turnId }); }
}

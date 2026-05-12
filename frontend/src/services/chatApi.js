import axios from 'axios'

const FASTGPT_URL = 'https://api.fastgpt.in/api/v1/chat/completions'

export async function requestFastGpt(content) {
  const authorization = import.meta.env.VITE_FASTGPT_API_KEY
  if (!authorization || authorization.includes('YOUR_FASTGPT_API_KEY_HERE')) {
    throw new Error('FastGPT API Key 未配置')
  }

  const response = await axios.post(
    FASTGPT_URL,
    {
      chatId: '111',
      stream: false,
      detail: false,
      messages: [{ role: 'user', content }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization
      }
    }
  )

  return response.data?.choices?.[0]?.message?.content || '暂无回复'
}

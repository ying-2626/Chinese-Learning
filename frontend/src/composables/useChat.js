import { computed, ref } from 'vue'
import { marked } from 'marked'
import { requestFastGpt } from '@/services/chatApi'

export function useChat(initialMessage = '请输入你的问题，AI 将给出答案。') {
  const messages = ref([{ role: 'assistant', content: initialMessage }])
  const input = ref('')
  const loading = ref(false)
  const error = ref('')

  const canSend = computed(() => input.value.trim().length > 0 && !loading.value)

  async function sendMessage() {
    const content = input.value.trim()
    if (!content) return

    messages.value.push({ role: 'user', content })
    input.value = ''
    loading.value = true
    error.value = ''

    try {
      const reply = await requestFastGpt(content)
      messages.value.push({ role: 'assistant', content: reply })
    } catch (err) {
      const fallback =
        err.message === 'FastGPT API Key 未配置'
          ? '当前 FastGPT Key 还没有配置。功能入口已经迁移完成，配置 VITE_FASTGPT_API_KEY 后即可恢复真实回复。'
          : '抱歉，获取回复失败，请稍后重试。'
      error.value = fallback
      messages.value.push({ role: 'assistant', content: fallback, muted: true })
    } finally {
      loading.value = false
    }
  }

  function renderMarkdown(content) {
    return marked.parse(content || '')
  }

  return {
    messages,
    input,
    loading,
    error,
    canSend,
    sendMessage,
    renderMarkdown
  }
}

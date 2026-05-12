import { ref } from 'vue'
import { findCurrentUserScoreActions } from '@/services/scoreApi'

export function useScoreHistory() {
  const records = ref([])
  const loading = ref(false)
  const error = ref('')

  async function loadHistory() {
    loading.value = true
    error.value = ''
    try {
      const list = await findCurrentUserScoreActions()
      records.value = [...list].sort((a, b) => (b.id || 0) - (a.id || 0))
    } catch (err) {
      error.value = err.message || '请先登录后查看历史记录'
      records.value = []
    } finally {
      loading.value = false
    }
  }

  return { records, loading, error, loadHistory }
}

import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'

const stageCopy = {
  idle: {
    name: 'Ready',
    label: '准备练习',
    helper: '输入文本后开始朗读，系统会同步测评声母、韵母、声调和流利度。',
    tone: 'calm'
  },
  connecting: {
    name: 'Linking',
    label: '连接语音引擎',
    helper: '正在建立评测通道，请允许麦克风权限。',
    tone: 'active'
  },
  recording: {
    name: 'Listening',
    label: '正在聆听发音',
    helper: '保持自然语速，数字人会同步捕捉你的口型节奏。',
    tone: 'live'
  },
  closing: {
    name: 'Closing',
    label: '收束录音',
    helper: '正在整理最后一段语音帧。',
    tone: 'active'
  },
  saving: {
    name: 'Analyzing',
    label: 'AI 正在纠音',
    helper: '正在生成分数、逐字颜色和下一步练习建议。',
    tone: 'scoring'
  },
  scored: {
    name: 'Next',
    label: '进入下一次练习',
    helper: '根据低分项继续训练，形成测评、陪练、复盘闭环。',
    tone: 'complete'
  }
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value || 0)))
}

function resolveStage(status, scores) {
  const value = unref(status)
  const totalScore = clamp(unref(scores)?.totalScore)
  if (value === 'idle' && totalScore > 0) return 'scored'
  return stageCopy[value] ? value : 'idle'
}

export function useWorkbenchMotion(status, scores) {
  const frame = ref(0)
  const reducedMotion = ref(false)
  let rafId = 0
  let mediaQuery = null

  const stage = computed(() => resolveStage(status, scores))
  const stageMeta = computed(() => stageCopy[stage.value])
  const totalScore = computed(() => clamp(unref(scores)?.totalScore))
  const scoreArc = computed(() => `${Math.max(totalScore.value, stage.value === 'idle' ? 18 : 8) * 3.6}deg`)

  const waveBars = computed(() => {
    const scoreLift = totalScore.value / 6
    const activeBoost = ['recording', 'saving', 'connecting', 'closing'].includes(stage.value) ? 18 : 0
    return Array.from({ length: 18 }, (_, index) => {
      if (reducedMotion.value) {
        return 28 + ((index * 11) % 42)
      }
      const phase = frame.value * 0.085 + index * 0.72
      const wave = Math.sin(phase) * 23 + Math.cos(phase * 0.58) * 9
      return clamp(38 + wave + activeBoost + scoreLift, 14, 96)
    })
  })

  const mouthBars = computed(() => {
    const base = stage.value === 'recording' ? 54 : stage.value === 'saving' ? 42 : 24
    return Array.from({ length: 7 }, (_, index) => {
      if (reducedMotion.value) return base + (index % 3) * 5
      return clamp(base + Math.sin(frame.value * 0.12 + index * 0.9) * 22, 16, 78)
    })
  })

  const rhythmStyle = computed(() => ({
    '--score-arc': scoreArc.value,
    '--motion-frame': frame.value,
    '--motion-energy': ['recording', 'saving'].includes(stage.value) ? 1 : 0.42
  }))

  function tick() {
    frame.value += 1
    rafId = window.requestAnimationFrame(tick)
  }

  function syncReducedMotion(event) {
    reducedMotion.value = Boolean(event.matches)
    if (reducedMotion.value && rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
    if (!reducedMotion.value && !rafId) {
      rafId = window.requestAnimationFrame(tick)
    }
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncReducedMotion(mediaQuery)
    mediaQuery.addEventListener?.('change', syncReducedMotion)
  })

  onBeforeUnmount(() => {
    if (rafId) window.cancelAnimationFrame(rafId)
    mediaQuery?.removeEventListener?.('change', syncReducedMotion)
  })

  return {
    stage,
    stageMeta,
    totalScore,
    scoreArc,
    waveBars,
    mouthBars,
    rhythmStyle,
    reducedMotion
  }
}

<script setup>
import { computed, ref, toRef } from 'vue'
import { ChevronDown, Mic, Square, LoaderCircle, Sparkles } from 'lucide-vue-next'
import ScoreMetric from '@/components/ScoreMetric.vue'
import { useWorkbenchMotion } from '@/composables/useWorkbenchMotion'

const props = defineProps({
  evalText: { type: String, required: true },
  evalModes: { type: Array, required: true },
  selectedMode: { type: Object, required: true },
  status: { type: String, default: 'idle' },
  scores: { type: Object, required: true },
  isRecording: { type: Boolean, default: false },
  actionLabel: { type: String, default: '开始录音' },
  error: { type: String, default: '' },
  coloredWords: { type: Array, default: () => [] },
  advice: { type: String, default: '' }
})

const emit = defineEmits(['update:evalText', 'update:selectedMode', 'toggle-recording'])
const adviceOpen = ref(false)
const { stageMeta, totalScore, waveBars, rhythmStyle } = useWorkbenchMotion(toRef(props, 'status'), props.scores)

const detailMetrics = computed(() => [
  { label: '准确度', value: props.scores.accuracy },
  { label: '流利度', value: props.scores.fluency },
  { label: '完整度', value: props.scores.completeness },
  { label: '声母', value: props.scores.initialSoundScore },
  { label: '韵母', value: props.scores.finalSoundScore },
  { label: '声调', value: props.scores.toneScore }
])

function toneClass(tone) {
  if (tone === 'high') return 'word-good'
  if (tone === 'mid') return 'word-mid'
  return 'word-low'
}
</script>

<template>
  <section class="voice-cockpit content-panel" :style="rhythmStyle">
    <div class="cockpit-main">
      <div class="cockpit-copy">
        <span class="workbench-eyebrow">{{ stageMeta.name }} · Pronunciation Lab</span>
        <h2>今天从一次清晰发音开始。</h2>
        <p>{{ stageMeta.helper }}</p>
      </div>

      <div class="cockpit-score-orb" aria-label="总分">
        <div class="score-ring">
          <span>{{ totalScore.toFixed(1) }}</span>
          <small>总分</small>
        </div>
      </div>
    </div>

    <div class="live-wave-stage" aria-hidden="true">
      <span v-for="(height, index) in waveBars" :key="index" :style="{ height: `${height}%`, '--i': index }" />
    </div>

    <div class="cockpit-controls">
      <label class="cockpit-label" for="eval-text">朗读内容</label>
      <textarea
        id="eval-text"
        :value="evalText"
        class="cockpit-textarea"
        @input="emit('update:evalText', $event.target.value)"
      />

      <div class="mode-segment" role="radiogroup" aria-label="评测模式">
        <button
          v-for="mode in evalModes"
          :key="mode.label"
          type="button"
          :class="{ active: selectedMode.label === mode.label }"
          @click="emit('update:selectedMode', mode)"
        >
          <strong>{{ mode.label }}</strong>
          <span>{{ mode.helper }}</span>
        </button>
      </div>

      <div class="cockpit-action-row">
        <button class="record-button" :class="{ recording: isRecording }" type="button" @click="emit('toggle-recording')">
          <LoaderCircle v-if="status === 'connecting' || status === 'saving'" class="animate-spin" :size="22" />
          <Square v-else-if="isRecording" :size="22" />
          <Mic v-else :size="22" />
          {{ actionLabel }}
        </button>
        <span class="stage-pill">
          <span>
            <strong>{{ stageMeta.name }}</strong>
            {{ stageMeta.label }}
          </span>
          <i class="stage-pill-dot" aria-hidden="true" />
        </span>
      </div>
      <p v-if="error" class="cockpit-error">{{ error }}</p>
    </div>

    <div class="cockpit-results">
      <div class="metric-grid">
        <ScoreMetric
          v-for="metric in detailMetrics"
          :key="metric.label"
          :label="metric.label"
          :value="metric.value"
          compact
        />
      </div>

      <div class="ai-advice-panel">
        <button type="button" class="advice-toggle" @click="adviceOpen = !adviceOpen">
          <span><Sparkles :size="16" /> AI 纠音建议</span>
          <ChevronDown :size="17" :class="{ open: adviceOpen }" />
        </button>
        <p :class="{ collapsed: !adviceOpen }">{{ advice }}</p>
      </div>

      <div v-if="coloredWords.length" class="word-feedback">
        <span
          v-for="(word, index) in coloredWords"
          :key="`${word.text}-${index}`"
          :class="toneClass(word.tone)"
        >
          {{ word.text }}
        </span>
      </div>
    </div>
  </section>
</template>

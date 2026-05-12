<script setup>
import { computed, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { Bot, ChevronRight, Radio, Sparkles } from 'lucide-vue-next'
import { useWorkbenchMotion } from '@/composables/useWorkbenchMotion'

const props = defineProps({
  status: { type: String, default: 'idle' },
  scores: {
    type: Object,
    default: () => ({ totalScore: 0 })
  },
  compact: { type: Boolean, default: false },
  showAction: { type: Boolean, default: true }
})

const { stageMeta, mouthBars, rhythmStyle } = useWorkbenchMotion(toRef(props, 'status'), props.scores)
const dockState = computed(() => (props.status === 'recording' ? '口型同步中' : props.status === 'saving' ? '纠音分析中' : '陪练准备就绪'))
</script>

<template>
  <aside class="digital-human-dock material-glass-dock" :class="{ compact }" :style="rhythmStyle">
    <div class="dock-topline">
      <span class="dock-status-dot" />
      <span>{{ dockState }}</span>
    </div>

    <div class="dock-avatar">
      <div class="avatar-orbit" />
      <div class="avatar-face">
        <Bot :size="34" />
        <div class="avatar-mouth" aria-hidden="true">
          <span v-for="(height, index) in mouthBars" :key="index" :style="{ height: `${height}%`, '--i': index }" />
        </div>
      </div>
    </div>

    <div class="dock-copy">
      <span class="workbench-eyebrow">Digital Human</span>
      <h2>数字人陪练舱</h2>
      <p>{{ stageMeta.helper }}</p>
    </div>

    <div class="dock-scenes">
      <span><Sparkles :size="14" /> 课堂表达</span>
      <span><Radio :size="14" /> 生活会话</span>
      <span>HSK 口语</span>
    </div>

    <RouterLink v-if="showAction" class="dock-link" to="/app/voice">
      进入陪练舱
      <ChevronRight :size="17" />
    </RouterLink>
  </aside>
</template>

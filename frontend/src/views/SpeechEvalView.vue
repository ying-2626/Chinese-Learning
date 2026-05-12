<script setup>
import { onMounted } from 'vue'
import { Activity, Gauge } from 'lucide-vue-next'
import DigitalHumanDock from '@/components/DigitalHumanDock.vue'
import LearningPathRail from '@/components/LearningPathRail.vue'
import RecentPracticeStrip from '@/components/RecentPracticeStrip.vue'
import VoiceCockpitPanel from '@/components/VoiceCockpitPanel.vue'
import WorkbenchFrame from '@/components/WorkbenchFrame.vue'
import { useSpeechEval } from '@/composables/useSpeechEval'
import { useScoreHistory } from '@/composables/useScoreHistory'

const {
  evalText,
  evalModes,
  selectedMode,
  status,
  advice,
  error,
  coloredWords,
  scores,
  isRecording,
  actionLabel,
  toggleRecording
} = useSpeechEval()

const { records, loading: historyLoading, error: historyError, loadHistory } = useScoreHistory()

onMounted(loadHistory)
</script>

<template>
  <WorkbenchFrame
    title="语音学习主控台"
    description="从一次朗读开始，联动语音测评、数字人陪练、AI 纠音和下一步学习路径。"
  >
    <template #actions>
      <span class="material-control workbench-status-chip"><Activity :size="16" /> 声波已就绪</span>
      <span class="material-control workbench-status-chip"><Gauge :size="16" /> {{ scores.totalScore.toFixed(1) }} 总分</span>
    </template>

    <div class="cockpit-layout">
      <VoiceCockpitPanel
        v-model:eval-text="evalText"
        v-model:selected-mode="selectedMode"
        :eval-modes="evalModes"
        :status="status"
        :scores="scores"
        :is-recording="isRecording"
        :action-label="actionLabel"
        :error="error"
        :colored-words="coloredWords"
        :advice="advice"
        @toggle-recording="toggleRecording"
      />

      <div class="cockpit-side">
        <DigitalHumanDock :status="status" :scores="scores" />
        <LearningPathRail compact />
      </div>
    </div>

    <RecentPracticeStrip
      class="mt-5"
      :records="records"
      :loading="historyLoading"
      :error="historyError"
      @refresh="loadHistory"
    />
  </WorkbenchFrame>
</template>

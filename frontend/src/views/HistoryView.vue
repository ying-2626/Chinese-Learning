<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { History, Mic, RefreshCcw, UserCircle } from 'lucide-vue-next'
import DigitalHumanDock from '@/components/DigitalHumanDock.vue'
import EmptyState from '@/components/EmptyState.vue'
import RecentPracticeStrip from '@/components/RecentPracticeStrip.vue'
import ScoreMetric from '@/components/ScoreMetric.vue'
import WorkbenchFrame from '@/components/WorkbenchFrame.vue'
import { useScoreHistory } from '@/composables/useScoreHistory'

const { records, loading, error, loadHistory } = useScoreHistory()

function score(value) {
  return Number(value || 0).toFixed(1)
}

onMounted(loadHistory)
</script>

<template>
  <WorkbenchFrame
    eyebrow="Practice Review"
    title="历史复盘"
    description="把历史记录从表格感改成复盘流：总分、准确度、流利度和声调问题先被看见，再进入下一次练习。"
  >
    <template #actions>
      <button class="material-control workbench-status-chip" type="button" @click="loadHistory">
        <RefreshCcw :size="16" />
        刷新记录
      </button>
    </template>

    <div class="history-dashboard-layout">
      <section class="history-list-panel content-panel">
        <div class="history-record-top">
          <div>
            <span class="workbench-eyebrow">Review Timeline</span>
            <h2>最近语音测评</h2>
            <p>优先看趋势和具体指标，避免学生只记住一个孤立分数。</p>
          </div>
          <RouterLink class="path-action" to="/app/speech">
            <Mic :size="17" />
            新测评
          </RouterLink>
        </div>

        <div v-if="loading" class="strip-empty mt-5">加载中...</div>

        <EmptyState v-else-if="error" title="未登录或暂无权限" :description="error">
          <template #icon><UserCircle :size="56" /></template>
          <RouterLink class="solid-button" to="/login">前往登录</RouterLink>
        </EmptyState>

        <EmptyState
          v-else-if="!records.length"
          title="暂无评测记录"
          description="完成一次语音测评后，这里会展示你的录音、分数和 AI 建议。"
        >
          <template #icon><History :size="56" /></template>
          <RouterLink class="solid-button" to="/app/speech">去评测</RouterLink>
        </EmptyState>

        <div v-else class="mt-5 grid gap-3">
          <article v-for="record in records" :key="record.id" class="history-record-card">
            <div class="history-record-top">
              <div>
                <span class="workbench-eyebrow">Record #{{ record.id }}</span>
                <strong>语音测评复盘</strong>
                <p>{{ record.advice || '暂无建议，建议先复听录音，再进行一次声调专项。' }}</p>
              </div>
              <span class="history-record-score">{{ score(record.totalScore) }}</span>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <ScoreMetric label="准确度" :value="record.accuracy" compact />
              <ScoreMetric label="流畅度" :value="record.fluency" compact />
              <ScoreMetric label="完整度" :value="record.completeness" compact />
            </div>

            <div class="history-metrics-row">
              <span>声母 {{ score(record.initialSoundScore) }}</span>
              <span>韵母 {{ score(record.finalSoundScore) }}</span>
              <span>声调 {{ score(record.toneScore) }}</span>
            </div>

            <audio v-if="record.audioUrl" class="mt-4 w-full" controls :src="record.audioUrl" />
          </article>
        </div>
      </section>

      <div class="cockpit-side">
        <RecentPracticeStrip :records="records" :loading="loading" :error="error" @refresh="loadHistory" />
        <DigitalHumanDock status="idle" />
      </div>
    </div>
  </WorkbenchFrame>
</template>

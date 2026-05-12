<script setup>
import { History, Mic, RefreshCcw } from 'lucide-vue-next'

defineProps({
  records: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

defineEmits(['refresh'])

function score(value) {
  return Number(value || 0).toFixed(1)
}
</script>

<template>
  <section class="recent-practice-strip content-panel">
    <header class="strip-heading">
      <div>
        <span class="workbench-eyebrow">Review Loop</span>
        <h2>最近复盘</h2>
      </div>
      <button class="material-control strip-refresh" type="button" @click="$emit('refresh')">
        <RefreshCcw :size="16" />
        刷新
      </button>
    </header>

    <div v-if="loading" class="strip-empty">正在读取最近测评...</div>
    <div v-else-if="error" class="strip-empty">{{ error }}</div>
    <div v-else-if="!records.length" class="strip-empty">
      <Mic :size="20" />
      完成一次语音测评后，这里会自动形成复盘轨迹。
    </div>
    <div v-else class="strip-records">
      <article v-for="record in records.slice(0, 3)" :key="record.id" class="strip-record">
        <span class="record-mark"><History :size="15" /></span>
        <div>
          <strong>{{ score(record.totalScore) }}</strong>
          <p>准确 {{ score(record.accuracy) }} · 流畅 {{ score(record.fluency) }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

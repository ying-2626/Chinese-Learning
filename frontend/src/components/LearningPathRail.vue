<script setup>
import { BookOpen, ChevronRight, Route } from 'lucide-vue-next'
import { learningPlan } from '@/data/appData'

defineProps({
  compact: { type: Boolean, default: false },
  title: { type: String, default: '今日学习路径' }
})
</script>

<template>
  <section class="learning-path-rail content-panel" :class="{ compact }">
    <div class="rail-heading">
      <span class="rail-icon"><Route :size="18" /></span>
      <div>
        <span class="workbench-eyebrow">Next Practice</span>
        <h2>{{ title }}</h2>
      </div>
    </div>

    <div class="rail-task-list">
      <article v-for="(task, index) in learningPlan.tasks" :key="task.title" class="rail-task">
        <span class="task-index">{{ index + 1 }}</span>
        <div class="min-w-0">
          <h3>{{ task.title }}</h3>
          <p>{{ task.detail }}</p>
          <div class="task-progress">
            <span :style="{ width: `${task.progress}%` }" />
          </div>
        </div>
        <ChevronRight :size="17" />
      </article>
    </div>

    <div class="rail-profile">
      <BookOpen :size="18" />
      <span>{{ learningPlan.profile[1][1] }} · {{ learningPlan.profile[3][1] }}</span>
    </div>
  </section>
</template>

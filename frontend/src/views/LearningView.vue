<script setup>
import { RouterLink } from 'vue-router'
import { BadgeCheck, BookOpen, GraduationCap, Mic } from 'lucide-vue-next'
import DigitalHumanDock from '@/components/DigitalHumanDock.vue'
import LearningPathRail from '@/components/LearningPathRail.vue'
import WorkbenchFrame from '@/components/WorkbenchFrame.vue'
import { learningPlan } from '@/data/appData'
</script>

<template>
  <WorkbenchFrame
    eyebrow="Executable Learning Path"
    title="今日学习路径"
    description="学习页从资料陈列改成可执行任务板：每个节点都能自然回到测评、陪练和 AI 纠音。"
  >
    <template #actions>
      <span class="material-control workbench-status-chip"><GraduationCap :size="16" /> {{ learningPlan.profile[1][1] }}</span>
      <span class="material-control workbench-status-chip"><BadgeCheck :size="16" /> 进阶版有效</span>
    </template>

    <div class="learning-dashboard-layout">
      <section class="learning-focus-panel content-panel">
        <span class="workbench-eyebrow">Today's Route</span>
        <h2>先练声调，再进入场景表达，最后用短文复述巩固。</h2>
        <p>把今天的中文学习拆成可执行节点，减少大标题占位，让学生一眼知道下一步该做什么。</p>

        <div class="today-path-board mt-5">
          <article v-for="(task, index) in learningPlan.tasks" :key="task.title" class="path-node-card">
            <div class="path-node-top">
              <div>
                <span class="workbench-eyebrow">Step {{ index + 1 }}</span>
                <strong>{{ task.title }}</strong>
                <p>{{ task.detail }}</p>
              </div>
              <RouterLink class="path-action" :to="index === 1 ? '/app/voice' : '/app/speech'">
                <component :is="index === 1 ? BookOpen : Mic" :size="17" />
                {{ index === 1 ? '进入陪练' : '开始练习' }}
              </RouterLink>
            </div>
            <div class="task-progress mt-4">
              <span :style="{ width: `${task.progress}%` }" />
            </div>
            <small class="mt-2 block text-sm text-[#6e6e73]">{{ task.progress }}% 完成</small>
          </article>
        </div>
      </section>

      <div class="cockpit-side">
        <LearningPathRail compact title="路径摘要" />
        <DigitalHumanDock status="idle" />
      </div>
    </div>
  </WorkbenchFrame>
</template>

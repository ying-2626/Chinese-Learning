<script setup>
import { ClipboardCheck, TimerReset } from 'lucide-vue-next'
import AppleVisual from '@/components/AppleVisual.vue'
import { examTasks } from '@/data/appData'
import { fadeUp, listItem, panelEnter, pressable, staggerDelay } from '@/data/motion'
</script>

<template>
  <section class="mx-auto max-w-[1180px] space-y-5">
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div v-motion="fadeUp" class="rounded-[1.6rem] bg-white p-5 ring-1 ring-black/10 sm:p-6">
        <span class="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">
          <ClipboardCheck :size="15" />
          Exam sprint
        </span>
        <h2 class="mt-3 text-[30px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[36px]">考试冲刺</h2>
        <p class="mt-2 max-w-2xl text-[16px] leading-7 text-[#333333]">
          把 HSK 口语、短文朗读和普通话展示拆成可执行的冲刺训练模块。
        </p>
      </div>
      <div v-motion="panelEnter" :delay="120">
        <AppleVisual variant="exam" label="Exam Space" />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article
        v-for="(task, index) in examTasks"
        :key="task.title"
        v-motion="listItem"
        :delay="staggerDelay(index)"
        class="interactive-lift flex min-h-[240px] flex-col rounded-[1.6rem] bg-white p-5 ring-1 ring-black/10"
      >
        <div class="flex items-center justify-between">
          <span class="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs text-[#7a7a7a]">{{ task.level }}</span>
          <TimerReset class="text-[#0066cc]" :size="22" />
        </div>
        <h3 class="mt-auto text-xl font-semibold tracking-normal text-[#1d1d1f]">{{ task.title }}</h3>
        <p class="mt-2 text-sm leading-6 text-[#7a7a7a]">{{ task.detail }}</p>
        <button
          v-motion="pressable"
          class="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#0066cc] px-5 text-sm font-medium text-white"
          type="button"
        >
          开始训练
        </button>
      </article>
    </div>
  </section>
</template>

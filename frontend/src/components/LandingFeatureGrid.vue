<script setup>
import { Bot, GraduationCap, MessageCircle, Mic } from 'lucide-vue-next'
import { listItem, staggerDelay } from '@/data/motion'

const features = [
  { icon: Mic, title: '语音测评', text: '声母、韵母、声调、流利度拆开反馈，把分数变成练习动作。' },
  { icon: Bot, title: '数字人口语', text: '数字人会话室串联课堂、生活、考试口语场景，承接每一次开口练习。' },
  { icon: MessageCircle, title: 'AI 中文老师', text: '解释偏误、生成复述、补充语法和表达建议。' },
  { icon: GraduationCap, title: '个性学习路径', text: '根据目标、母语和历史记录安排持续训练。' }
]
</script>

<template>
  <section class="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:px-8">
    <div class="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
      <div class="kinetic-reveal">
        <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] ring-1 ring-black/10">
          Product focus
        </span>
        <h2 class="mt-4 text-[34px] font-semibold leading-tight tracking-normal sm:text-[48px]">核心不是工具堆叠，是学习闭环。</h2>
        <p class="mt-4 max-w-xl text-[17px] leading-8 text-[#333333]">
          每个模块都围绕“听见问题、敢于开口、拿到建议、继续练习”展开，避免首页只像一个功能目录。
        </p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <article
          v-for="(feature, index) in features"
          :key="feature.title"
          v-motion="listItem"
          :delay="staggerDelay(index)"
          class="kinetic-card rounded-[1.5rem] bg-white p-5 ring-1 ring-black/10"
        >
          <span class="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f2ff] text-[#0066cc]">
            <component :is="feature.icon" :size="22" />
          </span>
          <h3 class="mt-5 text-lg font-semibold">{{ feature.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[#6e6e73]">{{ feature.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

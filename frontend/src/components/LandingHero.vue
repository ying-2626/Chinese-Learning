<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Mic, Sparkles, UserPlus } from 'lucide-vue-next'
import VoiceTheaterBackdrop from '@/components/VoiceTheaterBackdrop.vue'
import { listItem, pressable, staggerDelay } from '@/data/motion'

const props = defineProps({
  progress: { type: Number, default: 0 },
  activeScene: { type: Number, default: 0 }
})

const heroStyle = computed(() => ({
  '--hero-progress': props.progress
}))

const stats = [
  ['语音测评', '声母、韵母、声调拆分'],
  ['数字人口语', '课堂发言场景陪练'],
  ['AI 中文老师', '把分数变成练习'],
  ['学习路径', '沉淀个人档案']
]
</script>

<template>
  <section class="landing-hero-stage relative isolate min-h-[calc(100vh-56px)] overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-8" :style="heroStyle">
    <VoiceTheaterBackdrop :progress="progress" :active-scene="activeScene" />
    <div class="voice-hero-shell mx-auto flex min-h-[calc(100vh-8.5rem)] max-w-[1240px] flex-col justify-center">
      <div class="kinetic-reveal hero-copy voice-hero-copy">
        <span class="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/72 px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl">
          <Sparkles :size="15" />
          Soundarin Voice Theater
        </span>
        <h1 class="voice-hero-title mt-5 max-w-[850px] font-semibold tracking-normal text-[#1d1d1f]" aria-label="中文发音，会被看见。">
          <span class="block">中文发音，</span>
          <span class="block">会被看见。</span>
        </h1>
        <p class="mt-6 max-w-[680px] text-[18px] leading-8 text-[#333333] sm:text-[21px] sm:leading-9">
          声动汉语把语音测评、数字人口语、AI 中文老师和学习路径合成一个动态学习剧场。登录后继续测评，让每一次开口都进入可复盘的学习档案。
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <RouterLink
            v-motion="pressable"
            class="magnetic-button apple-blue-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-white"
            :to="{ path: '/login', query: { redirect: '/app/speech' } }"
          >
            <Mic :size="18" />
            开始语音测评
            <ArrowRight :size="18" />
          </RouterLink>
          <RouterLink
            v-motion="pressable"
            class="magnetic-button glass-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-[#1d1d1f]"
            :to="{ path: '/register', query: { redirect: '/app/speech' } }"
          >
            <UserPlus :size="18" />
            创建学习档案
          </RouterLink>
        </div>
        <div class="voice-hero-product-strip mt-10 grid max-w-[900px] grid-cols-2 gap-3 md:grid-cols-4">
          <div
            v-for="(item, index) in stats"
            :key="item[1]"
            v-motion="listItem"
            :delay="staggerDelay(index, 100, 220)"
            class="voice-hero-stat kinetic-card"
          >
            <strong>{{ item[0] }}</strong>
            <span>{{ item[1] }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-xs text-[#6e6e73] shadow-sm backdrop-blur-xl md:flex">
      <span class="scroll-cue-dot" />
      向下滚动，学习场景会横向展开
    </div>
  </section>
</template>

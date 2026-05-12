<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, CheckCircle2, Mic, Sparkles } from 'lucide-vue-next'
import LandingHero from '@/components/LandingHero.vue'
import RealFeedbackProof from '@/components/RealFeedbackProof.vue'
import ScrollStoryStage from '@/components/ScrollStoryStage.vue'
import PublicNav from '@/components/PublicNav.vue'
import { useLandingMotion } from '@/composables/useLandingMotion'
import { asset, partnerLogos } from '@/data/appData'
import { pressable } from '@/data/motion'

const { landingRoot, heroProgress, storyProgress, activeScene } = useLandingMotion()

const finalBullets = ['语音测评拆分声母、韵母、声调、流利度', '数字人陪练舱串联课堂、生活和考试口语场景', 'AI 中文老师把评分转成下一句练习']
</script>

<template>
  <main ref="landingRoot" class="kinetic-landing min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
    <PublicNav />
    <LandingHero :progress="heroProgress" :active-scene="activeScene" />

    <section class="trust-strip border-y border-black/5 bg-white/76 py-5 backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-8 px-4 sm:px-6 lg:px-8">
        <img v-for="logo in partnerLogos" :key="logo.alt" class="max-h-8 object-contain opacity-80 transition hover:scale-105 hover:opacity-100" :src="logo.src" :alt="logo.alt" />
      </div>
    </section>

    <ScrollStoryStage :progress="storyProgress" :active-scene="activeScene" />
    <RealFeedbackProof />

    <section class="final-cta-stage relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div class="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div class="kinetic-reveal">
          <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] ring-1 ring-black/10">
            <Sparkles :size="15" />
            Start the lab
          </span>
          <h2 class="mt-4 max-w-3xl text-[38px] font-semibold leading-tight tracking-normal sm:text-[58px]">
            从一次开口，进入完整中文学习剧场。
          </h2>
          <p class="mt-5 max-w-2xl text-[18px] leading-8 text-[#333333]">
            首页负责让学习者看见价值；登录后进入真实工作台，继续语音测评、数字人口语、AI 中文老师和学习档案。
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink
              v-motion="pressable"
              class="magnetic-button apple-blue-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-white"
              :to="{ path: '/login', query: { redirect: '/app/speech' } }"
            >
              登录开始使用
              <ArrowRight :size="18" />
            </RouterLink>
            <RouterLink
              v-motion="pressable"
              class="magnetic-button glass-control inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium text-[#1d1d1f]"
              :to="{ path: '/register', query: { redirect: '/app/speech' } }"
            >
              创建学习档案
            </RouterLink>
          </div>
        </div>

        <div class="kinetic-reveal final-cta-card">
          <div class="final-score-ring">
            <Mic :size="28" />
            <strong>92.8</strong>
            <span>发音清晰度示例分</span>
          </div>
          <ul class="final-check-list">
            <li v-for="item in finalBullets" :key="item">
              <CheckCircle2 :size="18" />
              <span>{{ item }}</span>
            </li>
          </ul>
          <video
            class="mt-6 h-[220px] w-full rounded-[1.4rem] bg-white object-cover"
            :src="asset('img/howToUse.mp4')"
            title="声动汉语使用教程"
            controls
            preload="metadata"
          />
        </div>
      </div>
    </section>

    <footer class="border-t border-black/5 bg-white px-4 py-10 text-center text-sm leading-7 text-[#6e6e73] sm:px-6 lg:px-8">
      <div class="mx-auto max-w-[1180px]">
        <div class="mb-6 flex flex-wrap justify-center gap-6">
          <img class="h-9 w-auto transition hover:scale-110" :src="asset('img/bilibili.png')" alt="Bilibili" />
          <img class="h-9 w-auto transition hover:scale-110" :src="asset('img/Facebook.png')" alt="Facebook" />
          <img class="h-9 w-auto transition hover:scale-110" :src="asset('img/ins.png')" alt="Instagram" />
          <img class="h-9 w-auto transition hover:scale-110" :src="asset('img/Tik Tok.png')" alt="TikTok" />
          <img class="h-9 w-auto transition hover:scale-110" :src="asset('img/weibo.png')" alt="Weibo" />
        </div>
        <p>Contact Us: <strong class="text-[#1d1d1f]">shengdonghanyu@163.com</strong></p>
        <p>International Chinese Institute · East China Normal University</p>
      </div>
    </footer>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, Bot, Headphones, MessageCircle } from 'lucide-vue-next'
import { pressable } from '@/data/motion'
</script>

<template>
  <section class="mx-auto grid max-w-[1240px] gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
    <div class="kinetic-reveal flex flex-col justify-center">
      <span class="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] ring-1 ring-black/10">
        <Bot :size="15" />
        Digital human
      </span>
      <h2 class="mt-4 text-[34px] font-semibold leading-tight tracking-normal sm:text-[48px]">数字人口语，是产品重点，不是装饰。</h2>
      <p class="mt-4 max-w-xl text-[17px] leading-8 text-[#333333]">
        数字人陪练舱把会话状态、场景任务和发音复盘放在一起，学习者能清楚知道下一步要怎么开口、怎么改进。
      </p>
      <RouterLink
        v-motion="pressable"
        class="magnetic-button mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-sm font-medium text-white"
        :to="{ path: '/login', query: { redirect: '/app/voice' } }"
      >
        登录后进入数字人口语
        <ArrowRight :size="17" />
      </RouterLink>
    </div>
    <div class="kinetic-reveal digital-human-shell">
      <div class="digital-human-stage">
        <div class="avatar-orbit">
          <span />
          <span />
          <span />
          <div class="avatar-face">
            <Bot :size="54" />
            <i />
          </div>
        </div>
        <div class="dialogue-card dialogue-card-a">
          <Headphones :size="18" />
          <span>请用中文介绍你的周末计划。</span>
        </div>
        <div class="dialogue-card dialogue-card-b">
          <MessageCircle :size="18" />
          <span>我会根据声调和停顿给你下一句。</span>
        </div>
        <div class="digital-status">
          <strong>Avatar Tutor</strong>
          <span>场景练习 · 即刻进入</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { CheckCircle2 } from 'lucide-vue-next'
import PublicNav from '@/components/PublicNav.vue'
import { pricingPlans } from '@/data/appData'
import { fadeUp, listItem, pressable, staggerDelay } from '@/data/motion'
</script>

<template>
  <div class="public-page pricing-page">
    <PublicNav />
    <main class="mx-auto max-w-[1280px] px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <div v-motion="fadeUp" class="mx-auto max-w-3xl text-center">
        <span class="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a] ring-1 ring-black/10">Pricing</span>
        <h1 class="mt-5 text-[42px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[64px]">简单、透明的定价</h1>
        <p class="mt-4 text-[19px] leading-8 text-[#333333]">选择适合个人学习、长期训练或机构教学的方案，语音测评、AI 纠音和学习档案保持同一套清晰体验。</p>
      </div>

      <section class="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="(plan, index) in pricingPlans"
          :key="plan.name"
          v-motion="listItem"
          :delay="staggerDelay(index)"
          class="flex min-h-[420px] flex-col rounded-[1.35rem] p-6 shadow-[0_10px_28px_rgba(29,29,31,0.06)] ring-1 ring-black/10"
          :class="plan.tone === 'pro' ? 'glass-card border border-white/70 bg-white/78 text-[#1d1d1f] ring-[#0071e3]/18 backdrop-blur-2xl' : 'bg-white text-[#1d1d1f]'"
        >
          <h2 class="text-2xl font-semibold tracking-normal">{{ plan.name }}</h2>
          <strong class="mt-4 block text-4xl font-semibold tracking-normal">{{ plan.price }}</strong>
          <ul class="mt-8 space-y-4">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-start gap-3 text-sm leading-6"
              :class="plan.tone === 'pro' ? 'text-[#333333]' : 'text-[#333333]'"
            >
              <CheckCircle2 class="mt-0.5 shrink-0 text-[#0066cc]" :size="17" />
              <span>{{ feature }}</span>
            </li>
          </ul>
          <RouterLink
            v-motion="pressable"
            class="mt-auto inline-flex h-12 w-full items-center justify-center rounded-full text-base font-medium"
            :class="plan.tone === 'pro' ? 'apple-blue-button bg-[#0071e3] text-white shadow-[0_12px_28px_rgba(0,113,227,0.22)]' : 'bg-[#0066cc] text-white'"
            :style="{ color: '#ffffff' }"
            :to="plan.name === '团队版' ? { path: '/register', query: { plan: 'team' } } : { path: '/login', query: { redirect: '/app/speech' } }"
          >
            {{ plan.name === '团队版' ? '预约咨询' : '登录后开始' }}
          </RouterLink>
        </article>
      </section>
    </main>
  </div>
</template>

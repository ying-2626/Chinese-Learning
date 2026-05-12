<script setup>
import { ShieldCheck, Sparkles } from 'lucide-vue-next'
import { asset } from '@/data/appData'

const feedbackBoards = [
  { src: asset('img/图片1.png'), alt: '声动汉语用户内测体验评价合集一' },
  { src: asset('img/图片2.png'), alt: '声动汉语用户内测体验评价合集二' }
]

const feedbackNotes = [
  {
    title: '功能完整',
    text: '这个网站相比比较完整，口语练习、AI 聊天查资料、保存记录等功能都能看到。',
    meta: '用户内测纸条 01'
  },
  {
    title: '发音更清楚',
    text: '对我的中文口语学习很有帮助，能看到声母、韵母、声调哪里需要改。',
    meta: '用户内测纸条 02'
  },
  {
    title: '反馈更具体',
    text: 'AI 识别自己说错的地方后，再给出修改建议，比只聊天更像学习工具。',
    meta: '用户内测纸条 03'
  },
  {
    title: '适合复习',
    text: '保留学习记录很方便，可以反复看自己之前的练习和老师建议。',
    meta: '用户内测纸条 04'
  },
  {
    title: '课堂可用',
    text: '如果能把图片和语音练习结合起来，课堂互动会更生动。',
    meta: '用户内测纸条 05'
  },
  {
    title: '继续优化',
    text: '页面已经有帮助，希望后面把口型和发音提示做得更直观。',
    meta: '用户内测纸条 06'
  }
]

const proofRail = [...feedbackNotes, ...feedbackNotes]
</script>

<template>
  <section class="real-feedback-proof overflow-hidden py-20 sm:py-24">
    <div class="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
      <div class="kinetic-reveal grid gap-7 lg:grid-cols-[0.84fr_1.16fr] lg:items-end">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] ring-1 ring-black/10">
            <ShieldCheck :size="15" />
            Real feedback proof
          </span>
          <h2 class="mt-4 text-[34px] font-semibold leading-tight tracking-normal sm:text-[50px]">
            高级动效之后，必须落到真实学习证据。
          </h2>
        </div>
        <p class="max-w-2xl text-[16px] leading-8 text-[#333333] sm:text-[18px]">
          首页滚动证据只保留授权内测评价和纸条式反馈，不再混入来源不清的风景、动漫或模板图片。
        </p>
      </div>

      <div class="feedback-board-grid mt-10">
        <figure
          v-for="board in feedbackBoards"
          :key="board.src"
          data-feedback-kind="board"
          class="feedback-frame feedback-frame-contain kinetic-card"
        >
          <img :src="board.src" :alt="board.alt" loading="lazy" decoding="async" />
        </figure>
      </div>
    </div>

    <div class="feedback-rail mt-12" aria-label="声动汉语真实反馈滚动证据">
      <div class="feedback-rail-track feedback-note-track">
        <article
          v-for="(item, index) in proofRail"
          :key="`${item.title}-${index}`"
          class="feedback-note-card kinetic-card"
        >
          <span>{{ item.meta }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </div>

    <div class="mx-auto mt-10 grid max-w-[1240px] gap-5 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
      <article class="proof-stat kinetic-card">
        <Sparkles :size="19" />
        <strong>内测评价</strong>
        <span>保留学习者手写反馈和课堂评价，不用泛科技素材冒充产品证据。</span>
      </article>
      <article class="proof-stat kinetic-card">
        <Sparkles :size="19" />
        <strong>纸条内容</strong>
        <span>滚动区改为内测反馈纸条，不再使用和产品无关的图片填充页面。</span>
      </article>
      <article class="proof-stat kinetic-card">
        <Sparkles :size="19" />
        <strong>授权说明</strong>
        <span>图文皆来自项目本地资产池，页面不引用未知模板图或外部图库。</span>
      </article>
    </div>
  </section>
</template>

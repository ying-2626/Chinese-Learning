<script setup>
import { computed } from 'vue'
import { Bot, ClipboardCheck, GraduationCap, MessageCircle, Mic, Sparkles, Waves } from 'lucide-vue-next'
import VoiceParticleField from '@/components/VoiceParticleField.vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
  activeScene: { type: Number, default: 0 }
})

const stageStyle = computed(() => ({
  '--story-progress': props.progress
}))

const cards = [
  {
    icon: Mic,
    eyebrow: 'Step 01',
    title: '听见偏误',
    text: '学习者朗读一句话，系统把声母、韵母、声调和流利度拆开显示，不再只给一个孤立分数。',
    chips: ['声母 91', '韵母 88', '声调 94'],
    sample: 'zhōng wén kǒu yǔ',
    meters: [91, 88, 94]
  },
  {
    icon: Bot,
    eyebrow: 'Step 02',
    title: '数字人接住开口',
    text: '数字人会话室把课堂发言、生活问答和考试口语放进同一条练习路径。',
    chips: ['课堂发言', '生活问答', '考试口语'],
    sample: '课堂发言 · 追问练习',
    meters: [62, 76, 58]
  },
  {
    icon: MessageCircle,
    eyebrow: 'Step 03',
    title: 'AI 老师给建议',
    text: 'AI 中文老师把评分变成可执行练习，解释为什么错、怎么练、下一句练什么。',
    chips: ['纠音建议', '复述练习', '语法解释'],
    sample: '第三声需要压低再上扬',
    meters: [72, 84, 68]
  },
  {
    icon: GraduationCap,
    eyebrow: 'Step 04',
    title: '生成学习路径',
    text: '从一次测评延伸成持续学习档案，形成每周训练、历史记录和考试冲刺任务。',
    chips: ['学习档案', '历史记录', '考试冲刺'],
    sample: '4 次语音训练 / 周',
    meters: [80, 66, 88]
  }
]
</script>

<template>
  <section class="story-stage relative isolate overflow-hidden bg-[#f5f5f7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24" :style="stageStyle">
    <div class="mx-auto max-w-[1240px]">
      <div class="kinetic-reveal mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-[#0066cc] ring-1 ring-black/10">
            <Sparkles :size="15" />
            Scroll story
          </span>
          <h2 class="mt-4 max-w-3xl text-[34px] font-semibold leading-tight tracking-normal sm:text-[54px]">
            继续下滑，四张学习任务被推到眼前。
          </h2>
        </div>
        <p class="max-w-md text-[16px] leading-7 text-[#333333]">
          滚轮直接驱动横向推进，测评、数字人、AI 纠音和学习路径逐张进入视野。
        </p>
      </div>

      <div class="learning-theater relative min-h-[680px] overflow-hidden rounded-[2.4rem] bg-white ring-1 ring-black/10">
        <div class="theater-open-mask" />
        <div class="absolute inset-0 opacity-75">
          <VoiceParticleField compact :progress="progress" :active-scene="activeScene" label="滚动学习场景粒子背景" />
        </div>

        <div class="theater-header">
          <span><Waves :size="16" /> Voice learning flow</span>
          <div class="theater-progress">
            <i />
          </div>
        </div>

        <div class="story-track relative z-10 flex min-h-[680px] w-max items-center gap-8 px-[8vw] pb-10 pt-24 will-change-transform md:px-[10vw]">
          <article
            v-for="(card, index) in cards"
            :key="card.title"
            class="story-card kinetic-card flex h-[500px] w-[82vw] max-w-[640px] flex-col justify-between rounded-[1.85rem] border border-white/80 bg-white/88 p-7 backdrop-blur-2xl md:w-[640px]"
            :class="{ current: activeScene === index }"
            :aria-current="activeScene === index ? 'step' : undefined"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f2ff] text-[#0066cc]">
                  <component :is="card.icon" :size="23" />
                </span>
                <span class="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">{{ card.eyebrow }}</span>
              </div>
              <h3 class="mt-8 text-[34px] font-semibold tracking-normal text-[#1d1d1f]">{{ card.title }}</h3>
              <p class="mt-4 text-[17px] leading-8 text-[#333333]">{{ card.text }}</p>
            </div>
            <div class="story-card-visual" aria-hidden="true">
              <span v-for="(meter, meterIndex) in card.meters" :key="meterIndex" :style="{ width: `${meter}%` }" />
            </div>
            <div class="story-sample">
              <span>{{ card.sample }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="chip in card.chips" :key="chip" class="feature-chip rounded-full bg-[#f5f5f7] px-3 py-2 text-sm text-[#333333]">{{ chip }}</span>
            </div>
            <span class="story-card-number">0{{ index + 1 }}</span>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

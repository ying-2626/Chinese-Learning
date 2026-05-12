<script setup>
const props = defineProps({
  variant: { type: String, default: 'speech' },
  label: { type: String, default: 'Soundarin' }
})

const bars = [44, 72, 36, 92, 58, 78, 48]
const cards = ['声调', '语流', '复述', '纠错']
const visualAssets = {
  speech: '/assets/img/apple-ui/speech-lab-3d.svg',
  chat: '/assets/img/apple-ui/ai-tutor-panel.svg',
  tools: '/assets/img/apple-ui/learning-task-card.svg',
  learning: '/assets/img/apple-ui/learning-task-card.svg',
  exam: '/assets/img/apple-ui/exam-sprint-space.svg'
}
</script>

<template>
  <div class="glass-card interactive-lift relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/72 p-5 text-[#1d1d1f] shadow-[0_20px_48px_rgba(29,29,31,0.10)] ring-1 ring-black/5 backdrop-blur-2xl">
    <div class="liquid-highlight absolute inset-x-8 top-0 h-px bg-white/90" />
    <div class="pointer-events-none absolute inset-x-6 top-6 h-px bg-white/80" />
    <div class="relative flex items-center justify-between">
      <span class="glass-control rounded-full border border-white/70 bg-white/75 px-3 py-1 text-xs font-medium text-[#6e6e73] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">{{ props.label }}</span>
      <span class="h-2 w-2 rounded-full bg-[#2997ff] shadow-[0_0_24px_rgba(41,151,255,0.9)]" />
    </div>
    <img
      v-if="props.variant !== 'speech'"
      class="pointer-events-none absolute bottom-4 right-4 w-24 opacity-45 sm:w-32"
      :src="visualAssets[props.variant] || visualAssets.learning"
      alt=""
      aria-hidden="true"
    />

    <div v-if="props.variant === 'speech'" class="relative mt-7">
      <div class="mx-auto max-w-[300px] rounded-[1.45rem] border border-white/80 bg-[#f5f5f7]/80 p-4 shadow-[0_18px_42px_rgba(29,29,31,0.10)] ring-1 ring-black/5 backdrop-blur-xl">
        <div class="flex min-h-[210px] flex-col justify-between rounded-[1.05rem] border border-white/80 bg-white/82 p-4 text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <div>
            <p class="text-xs font-semibold text-[#7a7a7a]">Pronunciation Lab</p>
            <p class="mt-2 text-[28px] font-semibold leading-tight tracking-normal">实时波形</p>
            <div class="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-[#0066cc]">
              <span class="rounded-full bg-[#e8f2ff] px-2.5 py-1">声调</span>
              <span class="rounded-full bg-[#e8f2ff] px-2.5 py-1">韵母</span>
              <span class="rounded-full bg-[#e8f2ff] px-2.5 py-1">流利度</span>
            </div>
          </div>
          <div class="flex h-16 items-end gap-1.5">
            <i
              v-for="(bar, index) in bars"
              :key="bar"
              class="block flex-1 rounded-full bg-[#0071e3] shadow-[0_8px_20px_rgba(0,113,227,0.18)]"
              :style="{ height: `${bar}%`, animationDelay: `${index * 90}ms` }"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="props.variant === 'chat'" class="relative mt-8 min-h-[260px]">
      <div class="absolute left-2 top-6 max-w-[72%] rounded-[1.5rem] rounded-tl-md border border-white/80 bg-white/82 px-5 py-4 text-[#1d1d1f] shadow-[0_18px_40px_rgba(29,29,31,0.12)]">
        今天我想练习课堂发言。
      </div>
      <div class="absolute bottom-10 right-0 max-w-[78%] rounded-[1.5rem] rounded-br-md bg-[#0071e3] px-5 py-4 text-white shadow-[0_20px_44px_rgba(0,113,227,0.24)]">
        我会先帮你拆声调，再给你一组更自然的表达。
      </div>
      <div class="absolute bottom-0 left-7 flex gap-2">
        <span v-for="item in 3" :key="item" class="h-2.5 w-2.5 rounded-full bg-[#0071e3]/35" />
      </div>
    </div>

    <div v-else-if="props.variant === 'tools'" class="mt-8 grid grid-cols-2 gap-3">
      <div
        v-for="card in cards"
        :key="card"
        class="rounded-[1.25rem] border border-white/75 bg-white/68 p-4 shadow-[0_14px_34px_rgba(29,29,31,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
      >
        <span class="block h-8 w-8 rounded-xl bg-[#e8f2ff] ring-1 ring-[#0071e3]/12" />
        <p class="mt-8 text-sm font-medium text-[#333333]">{{ card }}</p>
      </div>
    </div>

    <div v-else class="relative mt-8">
      <div class="rounded-[1.6rem] border border-white/80 bg-white/82 p-5 text-[#1d1d1f] shadow-[0_24px_56px_rgba(29,29,31,0.12)]">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-[#7a7a7a]">Learning Stack</p>
          <span class="rounded-full bg-[#e8f2ff] px-3 py-1 text-xs font-medium text-[#0066cc]">Live</span>
        </div>
        <div class="mt-6 space-y-3">
          <span class="block h-3 w-10/12 rounded-full bg-[#d2d2d7]" />
          <span class="block h-3 w-7/12 rounded-full bg-[#d2d2d7]" />
          <span class="block h-3 w-9/12 rounded-full bg-[#0071e3]" />
        </div>
        <div class="mt-8 grid grid-cols-3 gap-2">
          <span v-for="item in 3" :key="item" class="h-16 rounded-2xl border border-white/80 bg-[#f5f5f7]/90" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
i {
  animation: apple-wave 1.4s ease-in-out infinite alternate;
  transform-origin: bottom;
}

@keyframes apple-wave {
  to {
    transform: scaleY(0.72);
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  i {
    animation: none;
  }
}
</style>

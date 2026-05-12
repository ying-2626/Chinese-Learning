<script setup>
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, Heart, Users } from 'lucide-vue-next'
import { asset } from '@/data/appData'
import { fadeUp, panelEnter, pressable } from '@/data/motion'

const images = [asset('img/love放图1.png'), asset('img/love放图2.png')]
const current = ref(0)

function move(step) {
  current.value = (current.value + step + images.length) % images.length
}
</script>

<template>
  <section class="mx-auto max-w-[1200px] space-y-6">
    <div v-motion="fadeUp" class="flex flex-col justify-between gap-5 rounded-[2rem] bg-white p-6 ring-1 ring-black/10 sm:flex-row sm:items-center sm:p-8">
      <div>
        <span class="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">
          <Users :size="15" />
          Feedback
        </span>
        <h2 class="mt-4 text-[34px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[46px]">用户反馈</h2>
      </div>
      <span class="inline-flex items-center gap-2 rounded-full bg-[#fff0f5] px-4 py-2 text-sm font-medium text-[#d70015]">
        <Heart :size="15" />
        真实内测反馈
      </span>
    </div>
    <div v-motion="panelEnter" class="grid gap-4 rounded-[2rem] bg-white p-4 ring-1 ring-black/10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
      <button
        v-motion="pressable"
        class="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-[#f5f5f7] text-[#1d1d1f]"
        type="button"
        @click="move(-1)"
        aria-label="上一张"
      >
        <ChevronLeft :size="22" />
      </button>
      <div class="overflow-hidden rounded-[1.5rem] bg-[#f5f5f7]">
        <img class="mx-auto max-h-[680px] w-full object-contain" :src="images[current]" alt="用户反馈截图" />
      </div>
      <button
        v-motion="pressable"
        class="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-[#f5f5f7] text-[#1d1d1f]"
        type="button"
        @click="move(1)"
        aria-label="下一张"
      >
        <ChevronRight :size="22" />
      </button>
    </div>
    <div class="flex justify-center gap-2">
      <button
        v-for="(_, index) in images"
        :key="index"
        type="button"
        class="h-2.5 rounded-full transition"
        :class="current === index ? 'w-8 bg-[#0066cc]' : 'w-2.5 bg-[#d2d2d7]'"
        @click="current = index"
      />
    </div>
  </section>
</template>

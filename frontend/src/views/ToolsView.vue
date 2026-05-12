<script setup>
import { computed, ref } from 'vue'
import { ExternalLink, Wrench } from 'lucide-vue-next'
import AppleVisual from '@/components/AppleVisual.vue'
import { magicTools, toolCategories } from '@/data/appData'
import { fadeUp, listItem, panelEnter, pressable, staggerDelay } from '@/data/motion'

const selected = ref('全部')
const visibleTools = computed(() =>
  selected.value === '全部' ? magicTools : magicTools.filter((tool) => tool.category === selected.value)
)

function openTool(tool) {
  if (tool.href) window.location.href = tool.href
}
</script>

<template>
  <section class="mx-auto max-w-[1180px] space-y-5">
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div v-motion="fadeUp" class="rounded-[1.6rem] bg-white p-5 ring-1 ring-black/10 sm:p-6">
        <span class="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">
          <Wrench :size="15" />
          MagicTools
        </span>
        <h2 class="mt-3 text-[30px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[36px]">AI 学习工具箱</h2>
        <p class="mt-2 max-w-2xl text-[16px] leading-7 text-[#333333]">
          将词汇、语法、阅读、互译和写作整理成一个安静高效的工具工作台。
        </p>
        <div class="mt-5 flex flex-wrap gap-2">
          <button
            v-for="category in toolCategories"
            :key="category"
            v-motion="pressable"
            type="button"
            class="interactive-lift rounded-full px-3.5 py-1.5 text-sm transition"
            :class="selected === category ? 'glass-nav-active bg-[#e8f2ff] text-[#0066cc] ring-1 ring-[#0066cc]/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]' : 'glass-control bg-[#f5f5f7] text-[#333333] hover:bg-white hover:ring-1 hover:ring-black/10'"
            @click="selected = category"
          >
            {{ category }}
          </button>
        </div>
      </div>
      <div v-motion="panelEnter" :delay="120">
        <AppleVisual variant="tools" label="Utility Stack" />
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <article
        v-for="(tool, index) in visibleTools"
        :key="tool.name"
        v-motion="listItem"
        :delay="staggerDelay(index)"
        class="interactive-lift group flex min-h-[210px] cursor-pointer flex-col rounded-[1.6rem] bg-white p-4 ring-1 ring-black/10 transition hover:bg-[#fafafc]"
        @click="openTool(tool)"
      >
        <div class="flex items-start justify-between gap-4">
          <span class="grid h-12 w-12 place-items-center rounded-[1rem] bg-[#f5f5f7]">
            <img class="h-7 w-7 object-contain" :src="tool.icon" :alt="tool.name" />
          </span>
          <span class="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs text-[#7a7a7a]">{{ tool.status }}</span>
        </div>
        <div class="mt-auto pt-6">
          <h3 class="text-lg font-semibold tracking-normal text-[#1d1d1f]">{{ tool.name }}</h3>
          <p class="mt-2 text-sm leading-6 text-[#7a7a7a]">{{ tool.description }}</p>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-black/10 pt-3 text-sm text-[#0066cc]">
          <span>{{ tool.category }}</span>
          <ExternalLink v-if="tool.href" :size="18" class="transition group-hover:translate-x-0.5" />
        </div>
      </article>
    </div>
  </section>
</template>

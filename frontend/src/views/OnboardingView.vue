<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Globe2, GraduationCap } from 'lucide-vue-next'
import PublicNav from '@/components/PublicNav.vue'
import { fadeUp, listItem, panelEnter, pressable, progressFill, staggerDelay } from '@/data/motion'

const router = useRouter()
const page = ref(1)
const form = reactive({ grade: '', language: '', country: '' })
const grades = ['零基础', 'HSK 1-2', 'HSK 3-4', 'HSK 5-6', '普通话提升', '考试冲刺']
const progress = computed(() => (page.value / 2) * 100)

function next() {
  if (!form.grade) return
  page.value = 2
}

function finish(skip = false) {
  const payload = skip ? { grade: null, language: null, country: null } : form
  localStorage.setItem('entry_test_profile', JSON.stringify(payload))
  router.push('/app/speech')
}
</script>

<template>
  <div class="public-page onboarding-page">
    <PublicNav />
    <main class="mx-auto flex min-h-screen max-w-[940px] items-center px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div v-motion="panelEnter" class="w-full rounded-[2rem] bg-white p-6 ring-1 ring-black/10 sm:p-8">
        <div class="h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
          <span v-motion="progressFill" class="block h-full rounded-full bg-[#0066cc]" :style="{ width: `${progress}%` }" />
        </div>

      <section v-if="page === 1" v-motion="fadeUp" class="mt-8">
        <span class="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">
          <GraduationCap :size="16" />
          Learning profile
        </span>
        <h1 class="mt-5 text-[36px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[52px]">你的中文水平更接近哪一档？</h1>
        <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="(grade, index) in grades"
            :key="grade"
            v-motion="listItem"
            :delay="staggerDelay(index)"
            class="min-h-20 rounded-[1.4rem] border px-5 text-left text-base font-semibold transition"
            :class="form.grade === grade ? 'border-[#0066cc] bg-[#e8f2ff] text-[#0066cc] ring-4 ring-[#0066cc]/10' : 'border-black/10 bg-[#f5f5f7] text-[#1d1d1f] hover:bg-white'"
            type="button"
            @click="form.grade = grade"
          >
            {{ grade }}
          </button>
        </div>
        <div class="mt-8 flex flex-wrap justify-end gap-3">
          <button v-motion="pressable" class="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#0066cc]" type="button" @click="finish(true)">跳过</button>
          <button v-motion="pressable" class="inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-5 py-3 text-sm font-medium text-white disabled:opacity-45" type="button" :disabled="!form.grade" @click="next">
            下一步
            <ArrowRight :size="18" />
          </button>
        </div>
      </section>

      <section v-else v-motion="fadeUp" class="mt-8">
        <span class="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold uppercase text-[#7a7a7a]">
          <Globe2 :size="16" />
          Language background
        </span>
        <h1 class="mt-5 text-[36px] font-semibold leading-tight tracking-normal text-[#1d1d1f] sm:text-[52px]">补充母语和国家信息</h1>
        <label class="mt-8 block text-sm font-semibold text-[#333333]">
          母语
          <input v-model.trim="form.language" class="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 text-base outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10" placeholder="例如 English" />
        </label>
        <label class="mt-4 block text-sm font-semibold text-[#333333]">
          国家
          <input v-model.trim="form.country" class="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 text-base outline-none transition focus:border-[#0066cc] focus:bg-white focus:ring-4 focus:ring-[#0066cc]/10" placeholder="例如 United States" />
        </label>
        <div class="mt-8 flex flex-wrap justify-end gap-3">
          <button v-motion="pressable" class="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-[#0066cc]" type="button" @click="page = 1">上一步</button>
          <button v-motion="pressable" class="inline-flex items-center gap-2 rounded-full bg-[#0066cc] px-5 py-3 text-sm font-medium text-white disabled:opacity-45" type="button" :disabled="!form.language || !form.country" @click="finish(false)">
            完成
            <ArrowRight :size="18" />
          </button>
        </div>
      </section>
      </div>
    </main>
  </div>
</template>

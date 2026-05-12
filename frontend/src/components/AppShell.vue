<script setup>
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  BadgeCheck,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  Heart,
  History,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  UserCircle,
  Wrench,
  X
} from 'lucide-vue-next'
import { navItems, asset } from '@/data/appData'
import { useAuthStore } from '@/stores/auth'
import { fadeUp, listItem, pressable, staggerDelay } from '@/data/motion'

const iconMap = {
  Mic,
  Headphones,
  MessageCircle,
  Wrench,
  GraduationCap,
  ClipboardCheck,
  History,
  Heart
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const sidebarOpen = ref(false)

const activeItem = computed(() => navItems.find((item) => route.path.startsWith(item.path)) || navItems[0])

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
    <aside
      class="glass-sidebar material-glass-nav fixed inset-y-3 left-3 z-40 flex w-[252px] flex-col px-3.5 py-3.5 text-[#1d1d1f] transition-transform duration-300"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] lg:translate-x-0'"
    >
      <div v-motion="fadeUp" class="liquid-highlight flex items-center gap-3 rounded-[1.2rem] border border-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <img class="h-10 w-10 rounded-xl object-contain" :src="asset('img/side_logo.png')" alt="声动汉语" />
        <div>
          <strong class="block text-sm font-semibold">声动汉语</strong>
          <span class="mt-0.5 block text-xs text-[#6e6e73]">AI 中文学习工作台</span>
        </div>
      </div>

      <nav class="mt-5 flex flex-1 flex-col gap-1">
        <RouterLink
          v-for="(item, index) in navItems"
          :key="item.path"
          :to="item.path"
          v-motion="listItem"
          :delay="staggerDelay(index, 120, 36)"
          class="group flex min-h-10 items-center gap-3 rounded-full border border-transparent px-3.5 text-sm transition duration-200"
          :class="
            route.path.startsWith(item.path)
              ? 'glass-nav-active text-[#0066cc]'
              : 'text-[#4f4f55] hover:bg-white/60 hover:text-[#1d1d1f] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
          "
          @click="sidebarOpen = false"
        >
          <component :is="iconMap[item.icon]" :size="19" />
          <span class="font-medium">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="space-y-1.5 border-t border-black/10 pt-3">
        <RouterLink
          v-motion="pressable"
          class="flex min-h-10 items-center gap-3 rounded-full px-3.5 text-sm text-[#6e6e73] transition hover:bg-white/60 hover:text-[#1d1d1f]"
          to="/"
          @click="sidebarOpen = false"
        >
          <Home :size="19" />
          <span>回到首页</span>
        </RouterLink>
        <button
          v-motion="pressable"
          class="flex min-h-10 w-full items-center gap-3 rounded-full px-3.5 text-left text-sm text-[#6e6e73] transition hover:bg-white/60 hover:text-[#1d1d1f]"
          type="button"
          @click="logout"
        >
          <LogOut :size="19" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <main class="min-h-screen lg:pl-[284px]">
      <header
        class="mx-3 flex min-h-14 items-center justify-between gap-3 px-1 pt-3 sm:mx-4 lg:mx-6 lg:justify-end"
      >
        <button
          class="glass-control inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1d1d1f] lg:hidden"
          type="button"
          @click="sidebarOpen = true"
          aria-label="打开导航"
        >
          <Menu :size="20" />
        </button>
        <div class="min-w-0 lg:hidden">
          <span class="text-[11px] font-semibold uppercase tracking-normal text-[#7a7a7a]">当前模块</span>
          <h1 class="truncate text-[20px] font-semibold leading-tight">{{ activeItem.label }}</h1>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <span class="glass-control hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#333333] sm:inline-flex">
            <BadgeCheck :size="16" />
            学习空间在线
          </span>
          <div class="glass-control flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs text-[#1d1d1f]">
            <UserCircle :size="18" />
            <span class="max-w-[120px] truncate">{{ auth.displayName }}</span>
          </div>
        </div>
      </header>
      <div class="px-4 pb-8 pt-3 sm:px-6 lg:px-6">
        <RouterView />
      </div>
    </main>

    <button
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-[#f5f5f7]/45 backdrop-blur-md lg:hidden"
      type="button"
      aria-label="关闭导航"
      @click="sidebarOpen = false"
    >
      <X class="sr-only" :size="20" />
    </button>
  </div>
</template>

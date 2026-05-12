<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { GraduationCap, Menu, Mic, Wrench, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { asset } from '@/data/appData'
import { pressable } from '@/data/motion'

const open = ref(false)
const route = useRoute()
const appLinks = [
  { label: '语音测评', icon: Mic, to: { path: '/login', query: { redirect: '/app/speech' } } },
  { label: '学习路径', icon: GraduationCap, to: { path: '/login', query: { redirect: '/app/learning' } } },
  { label: '工具箱', icon: Wrench, to: { path: '/login', query: { redirect: '/app/tools' } } }
]
const safeRedirect = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/app') ? redirect : ''
})
const loginTo = computed(() => (safeRedirect.value ? { path: '/login', query: { redirect: safeRedirect.value } } : '/login'))
const registerTo = computed(() => (safeRedirect.value ? { path: '/register', query: { redirect: safeRedirect.value } } : '/register'))

function closeMenu() {
  open.value = false
}
</script>

<template>
  <header class="public-nav">
    <RouterLink class="brand-mark" to="/" @click="closeMenu">
      <img :src="asset('img/logo.png')" alt="声动汉语" />
    </RouterLink>
    <nav
      id="public-nav-menu"
      :class="{ open }"
      :aria-hidden="open ? 'false' : undefined"
    >
      <RouterLink class="transition hover:text-[#0066cc]" to="/pricing" @click="closeMenu">价格</RouterLink>
      <RouterLink
        v-for="link in appLinks"
        :key="link.label"
        class="transition hover:text-[#0066cc]"
        :to="link.to"
        @click="closeMenu"
      >
        <component :is="link.icon" class="md:hidden" :size="16" />
        {{ link.label }}
      </RouterLink>
      <div class="mobile-nav-actions">
        <RouterLink v-motion="pressable" class="ghost-button full" :to="loginTo" @click="closeMenu">登录</RouterLink>
        <RouterLink v-motion="pressable" class="solid-button full" :to="registerTo" @click="closeMenu">注册</RouterLink>
      </div>
    </nav>
    <div class="nav-actions">
      <RouterLink v-motion="pressable" class="ghost-button" :to="loginTo">登录</RouterLink>
      <RouterLink v-motion="pressable" class="solid-button" :to="registerTo">注册</RouterLink>
    </div>
    <button
      class="icon-button nav-toggle md:hidden"
      type="button"
      aria-controls="public-nav-menu"
      :aria-expanded="open"
      aria-label="切换导航"
      @click="open = !open"
    >
      <X v-if="open" :size="20" />
      <Menu v-else :size="20" />
    </button>
  </header>
</template>

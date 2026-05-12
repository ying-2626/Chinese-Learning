<script setup>
import { computed, reactive, ref } from 'vue'
import { LogIn } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthKineticPanel from '@/components/AuthKineticPanel.vue'
import PublicAuthLayout from '@/components/PublicAuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { panelEnter, pressable } from '@/data/motion'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const error = ref('')
const activeField = ref('')
const redirectTarget = computed(() => normalizeRedirect(route.query.redirect))
const registerLink = computed(() => ({ path: '/register', query: { redirect: redirectTarget.value } }))

function normalizeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/app') ? value : '/app/speech'
}

async function submit() {
  error.value = ''
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }
  try {
    await auth.login(form.username, form.password)
    router.push(redirectTarget.value)
  } catch (err) {
    error.value = err.message || '登录失败'
  }
}
</script>

<template>
  <PublicAuthLayout>
    <template #visual>
      <AuthKineticPanel mode="login" :active-field="activeField" />
    </template>

    <form v-motion="panelEnter" :delay="100" class="auth-glass-form" @submit.prevent="submit">
      <div>
        <span class="auth-form-kicker">Member Lab</span>
        <h2>登录</h2>
        <p>进入工作台，继续语音测评、数字人口语和学习档案。</p>
      </div>
      <label>
        用户名
        <input
          v-model.trim="form.username"
          autocomplete="username"
          placeholder="请输入用户名"
          @focus="activeField = 'username'"
          @blur="activeField = ''"
        />
      </label>
      <label>
        密码
        <input
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
          @focus="activeField = 'password'"
          @blur="activeField = ''"
        />
      </label>
      <p v-if="error" class="auth-message error">{{ error }}</p>
      <button v-motion="pressable" class="magnetic-button auth-submit" type="submit" :disabled="auth.loading">
        <LogIn :size="19" />
        {{ auth.loading ? '登录中...' : '登录' }}
      </button>
      <p class="auth-form-link">还没有账号？<RouterLink :to="registerLink">立即注册</RouterLink></p>
    </form>
  </PublicAuthLayout>
</template>

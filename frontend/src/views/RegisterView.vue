<script setup>
import { computed, reactive, ref } from 'vue'
import { Mail, UserPlus } from 'lucide-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthKineticPanel from '@/components/AuthKineticPanel.vue'
import PublicAuthLayout from '@/components/PublicAuthLayout.vue'
import { sendCode } from '@/services/authApi'
import { useAuthStore } from '@/stores/auth'
import { panelEnter, pressable } from '@/data/motion'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const form = reactive({ username: '', email: '', code: '', password: '', confirm: '' })
const sending = ref(false)
const error = ref('')
const notice = ref('')
const activeField = ref('')
const redirectTarget = computed(() => normalizeRedirect(route.query.redirect))
const loginLink = computed(() => (redirectTarget.value ? { path: '/login', query: { redirect: redirectTarget.value } } : '/login'))

const emailPattern = /^\w+@[a-zA-Z0-9]{2,10}(?:\.[a-z]{2,4}){1,3}$/

function normalizeRedirect(value) {
  return typeof value === 'string' && value.startsWith('/app') ? value : ''
}

async function requestCode() {
  error.value = ''
  notice.value = ''
  activeField.value = 'code'
  if (!emailPattern.test(form.email)) {
    error.value = '请输入有效邮箱'
    return
  }
  sending.value = true
  try {
    await sendCode(form.email)
    notice.value = `验证码已发送至 ${form.email}`
  } catch (err) {
    error.value = err.message || '验证码发送失败'
  } finally {
    sending.value = false
  }
}

async function submit() {
  error.value = ''
  notice.value = ''
  if (!form.username || !form.email || !form.code || !form.password) {
    error.value = '请完整填写注册信息'
    return
  }
  if (form.password !== form.confirm) {
    error.value = '两次输入的密码不一致'
    return
  }
  try {
    await auth.register(form)
    router.push(redirectTarget.value || '/onboarding')
  } catch (err) {
    error.value = err.message || '注册失败'
  }
}
</script>

<template>
  <PublicAuthLayout>
    <template #visual>
      <AuthKineticPanel mode="register" :active-field="activeField" />
    </template>

    <form v-motion="panelEnter" :delay="100" class="auth-glass-form register-form" @submit.prevent="submit">
      <div>
        <span class="auth-form-kicker">Start Learning</span>
        <h2>注册</h2>
        <p>创建账号后进入入门测试，建立你的中文学习档案。</p>
      </div>

      <div class="auth-field-grid">
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
          邮箱
          <input
            v-model.trim="form.email"
            autocomplete="email"
            placeholder="请输入邮箱"
            @focus="activeField = 'email'"
            @blur="activeField = ''"
          />
        </label>
      </div>

      <label>
        验证码
        <div class="auth-code-row">
          <input
            v-model.trim="form.code"
            placeholder="请输入验证码"
            @focus="activeField = 'code'"
            @blur="activeField = ''"
          />
          <button v-motion="pressable" class="magnetic-button auth-code-button" type="button" :disabled="sending" @click="requestCode">
            <Mail :size="17" />
            {{ sending ? '发送中' : '获取验证码' }}
          </button>
        </div>
      </label>

      <div class="auth-field-grid">
        <label>
          密码
          <input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            placeholder="请输入密码"
            @focus="activeField = 'password'"
            @blur="activeField = ''"
          />
        </label>
        <label>
          确认密码
          <input
            v-model="form.confirm"
            type="password"
            autocomplete="new-password"
            placeholder="请再次输入密码"
            @focus="activeField = 'confirm'"
            @blur="activeField = ''"
          />
        </label>
      </div>

      <p v-if="error" class="auth-message error">{{ error }}</p>
      <p v-if="notice" class="auth-message notice">{{ notice }}</p>
      <button v-motion="pressable" class="magnetic-button auth-submit" type="submit" :disabled="auth.loading">
        <UserPlus :size="19" />
        {{ auth.loading ? '注册中...' : '注册并登录' }}
      </button>
      <p class="auth-form-link">已有账号？<RouterLink :to="loginLink">前往登录</RouterLink></p>
    </form>
  </PublicAuthLayout>
</template>

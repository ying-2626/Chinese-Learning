<script setup>
import { computed } from 'vue'
import { Bot, CheckCircle2, KeyRound, Mail, Mic, UserRound } from 'lucide-vue-next'
import VoiceParticleField from '@/components/VoiceParticleField.vue'

const props = defineProps({
  mode: { type: String, default: 'login' },
  activeField: { type: String, default: '' }
})

const config = computed(() =>
  props.mode === 'register'
    ? {
        eyebrow: 'Start learning',
        title: '建立你的中文学习档案。',
        text: '注册后进入入门测试，保存母语、目标和学习场景，让系统为你生成长期训练路径。',
        score: 'Profile',
        steps: [
          ['账号', UserRound],
          ['邮箱', Mail],
          ['验证', KeyRound],
          ['建档', CheckCircle2]
        ]
      }
    : {
        eyebrow: 'Welcome back',
        title: '继续你的中文发音训练。',
        text: '登录后查看历史测评、继续口语陪练，并把每次练习沉淀到你的学习档案。',
        score: '92.8',
        steps: [
          ['测评', Mic],
          ['数字人', Bot],
          ['反馈', CheckCircle2]
        ]
      }
)

const scene = computed(() => {
  if (props.activeField.includes('password') || props.activeField === 'confirm') return 2
  if (props.activeField === 'email' || props.activeField === 'code') return 3
  if (props.activeField === 'username') return 1
  return props.mode === 'register' ? 3 : 0
})

const activeStepLabels = computed(() => {
  const map = {
    username: ['账号', '测评'],
    email: ['邮箱'],
    code: ['验证', '反馈'],
    password: ['验证', '反馈'],
    confirm: ['建档']
  }
  return map[props.activeField] || []
})
</script>

<template>
  <section class="auth-kinetic-panel">
    <div class="auth-copy">
      <span class="auth-eyebrow">{{ config.eyebrow }}</span>
      <h1>{{ config.title }}</h1>
      <p>{{ config.text }}</p>
    </div>
    <div class="auth-stage">
      <VoiceParticleField compact :active-scene="scene" :progress="0.5" label="登录注册动态语音背景" />
      <div class="auth-floating-card">
        <span>{{ mode === 'register' ? 'Learning Profile' : 'Pronunciation Lab' }}</span>
        <strong>{{ config.score }}</strong>
        <div class="auth-mini-bars">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div class="auth-step-row">
        <span
          v-for="[label, icon] in config.steps"
          :key="label"
          class="auth-step"
          :class="{ active: activeStepLabels.includes(label) }"
        >
          <component :is="icon" :size="16" />
          {{ label }}
        </span>
      </div>
    </div>
  </section>
</template>

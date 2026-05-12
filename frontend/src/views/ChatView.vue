<script setup>
import { BadgeCheck, LoaderCircle, MessageCircle, Send } from 'lucide-vue-next'
import DigitalHumanDock from '@/components/DigitalHumanDock.vue'
import LearningPathRail from '@/components/LearningPathRail.vue'
import WorkbenchFrame from '@/components/WorkbenchFrame.vue'
import { useChat } from '@/composables/useChat'

const { messages, input, loading, error, canSend, sendMessage, renderMarkdown } = useChat(
  '你好，我是你的 AI 中文老师。你可以把刚才的测评分数、低分字或想练的场景发给我，我会给你下一步练习。'
)
</script>

<template>
  <WorkbenchFrame
    eyebrow="AI Tutor Workspace"
    title="AI 中文老师对话区"
    description="把聊天页改成全高工作区：上面看反馈，下面固定输入，右侧联动数字人和今日路径，不再像临时卡片。"
  >
    <template #actions>
      <span class="material-control workbench-status-chip"><MessageCircle :size="16" /> FastGPT 对话</span>
      <span class="material-control workbench-status-chip"><BadgeCheck :size="16" /> 输入固定底部</span>
    </template>

    <div class="chat-workbench-layout">
      <section class="teacher-chat-panel content-panel">
        <header class="teacher-chat-header">
          <div>
            <h2>AI 中文老师</h2>
            <p>课堂表达、语法、发音建议和下一步练习拆解。</p>
          </div>
          <span class="dock-status-dot">在线</span>
        </header>

        <div class="teacher-messages">
          <article
            v-for="(message, index) in messages"
            :key="index"
            class="teacher-message"
            :class="{ user: message.role === 'user' }"
          >
            <div class="teacher-bubble" :class="{ muted: message.muted }">
              <div class="teacher-bubble-label">{{ message.role === 'user' ? '你' : 'AI 老师' }}</div>
              <div v-if="message.role === 'assistant'" class="markdown-body" v-html="renderMarkdown(message.content)" />
              <div v-else>{{ message.content }}</div>
            </div>
          </article>

          <article v-if="loading" class="teacher-message">
            <div class="teacher-bubble">
              <div class="teacher-bubble-label">AI 老师</div>
              <span class="inline-flex items-center gap-2">
                <LoaderCircle class="animate-spin" :size="17" />
                正在分析你的中文问题...
              </span>
            </div>
          </article>

          <p v-if="error" class="cockpit-error">{{ error }}</p>
        </div>

        <form class="teacher-input-bar" @submit.prevent="sendMessage">
          <div class="teacher-input-shell">
            <textarea
              v-model="input"
              placeholder="输入你想练的表达、低分字或口语场景..."
              @keydown.enter.exact.prevent="sendMessage"
            />
            <button class="teacher-send-button" type="submit" :disabled="!canSend">
              <Send :size="18" />
              发送
            </button>
          </div>
        </form>
      </section>

      <div class="chat-side-stack">
        <DigitalHumanDock status="idle" />
        <LearningPathRail compact title="对话后练习" />
      </div>
    </div>
  </WorkbenchFrame>
</template>

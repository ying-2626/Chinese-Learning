<script setup>
import { RouterLink } from 'vue-router'
import { BadgeCheck, Headphones, Mic, Radio, Video } from 'lucide-vue-next'
import DigitalHumanDock from '@/components/DigitalHumanDock.vue'
import LearningPathRail from '@/components/LearningPathRail.vue'
import WorkbenchFrame from '@/components/WorkbenchFrame.vue'
</script>

<template>
  <WorkbenchFrame
    eyebrow="Digital Human Room"
    title="数字人口语陪练舱"
    description="把数字人放回主路径：会话场景、口型声波、麦克风练习和语音测评结果在同一个陪练空间里联动。"
  >
    <template #actions>
      <span class="material-control workbench-status-chip"><BadgeCheck :size="16" /> 口语场景已准备</span>
      <span class="material-control workbench-status-chip"><Radio :size="16" /> 沉浸陪练模式</span>
    </template>

    <div class="voice-room-layout">
      <section class="voice-session-panel content-panel">
        <div class="voice-session-grid">
          <article class="session-script">
            <span class="workbench-eyebrow">Practice Scene</span>
            <h2>选择一个真实场景，先练表达再做测评。</h2>
            <p>
              选择课堂发言、生活会话或 HSK 口语场景，先跟随数字人提示完成表达，再回到语音测评复盘发音细节。
            </p>

            <RouterLink class="path-action mt-5 w-fit" to="/app/speech">
              <Mic :size="17" />
              去做一次测评
            </RouterLink>

            <div class="scenario-grid">
              <div class="scenario-card">
                <strong>课堂发言</strong>
                <span>用 30 秒说明观点，数字人追问，随后进入发音测评。</span>
              </div>
              <div class="scenario-card">
                <strong>生活会话</strong>
                <span>点餐、问路、预约等短对话，重点练自然停顿。</span>
              </div>
              <div class="scenario-card">
                <strong>HSK 口语</strong>
                <span>听后重复、朗读短句、主题表达，绑定声调和流利度。</span>
              </div>
            </div>
          </article>

          <article class="avatar-service-frame">
            <span class="workbench-eyebrow">Avatar Session</span>
            <h2>数字人会话舱</h2>
            <p>以轻量数字人界面呈现练习节奏，聚合口型声波、场景提示和会话控制。</p>
            <div class="avatar-placeholder-stage">
              <div class="avatar-placeholder-orbit" aria-hidden="true" />
              <div class="avatar-placeholder-face">
                <Video :size="36" />
                <div class="avatar-placeholder-mouth" aria-hidden="true">
                  <span v-for="index in 8" :key="index" :style="{ '--i': index }" />
                </div>
              </div>
              <div class="avatar-placeholder-status">
                <strong>陪练准备就绪</strong>
                <span>选择场景后开始表达练习</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div class="cockpit-side">
        <DigitalHumanDock status="recording" :show-action="false" />
        <LearningPathRail compact title="陪练后下一步" />
        <span class="material-control workbench-status-chip">
          <Headphones :size="16" />
          口型节奏同步
        </span>
        <span class="material-control workbench-status-chip">
          <Video :size="16" />
          数字人陪练已开启
        </span>
      </div>
    </div>
  </WorkbenchFrame>
</template>

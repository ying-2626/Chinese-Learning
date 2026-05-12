<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
  activeScene: { type: Number, default: 0 }
})

const bars = [28, 52, 76, 44, 92, 58, 34, 70, 46, 84, 62, 38, 68, 96, 54, 30]

const stageStyle = computed(() => ({
  '--voice-progress': Math.max(0, Math.min(props.progress, 1)).toFixed(3),
  '--voice-scene': props.activeScene
}))
</script>

<template>
  <div class="voice-theater-backdrop absolute inset-0 -z-10 overflow-hidden" :style="stageStyle" aria-hidden="true">
    <div class="voice-grid-layer" />
    <div class="voice-ribbon voice-ribbon-a" />
    <div class="voice-ribbon voice-ribbon-b" />
    <div class="voice-ribbon voice-ribbon-c" />

    <div class="voice-score-plate">
      <span>Pronunciation</span>
      <strong>92.8</strong>
      <em>clarity score</em>
    </div>

    <div class="voice-practice-line">
      <span>我想预约中文口语课。</span>
      <i />
    </div>

    <div class="voice-waveform">
      <span v-for="(bar, index) in bars" :key="index" :style="{ height: `${bar}%`, '--bar-index': index }" />
    </div>

    <div class="voice-tone-card">
      <span>第三声</span>
      <svg viewBox="0 0 220 72" role="img">
        <path d="M8 22 C 48 56, 76 60, 102 46 S 148 8, 212 20" />
      </svg>
    </div>

    <div class="voice-module-row">
      <span>语音测评</span>
      <span>数字人口语</span>
      <span>AI 中文老师</span>
      <span>学习路径</span>
    </div>
  </div>
</template>

<style scoped>
.voice-theater-backdrop {
  background:
    linear-gradient(110deg, rgba(245, 245, 247, 0.98), rgba(255, 255, 255, 0.76) 42%, rgba(228, 241, 255, 0.78)),
    linear-gradient(rgba(29, 29, 31, 0.032) 1px, transparent 1px),
    linear-gradient(90deg, rgba(29, 29, 31, 0.032) 1px, transparent 1px);
  background-size:
    auto,
    44px 44px,
    44px 44px;
}

.voice-grid-layer {
  position: absolute;
  inset: -18% -10%;
  opacity: 0.62;
  transform: translate3d(calc(var(--voice-progress) * -44px), calc(var(--voice-progress) * -18px), 0);
  background:
    repeating-linear-gradient(104deg, transparent 0 68px, rgba(0, 113, 227, 0.06) 69px 71px, transparent 72px 130px),
    repeating-linear-gradient(18deg, transparent 0 112px, rgba(52, 199, 89, 0.07) 113px 115px, transparent 116px 180px);
}

.voice-ribbon {
  position: absolute;
  left: 42%;
  width: 82vw;
  min-width: 880px;
  height: 150px;
  border-radius: 999px;
  filter: blur(0.2px);
  opacity: 0.86;
  transform-origin: left center;
  mix-blend-mode: multiply;
}

.voice-ribbon-a {
  top: 21%;
  background: linear-gradient(90deg, transparent, rgba(0, 113, 227, 0.18), rgba(52, 199, 89, 0.14), transparent);
  transform: translate3d(calc(var(--voice-progress) * -120px), 0, 0) rotate(-13deg) skewX(-18deg);
  animation: voiceRibbonA 8s ease-in-out infinite;
}

.voice-ribbon-b {
  top: 44%;
  background: linear-gradient(90deg, transparent, rgba(255, 159, 10, 0.13), rgba(0, 113, 227, 0.18), transparent);
  transform: translate3d(calc(var(--voice-progress) * -180px), 0, 0) rotate(9deg) skewX(20deg);
  animation: voiceRibbonB 9s ease-in-out infinite;
}

.voice-ribbon-c {
  top: 67%;
  background: linear-gradient(90deg, transparent, rgba(127, 156, 245, 0.16), rgba(61, 220, 151, 0.12), transparent);
  transform: translate3d(calc(var(--voice-progress) * -96px), 0, 0) rotate(-5deg) skewX(-10deg);
  animation: voiceRibbonC 10s ease-in-out infinite;
}

.voice-score-plate,
.voice-practice-line,
.voice-tone-card,
.voice-module-row {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.7);
  color: #1d1d1f;
  box-shadow: 0 20px 56px rgba(29, 29, 31, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(1.22);
  -webkit-backdrop-filter: blur(24px) saturate(1.22);
}

.voice-score-plate {
  right: clamp(42px, 8vw, 132px);
  top: 19%;
  display: grid;
  min-width: 220px;
  gap: 3px;
  padding: 18px 20px;
  border-radius: 26px;
  transform: translate3d(calc(var(--voice-progress) * -72px), calc(var(--voice-progress) * 24px), 0) rotate(-3deg);
}

.voice-score-plate span,
.voice-score-plate em,
.voice-tone-card span {
  color: #0066cc;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  text-transform: uppercase;
}

.voice-score-plate strong {
  font-size: clamp(46px, 5vw, 74px);
  line-height: 0.96;
}

.voice-score-plate em {
  color: #6e6e73;
}

.voice-practice-line {
  right: clamp(32px, 9vw, 170px);
  bottom: 28%;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 440px;
  padding: 18px 20px;
  border-radius: 999px;
  transform: translate3d(calc(var(--voice-progress) * -128px), calc(var(--voice-progress) * -42px), 0) rotate(2deg);
}

.voice-practice-line span {
  font-size: clamp(18px, 2.1vw, 30px);
  font-weight: 760;
  white-space: nowrap;
}

.voice-practice-line i {
  width: 58px;
  height: 4px;
  border-radius: 999px;
  background: #34c759;
  box-shadow: 0 0 0 8px rgba(52, 199, 89, 0.12);
}

.voice-waveform {
  position: absolute;
  right: clamp(38px, 7vw, 112px);
  bottom: 12%;
  display: flex;
  align-items: center;
  height: 120px;
  gap: 8px;
  padding: 14px 18px;
  border-radius: 999px;
  opacity: 0.9;
}

.voice-waveform span {
  display: block;
  width: 8px;
  border-radius: 999px;
  background: linear-gradient(180deg, #0071e3, #67b7ff 58%, #34c759);
  transform: scaleY(calc(0.55 + var(--voice-progress) * 0.45));
  animation: voiceBar 1.6s ease-in-out infinite;
  animation-delay: calc(var(--bar-index) * -0.07s);
}

.voice-tone-card {
  right: clamp(300px, 28vw, 520px);
  top: 57%;
  width: 250px;
  padding: 14px 16px;
  border-radius: 24px;
  transform: translate3d(calc(var(--voice-progress) * 84px), calc(var(--voice-progress) * -26px), 0) rotate(-4deg);
}

.voice-tone-card svg {
  display: block;
  width: 100%;
  height: 76px;
}

.voice-tone-card path {
  fill: none;
  stroke: #0071e3;
  stroke-width: 7;
  stroke-linecap: round;
  stroke-dasharray: 260;
  stroke-dashoffset: calc(180 - var(--voice-progress) * 180);
}

.voice-module-row {
  right: clamp(28px, 7vw, 118px);
  top: 42%;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  max-width: 470px;
  padding: 12px;
  border-radius: 999px;
  transform: translate3d(calc(var(--voice-progress) * -64px), 0, 0);
}

.voice-module-row span {
  border-radius: 999px;
  background: rgba(245, 245, 247, 0.86);
  padding: 9px 12px;
  color: #333333;
  font-size: 13px;
  font-weight: 760;
}

@keyframes voiceRibbonA {
  0%,
  100% {
    clip-path: polygon(0 38%, 100% 18%, 100% 64%, 0 86%);
  }

  50% {
    clip-path: polygon(0 22%, 100% 42%, 100% 78%, 0 54%);
  }
}

@keyframes voiceRibbonB {
  0%,
  100% {
    clip-path: polygon(0 16%, 100% 36%, 100% 82%, 0 58%);
  }

  50% {
    clip-path: polygon(0 40%, 100% 20%, 100% 56%, 0 88%);
  }
}

@keyframes voiceRibbonC {
  0%,
  100% {
    clip-path: polygon(0 32%, 100% 8%, 100% 52%, 0 78%);
  }

  50% {
    clip-path: polygon(0 18%, 100% 34%, 100% 76%, 0 62%);
  }
}

@keyframes voiceBar {
  0%,
  100% {
    transform: scaleY(0.52);
  }

  50% {
    transform: scaleY(1);
  }
}

@media (max-width: 900px) {
  .voice-score-plate,
  .voice-tone-card {
    display: none;
  }

  .voice-practice-line,
  .voice-waveform,
  .voice-module-row {
    display: none;
  }

  .voice-ribbon {
    left: -22%;
    opacity: 0.24;
  }

  .voice-grid-layer {
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .voice-ribbon,
  .voice-waveform span {
    animation: none !important;
  }
}
</style>

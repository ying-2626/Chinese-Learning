<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
  activeScene: { type: Number, default: 0 },
  compact: { type: Boolean, default: false },
  label: { type: String, default: 'Kinetic Voice Field' }
})

const canvas = ref(null)
const mobileViewport = ref(false)
let ctx
let frame = 0
let particles = []
let targets = []
let width = 0
let height = 0
let dpr = 1
let reduceMotion = false
let resizeObserver

const pointer = { x: -9999, y: -9999, power: 0 }
const count = computed(() => {
  if (props.compact) return mobileViewport.value ? 180 : 260
  return mobileViewport.value ? 280 : 760
})

function textTargets(text, total, options = {}) {
  const offscreen = document.createElement('canvas')
  const size = props.compact ? 260 : 420
  offscreen.width = size
  offscreen.height = size * 0.58
  const off = offscreen.getContext('2d')
  off.clearRect(0, 0, offscreen.width, offscreen.height)
  off.fillStyle = '#111'
  off.textAlign = 'center'
  off.textBaseline = 'middle'
  off.font = `${options.weight || 700} ${options.size || (props.compact ? 112 : 184)}px "PingFang SC", "Microsoft YaHei", sans-serif`
  off.fillText(text, offscreen.width / 2, offscreen.height / 2 + 4)
  const pixels = off.getImageData(0, 0, offscreen.width, offscreen.height).data
  const points = []
  const step = props.compact ? 7 : 8
  for (let y = 0; y < offscreen.height; y += step) {
    for (let x = 0; x < offscreen.width; x += step) {
      if (pixels[(y * offscreen.width + x) * 4 + 3] > 80) {
        points.push({
          x: width * 0.5 + (x - offscreen.width / 2) * (width / offscreen.width) * (options.scaleX || 0.76),
          y: height * 0.5 + (y - offscreen.height / 2) * (height / offscreen.height) * (options.scaleY || 0.64)
        })
      }
    }
  }
  return Array.from({ length: total }, (_, index) => points[index % Math.max(points.length, 1)] || waveTarget(index, total))
}

function pinyinTargets(total) {
  return textTargets('zhōng', total, {
    size: props.compact ? 74 : 118,
    weight: 750,
    scaleX: 0.92,
    scaleY: 0.5
  })
}

function waveTarget(index, total) {
  const t = index / Math.max(total - 1, 1)
  const amplitude = height * (props.compact ? 0.16 : 0.22)
  return {
    x: width * (0.08 + t * 0.84),
    y: height * 0.52 + Math.sin(t * Math.PI * 7 + props.progress * 3) * amplitude * (0.24 + Math.sin(t * Math.PI) * 0.76)
  }
}

function toneTarget(index, total) {
  const line = index % 4
  const row = Math.floor(index / 4)
  const t = row / Math.max(Math.floor(total / 4), 1)
  const x = width * (0.17 + t * 0.66)
  const baselines = [0.62, 0.52, 0.46, 0.36]
  return {
    x,
    y: height * baselines[line] - Math.sin(t * Math.PI) * height * (0.03 + line * 0.012)
  }
}

function avatarTarget(index, total) {
  const t = (index / total) * Math.PI * 2
  const ring = index % 3
  const rx = width * (ring === 0 ? 0.22 : ring === 1 ? 0.16 : 0.08)
  const ry = height * (ring === 0 ? 0.26 : ring === 1 ? 0.19 : 0.055)
  const cy = ring === 2 ? height * 0.59 : height * 0.48
  return {
    x: width * 0.5 + Math.cos(t) * rx,
    y: cy + Math.sin(t) * ry
  }
}

function buildTargets() {
  const total = count.value
  const stage = props.activeScene % 5
  if (stage === 1) return textTargets('声', total)
  if (stage === 2) return pinyinTargets(total)
  if (stage === 3) return Array.from({ length: total }, (_, index) => toneTarget(index, total))
  if (stage === 4) return Array.from({ length: total }, (_, index) => avatarTarget(index, total))
  return Array.from({ length: total }, (_, index) => waveTarget(index, total))
}

function particleTarget(index, total) {
  const stage = props.activeScene % 5
  if (stage === 0) return waveTarget(index, total)
  if (stage === 2) {
    const point = targets[index] || waveTarget(index, total)
    return {
      x: point.x,
      y: point.y + Math.sin(index * 0.13 + props.progress * 4) * (props.compact ? 3 : 6)
    }
  }
  if (stage === 3) return toneTarget(index, total)
  if (stage === 4) return avatarTarget(index, total)
  return targets[index] || waveTarget(index, total)
}

function resize() {
  const el = canvas.value
  if (!el) return
  const box = el.getBoundingClientRect()
  mobileViewport.value = window.matchMedia('(max-width: 767px)').matches
  dpr = Math.min(window.devicePixelRatio || 1, props.compact ? 1.5 : 1.75)
  width = Math.max(1, box.width)
  height = Math.max(1, box.height)
  el.width = Math.floor(width * dpr)
  el.height = Math.floor(height * dpr)
  ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  targets = buildTargets()
  particles = Array.from({ length: count.value }, (_, index) => {
    const target = targets[index] || waveTarget(index, count.value)
    return {
      x: target.x + (Math.random() - 0.5) * width * 0.24,
      y: target.y + (Math.random() - 0.5) * height * 0.24,
      vx: 0,
      vy: 0,
      size: props.compact ? 1.4 + Math.random() * 1.7 : 1.6 + Math.random() * 2.1,
      hue: 205 + Math.random() * 28
    }
  })
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  const wash = ctx.createLinearGradient(0, 0, width, height)
  wash.addColorStop(0, 'rgba(255,255,255,0.30)')
  wash.addColorStop(0.46, 'rgba(235,246,255,0.18)')
  wash.addColorStop(1, 'rgba(245,245,247,0.32)')
  ctx.fillStyle = wash
  ctx.fillRect(0, 0, width, height)

  const now = performance.now()
  const pulse = Math.sin(now * 0.0016) * 0.5 + 0.5
  pointer.power *= 0.94

  for (let index = 0; index < particles.length; index += 1) {
    const particle = particles[index]
    const target = particleTarget(index, particles.length)
    const dx = pointer.x - particle.x
    const dy = pointer.y - particle.y
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    const radius = props.compact ? 128 : 190
    const ripple = Math.max(0, 1 - distance / radius) * pointer.power
    const repelX = ripple ? -(dx / distance) * ripple * 20 : 0
    const repelY = ripple ? -(dy / distance) * ripple * 20 : 0

    const spring = props.compact ? 0.052 : 0.044
    particle.vx += (target.x + repelX - particle.x) * spring
    particle.vy += (target.y + repelY - particle.y) * spring
    particle.vx *= 0.82
    particle.vy *= 0.82
    particle.x += particle.vx
    particle.y += particle.vy

    const alpha = 0.45 + pulse * 0.25 + ripple * 0.3
    ctx.beginPath()
    ctx.fillStyle = `hsla(${particle.hue + Math.sin(now * 0.0008 + index) * 5}, 88%, ${48 + ripple * 18}%, ${Math.min(0.95, alpha)})`
    ctx.arc(particle.x, particle.y, particle.size + ripple * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  if (pointer.x > -100 && pointer.power > 0.04) {
    ctx.beginPath()
    ctx.strokeStyle = `rgba(0, 113, 227, ${Math.min(0.36, pointer.power * 0.22)})`
    ctx.lineWidth = 1.4
    ctx.arc(pointer.x, pointer.y, (props.compact ? 86 : 126) * (1.05 - pointer.power * 0.15), 0, Math.PI * 2)
    ctx.stroke()
  }

  if (!reduceMotion) frame = requestAnimationFrame(draw)
}

function handlePointer(event) {
  const box = canvas.value.getBoundingClientRect()
  pointer.x = event.clientX - box.left
  pointer.y = event.clientY - box.top
  pointer.power = 1
}

watch(
  () => [props.activeScene, count.value],
  () => {
    if (!width || !height) return
    targets = buildTargets()
  }
)

onMounted(() => {
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  resizeObserver = new ResizeObserver(resize)
  if (canvas.value?.parentElement) resizeObserver.observe(canvas.value.parentElement)
  window.addEventListener('resize', resize)
  if (!reduceMotion) draw()
  else {
    targets = buildTargets()
    draw()
    cancelAnimationFrame(frame)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  resizeObserver?.disconnect()
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <div class="voice-particle-field" :class="{ compact }">
    <canvas
      ref="canvas"
      class="voice-particle-canvas"
      :aria-label="label"
      role="img"
      @pointermove="handlePointer"
      @pointerleave="pointer.power = 0"
    />
    <div class="voice-field-glass voice-field-glass-a" />
    <div class="voice-field-glass voice-field-glass-b" />
  </div>
</template>

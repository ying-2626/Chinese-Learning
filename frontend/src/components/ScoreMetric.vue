<script setup>
import { progressFill } from '@/data/motion'

defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  compact: { type: Boolean, default: false }
})

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value || 0)))
}
</script>

<template>
  <div class="rounded-[1.25rem] border border-black/10 bg-white p-4" :class="{ 'p-3': compact }">
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm font-medium text-[#333333]">{{ label }}</span>
      <strong class="text-base font-semibold text-[#1d1d1f]">{{ clamp(value).toFixed(1) }}</strong>
    </div>
    <div class="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e8ed]">
      <span
        v-motion="progressFill"
        class="block h-full rounded-full bg-[#0066cc]"
        :style="{ width: `${clamp(value)}%` }"
      />
    </div>
  </div>
</template>

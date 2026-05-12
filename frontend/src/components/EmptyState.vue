<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true }
})
</script>

<template>
  <section class="grid min-h-[360px] place-items-center rounded-[2rem] border border-black/10 bg-white p-8 text-center">
    <div class="mx-auto flex max-w-md flex-col items-center">
      <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f5f7] text-[#0066cc]">
        <slot name="icon" />
      </div>
      <h2 class="text-2xl font-semibold tracking-normal text-[#1d1d1f]">{{ title }}</h2>
      <p class="mt-3 text-base leading-7 text-[#7a7a7a]">{{ description }}</p>
      <div class="mt-6">
        <slot />
      </div>
    </div>
  </section>
</template>

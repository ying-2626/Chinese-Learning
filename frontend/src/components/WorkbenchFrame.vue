<script setup>
defineProps({
  eyebrow: { type: String, default: 'Living Voice Learning Cockpit' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  density: { type: String, default: 'comfortable' }
})
</script>

<template>
  <section class="workbench-frame mx-auto w-full max-w-[1240px]" :data-density="density">
    <header class="workbench-hero">
      <div class="min-w-0">
        <span class="workbench-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="workbench-hero-actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

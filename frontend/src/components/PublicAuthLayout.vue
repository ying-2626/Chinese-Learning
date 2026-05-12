<script setup>
import PublicNav from '@/components/PublicNav.vue'
</script>

<template>
  <div class="public-page auth-page auth-fixed-page">
    <PublicNav />
    <main class="auth-fixed-shell">
      <slot name="visual" />
      <section class="auth-form-zone">
        <slot />
      </section>
    </main>
  </div>
</template>

<template>
  <div class="orbitra-shell min-h-screen flex flex-col bg-slate-800">
    <TheHeader />
    <main class="flex-1 text-slate-200 w-full">
      <slot />
    </main>
    <TheFooter />
  </div>
</template>

<script setup lang="ts">
// Explicit imports avoid path-prefix / auto-import quirks across Nuxt 3→4
import TheHeader from '~/components/UI/TheHeader.vue'
import TheFooter from '~/components/UI/TheFooter.vue'
</script>

<template>
  <section class="max-w-screen-2xl mx-auto px-4 sm:px-6">
    <header class="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div>
        <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">{{ title }}</h2>
        <p v-if="subtitle" class="text-sm text-slate-400 mt-1">{{ subtitle }}</p>
      </div>
    </header>

    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <div
        v-for="n in 6"
        :key="n"
        class="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl bg-slate-800/80 animate-pulse ring-1 ring-slate-700/50"
      />
    </div>

    <div v-else-if="error" class="rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-8 text-center">
      <p class="text-slate-400 text-sm">{{ error }}</p>
      <button type="button" class="mt-3 text-indigo-300 text-sm underline" @click="$emit('retry')">Retry</button>
    </div>

    <div
      v-else
      class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin"
      style="scrollbar-color: rgb(51 65 85) transparent"
    >
      <HomePosterCard
        v-for="item in items"
        :key="item.id + '-' + (item.media_type || mediaType || '')"
        class="snap-start shrink-0 w-36 sm:w-44"
        :item="item"
        :media-type="mediaType || item.media_type"
      />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  mediaType: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})
defineEmits(['retry'])
</script>

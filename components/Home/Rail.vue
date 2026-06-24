<template>
  <section class="max-w-screen-2xl mx-auto px-4 sm:px-6">
    <header class="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div>
        <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">{{ title }}</h2>
        <p v-if="subtitle" class="text-sm text-slate-400 mt-1">{{ subtitle }}</p>
      </div>
      <div v-if="!loading && !error && items?.length" class="hidden sm:flex gap-2 shrink-0">
        <button type="button" class="rail-nav-btn" aria-label="Scroll left" @click="scrollByDir(-1)">‹</button>
        <button type="button" class="rail-nav-btn" aria-label="Scroll right" @click="scrollByDir(1)">›</button>
      </div>
    </header>

    <div v-if="loading" class="flex gap-4 overflow-hidden">
      <div
        v-for="n in 6"
        :key="n"
        class="shrink-0 w-36 sm:w-44 aspect-poster rounded-xl bg-slate-800/80 animate-pulse ring-1 ring-slate-700/50"
      />
    </div>

    <div v-else-if="error" class="rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-8 text-center">
      <p class="text-slate-400 text-sm">{{ error }}</p>
      <button type="button" class="mt-3 btn-ghost" @click="$emit('retry')">Retry</button>
    </div>

    <!--
      No JS drag/click interception — it was eating NuxtLink navigations.
      Desktop: arrow buttons + scrollbar / shift+wheel / trackpad.
      Touch: native horizontal scroll (touch-action: pan-x).
    -->
    <div
      v-else
      ref="scroller"
      class="rail-scroller"
    >
      <HomePosterCard
        v-for="item in items"
        :key="item.id + '-' + (item.media_type || mediaType || '')"
        class="shrink-0 w-36 sm:w-44"
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

const scroller = ref(null)

function scrollByDir(dir) {
  const el = scroller.value
  if (!el) return
  const amount = Math.min(el.clientWidth * 0.85, 480) * dir
  el.scrollBy({ left: amount, behavior: 'smooth' })
}
</script>

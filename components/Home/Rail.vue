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
        class="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl bg-slate-800/80 animate-pulse ring-1 ring-slate-700/50"
      />
    </div>

    <div v-else-if="error" class="rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-8 text-center">
      <p class="text-slate-400 text-sm">{{ error }}</p>
      <button type="button" class="mt-3 text-indigo-300 text-sm underline" @click="$emit('retry')">Retry</button>
    </div>

    <!--
      No JS drag/click interception — it was eating NuxtLink navigations.
      Desktop: arrow buttons + scrollbar / shift+wheel / trackpad.
      Touch: native horizontal scroll (touch-action: pan-x).
    -->
    <div
      v-else
      ref="scroller"
      class="rail-scroller flex gap-4 overflow-x-auto pb-2 -mx-1 px-1"
      style="scrollbar-color: rgb(51 65 85) transparent"
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

<style scoped>
.rail-scroller {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  /* Horizontal swipe on touch devices; links stay fully interactive */
  touch-action: pan-x;
}
.rail-scroller::-webkit-scrollbar {
  height: 6px;
}
.rail-scroller::-webkit-scrollbar-thumb {
  background: rgb(51 65 85);
  border-radius: 999px;
}
.rail-nav-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 1px solid rgb(51 65 85);
  background: rgb(15 23 42 / 0.8);
  color: rgb(226 232 240);
  font-size: 1.25rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.rail-nav-btn:hover {
  background: rgb(30 41 59);
  border-color: rgb(99 102 241 / 0.5);
}
</style>

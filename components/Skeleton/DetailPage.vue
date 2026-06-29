<template>
  <div class="detail-skeleton pb-16" aria-busy="true" aria-live="polite">
    <!-- Cinematic hero (matches movie / TV / person / season) -->
    <header
      class="relative w-full overflow-hidden"
      :class="variant === 'episode' ? 'min-h-[16rem] sm:min-h-[20rem]' : 'min-h-[20rem] sm:min-h-[24rem]'"
    >
      <div class="absolute inset-0 bg-slate-800/80 animate-pulse" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/40" />
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

      <div
        class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-10 pb-12 flex flex-col gap-8 items-end"
        :class="variant === 'episode'
          ? 'lg:flex-row min-h-[16rem] sm:min-h-[20rem]'
          : 'sm:flex-row min-h-[20rem] sm:min-h-[24rem]'"
      >
        <!-- Poster / still -->
        <div
          class="shrink-0 mx-auto sm:mx-0 animate-pulse"
          :class="variant === 'episode'
            ? 'w-full max-w-xl lg:max-w-md'
            : 'w-36 sm:w-44 md:w-48'"
        >
          <div
            class="rounded-2xl bg-slate-700/70 ring-1 ring-white/10 shadow-2xl"
            :class="variant === 'episode' ? 'aspect-video' : 'aspect-[2/3]'"
          />
        </div>

        <!-- Title block -->
        <div class="flex-1 w-full min-w-0 text-center sm:text-left pb-1 space-y-3">
          <div class="h-3 w-24 mx-auto sm:mx-0 rounded-full bg-indigo-500/20 animate-pulse" />
          <div class="h-10 sm:h-12 w-4/5 max-w-lg mx-auto sm:mx-0 rounded-lg bg-slate-600/50 animate-pulse" />
          <div class="h-4 w-2/3 max-w-md mx-auto sm:mx-0 rounded bg-slate-700/40 animate-pulse" />
          <div class="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
            <div
              v-for="n in 4"
              :key="n"
              class="h-7 w-16 sm:w-20 rounded-full bg-white/10 animate-pulse"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Body: main + sidebar (title / person / season) -->
    <div
      v-if="variant !== 'episode'"
      class="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-4 relative z-10"
    >
      <div class="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div class="lg:col-span-2 space-y-6 min-w-0">
          <!-- Overview card -->
          <div class="section-card space-y-3">
            <div class="h-6 w-28 rounded bg-slate-700/70 animate-pulse" />
            <div class="h-3 w-full rounded bg-slate-700/45 animate-pulse" />
            <div class="h-3 w-full rounded bg-slate-700/40 animate-pulse" />
            <div class="h-3 w-5/6 rounded bg-slate-700/35 animate-pulse" />
            <div class="h-3 w-4/6 rounded bg-slate-700/30 animate-pulse" />
          </div>

          <!-- Gallery strip -->
          <div v-if="showGallery" class="section-card">
            <div class="h-5 w-24 rounded bg-slate-700/60 animate-pulse mb-4" />
            <div class="flex gap-2 overflow-hidden">
              <div
                v-for="n in 5"
                :key="'g' + n"
                class="shrink-0 w-40 sm:w-48 aspect-video rounded-lg bg-slate-700/50 animate-pulse"
              />
            </div>
          </div>

          <!-- Cast rail -->
          <div class="section-card">
            <div class="h-5 w-20 rounded bg-slate-700/60 animate-pulse mb-4" />
            <div class="flex gap-3 overflow-hidden">
              <div
                v-for="n in 6"
                :key="'c' + n"
                class="shrink-0 w-20 sm:w-24 space-y-2"
              >
                <div class="aspect-square rounded-md bg-slate-700/60 animate-pulse" />
                <div class="h-2.5 w-full rounded bg-slate-700/40 animate-pulse" />
              </div>
            </div>
          </div>

          <!-- Extra block (seasons / roles / episodes list) -->
          <div v-if="showExtraBlock" class="section-card space-y-3">
            <div class="h-5 w-32 rounded bg-slate-700/60 animate-pulse" />
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="n in 4"
                :key="'e' + n"
                class="h-24 rounded-xl bg-slate-700/40 animate-pulse ring-1 ring-slate-700/40"
              />
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-6 min-w-0">
          <div class="section-card space-y-4">
            <div class="h-6 w-28 rounded bg-slate-700/70 animate-pulse" />
            <!-- Rating panel -->
            <div class="flex justify-between gap-3">
              <div class="space-y-2 flex-1">
                <div class="h-3 w-20 rounded bg-slate-700/50 animate-pulse" />
                <div class="h-9 w-16 rounded bg-slate-700/60 animate-pulse" />
                <div class="h-2.5 w-24 rounded bg-slate-700/40 animate-pulse" />
              </div>
              <div class="h-14 w-14 rounded-xl bg-slate-700/50 animate-pulse shrink-0" />
            </div>
            <div class="h-2 w-full rounded-full bg-slate-900 animate-pulse" />
            <div class="space-y-2 pt-2">
              <div class="h-3 w-full rounded bg-slate-700/40 animate-pulse" />
              <div class="h-3 w-5/6 rounded bg-slate-700/35 animate-pulse" />
              <div class="h-3 w-4/6 rounded bg-slate-700/30 animate-pulse" />
            </div>
          </div>
          <div class="section-card space-y-3">
            <div class="h-5 w-32 rounded bg-slate-700/60 animate-pulse" />
            <div class="h-16 rounded-lg bg-slate-700/40 animate-pulse" />
          </div>
        </aside>
      </div>
    </div>

    <!-- Episode-style body (still-first hero already shown) -->
    <div
      v-else
      class="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-8"
    >
      <div class="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div class="lg:col-span-2 space-y-6">
          <div class="section-card space-y-3">
            <div class="h-6 w-28 rounded bg-slate-700/70 animate-pulse" />
            <div class="h-3 w-full rounded bg-slate-700/45 animate-pulse" />
            <div class="h-3 w-full rounded bg-slate-700/40 animate-pulse" />
            <div class="h-3 w-4/6 rounded bg-slate-700/35 animate-pulse" />
          </div>
          <div class="section-card">
            <div class="h-5 w-24 rounded bg-slate-700/60 animate-pulse mb-4" />
            <div class="flex gap-3 overflow-hidden">
              <div
                v-for="n in 5"
                :key="n"
                class="shrink-0 w-20 aspect-square rounded-md bg-slate-700/55 animate-pulse"
              />
            </div>
          </div>
        </div>
        <aside class="section-card space-y-4">
          <div class="h-6 w-28 rounded bg-slate-700/70 animate-pulse" />
          <div class="h-14 w-14 rounded-xl bg-slate-700/50 animate-pulse" />
          <div class="h-3 w-full rounded bg-slate-700/40 animate-pulse" />
          <div class="h-3 w-5/6 rounded bg-slate-700/35 animate-pulse" />
          <div class="h-9 w-full rounded-md bg-slate-700/50 animate-pulse mt-2" />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Full-page skeleton aligned with cinematic hero + main/sidebar layouts
 * used on movie, TV, person, season (title) and episode (episode) pages.
 */
withDefaults(
  defineProps<{
    /** `title` = poster hero; `episode` = still / landscape hero */
    variant?: 'title' | 'episode'
    showGallery?: boolean
    showExtraBlock?: boolean
  }>(),
  {
    variant: 'title',
    showGallery: true,
    showExtraBlock: true,
  },
)
</script>

<template>
  <header class="relative w-full overflow-hidden min-h-[20rem] sm:min-h-[24rem]">
    <div class="absolute inset-0 bg-cover bg-center scale-105" :style="backdropStyle" />
    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
    <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-transparent" />

    <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-10 pb-12 flex flex-col sm:flex-row gap-8 items-end min-h-[20rem] sm:min-h-[24rem]">
      <div class="shrink-0 w-36 sm:w-44 md:w-48 mx-auto sm:mx-0">
        <div class="rounded-2xl overflow-hidden aspect-[2/3] bg-slate-900 ring-1 ring-white/10 shadow-2xl shadow-black/50">
          <NuxtImg
            v-if="posterUrl"
            :src="posterUrl"
            :alt="title"
            width="500"
            height="750"
            class="w-full h-full object-cover"
            loading="eager"
            format="webp"
            densities="1x 2x"
          />
          <NuxtImg
            v-else
            src="/img/noPoster.png"
            alt=""
            width="500"
            height="750"
            class="w-full h-full object-cover opacity-60"
          />
        </div>
      </div>

      <div class="flex-1 min-w-0 text-center sm:text-left pb-1">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
          {{ kindLabel }}
        </p>
        <h1 class="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="tagline" class="mt-2 text-sm sm:text-base italic text-slate-300/90 max-w-2xl">
          {{ tagline }}
        </p>
        <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
          <slot name="badges" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    kindLabel: string
    title: string
    tagline?: string | null
    posterUrl?: string
    backdropStyle?: Record<string, string>
  }>(),
  {
    tagline: '',
    posterUrl: '',
    backdropStyle: () => ({}),
  },
)
</script>

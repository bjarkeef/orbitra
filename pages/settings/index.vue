<template>
  <div class="page-shell max-w-2xl pb-16">
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Preferences</p>
    <h1 class="mt-2 text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">Settings</h1>
    <p class="mt-2 text-sm text-slate-400 leading-relaxed">
      Stored in cookies so they work with server rendering. Watch region drives providers and Discover filters.
    </p>

    <section class="section-card mt-8" aria-labelledby="region-settings-heading">
      <h2 id="region-settings-heading" class="text-lg font-bold text-slate-100">
        Watch country
      </h2>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        Used for “Where to watch”, Discover provider filters, and Search “on my services”.
      </p>
      <label class="mt-5 block text-sm">
        <span class="text-slate-400">Country / region</span>
        <select
          class="input-field mt-1 w-full max-w-md"
          :value="watchRegion"
          @change="onRegionChange"
        >
          <option
            v-for="opt in regionOptions"
            :key="opt.code"
            :value="opt.code"
          >
            {{ opt.name }} ({{ opt.code }})
          </option>
        </select>
      </label>
      <p class="mt-2 text-xs text-slate-500">
        Active: <span class="text-slate-300">{{ watchRegionLabel }}</span>
        <span v-if="!hasExplicitRegion"> (inferred until you pick one)</span>
      </p>
    </section>

    <section class="section-card mt-8" aria-labelledby="ratings-settings-heading">
      <h2 id="ratings-settings-heading" class="text-lg font-bold text-slate-100">
        Collection ratings
      </h2>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        1–10 scores on movies live in this browser and power collection progress.
      </p>
      <p class="mt-3 text-sm">
        <NuxtLink to="/collections" class="btn-ghost">Browse collections →</NuxtLink>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Settings — Orbitra' })

const {
  watchRegion,
  watchRegionLabel,
  hasExplicitRegion,
  setWatchRegion,
  regionOptions,
} = useWatchRegion()

function onRegionChange(ev: Event) {
  const target = ev.target as HTMLSelectElement | null
  setWatchRegion(target?.value || 'US')
}
</script>

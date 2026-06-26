<template>
  <div class="page-shell max-w-2xl">
    <h1 class="text-3xl font-black text-slate-100">Settings</h1>
    <p class="mt-2 text-sm text-slate-400">
      Preferences are stored in cookies (30 days+) so they work with server-side rendering.
    </p>

    <section class="section-card mt-8" aria-labelledby="region-settings-heading">
      <h2 id="region-settings-heading" class="text-lg font-bold text-slate-100">
        Watch country
      </h2>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        Used for “Where to watch” on titles, Discover filters, and Search streaming-only.
        Availability comes from TMDB / JustWatch for the selected country.
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
  </div>
</template>

<script setup>
useHead({ title: 'Settings — Orbitra' })

const {
  watchRegion,
  watchRegionLabel,
  hasExplicitRegion,
  setWatchRegion,
  regionOptions,
} = useWatchRegion()

function onRegionChange(ev) {
  setWatchRegion(ev?.target?.value || 'US')
}
</script>

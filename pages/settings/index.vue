<template>
  <div class="page-shell max-w-2xl">
    <h1 class="text-3xl font-black text-slate-100">Settings</h1>
    <p class="mt-2 text-sm text-slate-400">
      Preferences are stored in cookies (30 days) so they work with server-side rendering.
    </p>

    <section class="section-card mt-8" aria-labelledby="adult-settings-heading">
      <h2 id="adult-settings-heading" class="text-lg font-bold text-slate-100">
        Adult content (18+)
      </h2>
      <p class="mt-2 text-sm text-slate-400 leading-relaxed">
        When enabled, Orbitra asks TMDB for adult-flagged titles and shows a subtle
        <span class="text-rose-300 font-semibold">18+</span> badge on those cards.
        Turning this on requires confirming you are 18 or older. If you never confirmed,
        we will show the age gate again.
      </p>

      <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-slate-200">
            Include adult results
          </p>
          <p class="text-xs text-slate-500 mt-0.5">
            Status:
            <span v-if="isAdultEnabled" class="text-rose-300">on</span>
            <span v-else-if="isAgeVerified" class="text-slate-400">off (age confirmed)</span>
            <span v-else class="text-slate-500">off (age not confirmed)</span>
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="isAdultEnabled"
          :aria-label="isAdultEnabled ? 'Disable adult content' : 'Enable adult content'"
          class="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          :class="isAdultEnabled ? 'bg-rose-600' : 'bg-slate-600'"
          @click="onToggle"
        >
          <span
            class="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition"
            :class="isAdultEnabled ? 'translate-x-6' : 'translate-x-0'"
          />
        </button>
      </div>

      <p v-if="isAdultEnabled" class="mt-4 text-sm">
        <NuxtLink to="/explore/adult" class="btn-ghost">
          Open adult explore →
        </NuxtLink>
      </p>
    </section>
  </div>
</template>

<script setup>
useHead({ title: 'Settings — Orbitra' })

const {
  isAdultEnabled,
  isAgeVerified,
  setAdultEnabled,
} = useAdultContent()

function onToggle() {
  setAdultEnabled(!isAdultEnabled.value)
}
</script>
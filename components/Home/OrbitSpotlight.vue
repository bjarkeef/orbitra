<template>
  <section class="section-card overflow-hidden relative">
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-slate-900/40 to-transparent pointer-events-none" />
    <div class="relative flex flex-col lg:flex-row gap-6 lg:items-center">
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Signature feature</p>
        <h2 class="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
          Orbit spotlight
        </h2>
        <p class="mt-2 text-sm text-slate-400 max-w-lg leading-relaxed">
          Explore co-star constellations built on the server — the reason Orbitra exists.
          Open a featured person or jump into the orbit explorer.
        </p>
        <div class="mt-5 flex flex-wrap gap-3">
          <NuxtLink :to="'/orbit/' + spotlight.id" class="btn-primary">
            {{ spotlight.name }}'s orbit
          </NuxtLink>
          <NuxtLink to="/orbit" class="btn-secondary !bg-slate-800">
            Browse orbits
          </NuxtLink>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[20rem]">
        <NuxtLink
          v-for="p in chips"
          :key="p.id"
          :to="'/orbit/' + p.id"
          class="rounded-xl bg-slate-950/70 ring-1 ring-slate-700/70 px-3 py-3 hover:ring-indigo-400/40 transition-colors text-center"
        >
          <p class="text-xs font-bold text-slate-100 truncate">{{ p.name }}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Open orbit</p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const spotlight = { id: 6193, name: 'Leonardo DiCaprio' }
const chips = [
  { id: 1245, name: 'Scarlett J.' },
  { id: 525, name: 'C. Nolan' },
  { id: 5064, name: 'Meryl Streep' },
]
</script>

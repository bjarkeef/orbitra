<template>
  <div class="detail-skeleton pb-8" aria-busy="true" aria-live="polite">
    <!-- Banner -->
    <div class="relative h-56 sm:h-72 md:h-96 w-full bg-slate-800/90 animate-pulse overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
    </div>

    <div
      class="w-11/12 xl:w-2/3 mx-auto -mt-10 sm:-mt-14 relative z-[1] p-4 sm:p-6 flex flex-col xl:flex-row gap-6 rounded-lg bg-slate-900/70 ring-1 ring-slate-700/60"
    >
      <!-- Poster column -->
      <div class="w-full flex gap-4 xl:block xl:w-1/3">
        <div class="w-1/3 xl:w-full aspect-poster rounded-lg bg-slate-700/80 animate-pulse shrink-0" />
        <div class="flex-1 xl:mt-4 space-y-3">
          <div class="h-4 w-2/3 rounded bg-slate-700/70 animate-pulse" />
          <div class="h-3 w-full rounded bg-slate-700/50 animate-pulse" />
          <div class="h-3 w-5/6 rounded bg-slate-700/50 animate-pulse" />
          <div class="h-3 w-4/6 rounded bg-slate-700/40 animate-pulse" />
          <div class="h-8 w-24 rounded-md bg-slate-700/60 animate-pulse mt-4" />
        </div>
      </div>

      <!-- Main column -->
      <div class="w-full xl:w-2/3 space-y-6 min-w-0">
        <div class="section-card-muted space-y-3">
          <div class="h-9 w-3/4 max-w-md rounded bg-slate-700/80 animate-pulse" />
          <div class="h-4 w-1/3 rounded bg-slate-700/50 animate-pulse" />
          <div class="h-px bg-slate-700/40 my-2" />
          <div class="h-3 w-full rounded bg-slate-700/45 animate-pulse" />
          <div class="h-3 w-full rounded bg-slate-700/40 animate-pulse" />
          <div class="h-3 w-5/6 rounded bg-slate-700/35 animate-pulse" />
          <div class="h-3 w-4/6 rounded bg-slate-700/30 animate-pulse" />
        </div>

        <div class="section-card-muted">
          <div class="h-6 w-28 rounded bg-slate-700/70 animate-pulse mb-4" />
          <div class="flex gap-3 overflow-hidden">
            <div
              v-for="n in 6"
              :key="n"
              class="shrink-0 w-20 sm:w-24"
            >
              <div class="aspect-poster rounded-md bg-slate-700/70 animate-pulse" />
              <div class="h-3 mt-2 rounded bg-slate-700/50 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

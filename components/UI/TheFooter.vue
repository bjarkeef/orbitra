<template>
  <footer class="border-t border-slate-800/80 bg-slate-950/60 text-slate-500 text-xs sm:text-sm mt-auto">
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p class="text-slate-400">
        <span class="font-semibold text-slate-300">Orbitra</span>
        — movie &amp; TV discovery via TMDB. Not endorsed by TMDB.
      </p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <NuxtLink to="/settings" class="hover:text-slate-200 transition-colors">Settings</NuxtLink>
        <a
          href="https://github.com/bjarkeef/orbitra"
          class="hover:text-slate-200 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >GitHub</a>
        <a
          href="https://www.themoviedb.org/"
          class="hover:text-slate-200 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >TMDB</a>
      </div>
    </div>
  </footer>
</template>

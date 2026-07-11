<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 text-slate-200 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/75"
  >
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
      <NuxtLink
        to="/"
        class="shrink-0 font-black text-base sm:text-lg tracking-[0.18em] text-white hover:text-indigo-100 transition-colors"
      >
        ORBITRA
      </NuxtLink>

      <nav
        class="flex flex-1 justify-end sm:justify-center items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1"
        aria-label="Primary"
      >
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link shrink-0"
          active-class="nav-link-active"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const links = [
  { to: '/', label: 'Home' },
  { to: '/100', label: 'Top 100' },
  { to: '/discover', label: 'Discover' },
  { to: '/orbit', label: 'Orbit' },
  { to: '/collections', label: 'Collections' },
  { to: '/search', label: 'Search' },
  { to: '/settings', label: 'Settings' },
]
</script>

<style scoped>
.nav-link {
  @apply rounded-full px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-400
    hover:text-slate-100 hover:bg-slate-800/80 transition-colors;
}
.nav-link-active {
  @apply text-white bg-indigo-500/25 ring-1 ring-indigo-400/35 hover:bg-indigo-500/30;
}
.scrollbar-none {
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>

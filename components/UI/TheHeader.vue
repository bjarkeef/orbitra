<template>
  <header class="bg-slate-900 text-slate-200 flex flex-wrap items-center gap-4 p-6">
    <NuxtLink class="w-full sm:w-1/3 font-black text-lg tracking-wider" to="/">
      ORBITRA
    </NuxtLink>
    <nav class="flex flex-1 justify-center gap-4" aria-label="Primary">
      <NuxtLink class="hover:text-white transition-colors" to="/">Home</NuxtLink>
      <NuxtLink class="hover:text-white transition-colors" to="/100">Top 100</NuxtLink>
      <NuxtLink class="hover:text-white transition-colors" to="/search">Search</NuxtLink>
    </nav>
  </header>
</template>

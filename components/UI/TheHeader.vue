<template>
  <header class="bg-slate-900 text-slate-200 px-4 py-4 sm:px-6">
    <div class="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
      <div class="sm:w-1/3 flex justify-center sm:justify-start">
        <NuxtLink
          to="/"
          class="font-black text-lg tracking-wider text-slate-100 hover:text-white"
        >
          ORBITRA
        </NuxtLink>
      </div>

      <nav
        class="sm:w-1/3 flex justify-center items-center gap-4 sm:gap-6 text-sm sm:text-base"
        aria-label="Primary"
      >
        <NuxtLink to="/" class="text-slate-300 hover:text-white transition-colors">
          Home
        </NuxtLink>
        <NuxtLink to="/100" class="text-slate-300 hover:text-white transition-colors">
          Top 100
        </NuxtLink>
        <NuxtLink to="/search" class="text-slate-300 hover:text-white transition-colors">
          Search
        </NuxtLink>
      </nav>

      <div class="sm:w-1/3" />
    </div>
  </header>
</template>

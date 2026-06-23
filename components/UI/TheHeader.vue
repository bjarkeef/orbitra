<template>
  <header class="bg-slate-900 text-slate-200 px-4 py-4 sm:px-6">
    <div class="max-w-screen-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
      <div class="flex justify-center sm:justify-start">
        <NuxtLink
          to="/"
          class="font-black text-lg tracking-wider text-slate-100 hover:text-white"
        >
          ORBITRA
        </NuxtLink>
      </div>

      <nav
        class="flex justify-center items-center gap-4 sm:gap-6 text-sm sm:text-base"
        aria-label="Primary"
      >
        <NuxtLink
          to="/"
          class="text-slate-300 hover:text-white transition-colors"
          active-class="text-white font-semibold"
        >
          Home
        </NuxtLink>
        <NuxtLink
          to="/100"
          class="text-slate-300 hover:text-white transition-colors"
          active-class="text-white font-semibold"
        >
          Top 100
        </NuxtLink>
        <NuxtLink
          to="/search"
          class="text-slate-300 hover:text-white transition-colors"
          active-class="text-white font-semibold"
        >
          Search
        </NuxtLink>
      </nav>

      <!-- spacer column keeps logo / nav / right balanced on desktop -->
      <div class="hidden sm:block" aria-hidden="true" />
    </div>
  </header>
</template>

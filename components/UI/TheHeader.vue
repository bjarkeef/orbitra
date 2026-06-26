<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/95 text-slate-200 px-4 py-4 sm:px-6 backdrop-blur"
  >
    <div class="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
      <div class="sm:w-1/3 flex justify-center sm:justify-start">
        <NuxtLink
          to="/"
          class="font-black text-lg tracking-wider text-slate-100 hover:text-white transition-colors"
        >
          ORBITRA
        </NuxtLink>
      </div>

      <nav
        class="sm:w-1/3 flex flex-wrap justify-center items-center gap-3 sm:gap-5 text-sm sm:text-base"
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
        <NuxtLink
          v-if="isAdultEnabled"
          to="/explore/adult"
          class="text-rose-300/90 hover:text-rose-200 transition-colors"
          active-class="text-rose-100 font-semibold"
        >
          Adult
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="text-slate-300 hover:text-white transition-colors"
          active-class="text-white font-semibold"
        >
          Settings
        </NuxtLink>
      </nav>

      <div class="sm:w-1/3" />
    </div>
  </header>
</template>

<script setup>
const { isAdultEnabled } = useAdultContent()
</script>
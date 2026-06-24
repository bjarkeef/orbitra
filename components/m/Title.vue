<template>
  <div class="flex gap-6">
    <div class="section-card w-full">
      <h1 v-if="movie.name" class="text-3xl sm:text-4xl font-bold mb-2 text-slate-100">{{ movie.name }}</h1>
      <h1 v-else class="text-3xl sm:text-4xl font-bold mb-2 text-slate-100">{{ movie.title }}</h1>
      <h4 v-if="movie.tagline" class="text-lg sm:text-xl italic mb-4 text-slate-400">{{ movie.tagline }}</h4>
      <hr class="card-divider" />
      <p class="text-slate-300 leading-relaxed">{{ movie.overview }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ['movie'],
}
</script>

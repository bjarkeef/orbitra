<template>
  <div class="xl:mt-6">
    <NuxtLink
      :to="'/collection/' + movie.belongs_to_collection.id"
      :style="backdropImgPath"
      class="rounded-lg p-5 flex min-h-20 relative bg-cover bg-no-repeat bg-center overflow-hidden ring-1 ring-slate-700/50"
    >
      <div class="absolute inset-0 backdrop-blur-sm hover:backdrop-blur-0 transition-all duration-500 bg-black/50" />
      <h2 class="text-lg sm:text-xl pointer-events-none font-semibold z-10 text-slate-100">
        Part of the {{ movie.belongs_to_collection.name }}
      </h2>
    </NuxtLink>
  </div>
</template>

<script>
export default {
  props: ['movie'],
  data() {
    return {
      backdropImgPath: {
        backgroundImage: '',
      },
    }
  },
  async mounted() {
    this.backdropImgPath.backgroundImage =
      'url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/' +
      this.movie.belongs_to_collection.backdrop_path +
      ')'
  },
}
</script>

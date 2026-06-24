<template>
  <section class="media-banner bg-slate-900/60 overflow-hidden">
    <div class="pt-1 pl-1 opacity-20 relative z-[1]" v-if="loading">Loading</div>
    <div
      v-else-if="error"
      class="absolute inset-0 flex items-center justify-center text-slate-400 text-sm px-4 text-center z-[1]">
      {{ error }}
    </div>
    <div
      class="absolute inset-0 bg-cover bg-no-repeat bg-center"
      :style="backdropImgPath"
      v-else-if="movies && movies.length">
      <NuxtLink
        class="absolute top-3 left-3 z-[1] text-sm text-slate-200/60 hover:text-white transition-colors"
        :to="'/m/' + movies[number].id"
      >{{ movies[number].title }}</NuxtLink>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      movies: null,
      loading: false,
      error: null,
      number: 0,
      backdropImgPath: {
        backgroundImage: '',
      },
    }
  },
  async created() {
    const { getNowPlaying, backdropStyle } = useTmdb()
    this.loading = true
    this.error = null
    try {
      const movies = await getNowPlaying()
      this.movies = movies.results || []
      if (!this.movies.length) {
        this.error = 'No now-playing titles available.'
        return
      }
      this.number = Math.floor(Math.random() * Math.min(20, this.movies.length))
      this.backdropImgPath = backdropStyle(this.movies[this.number].backdrop_path)
    } catch (e) {
      this.error = e?.statusMessage || e?.message || 'Could not load hero.'
    } finally {
      this.loading = false
    }
  },
}
</script>

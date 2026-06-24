<template>
  <div>
    <section class="h-96 bg-slate-900 bg-opacity-60 overflow-hidden">
      <div class="pt-1 pl-1 opacity-20" v-if="loading">Loading</div>
      <div
        v-else-if="error"
        class="h-full flex items-center justify-center text-slate-400 text-sm px-4 text-center">
        {{ error }}
      </div>
      <div
        class="h-full hero relative bg-cover bg-no-repeat bg-center"
        :style="backdropImgPath"
        v-else-if="movies && movies.length">
        <nuxt-link
          class="absolute top-1 left-1 opacity-60 hover:opacity-100 transition-all"
          :to="'/m/' + movies[number].id"
          >{{ movies[number].title }}</nuxt-link
        >
      </div>
    </section>
  </div>
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

<style scoped>
.hero:before {
  content: '';
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>

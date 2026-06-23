<template>
  <div>
    <div v-if="loading">
      <div
        class="bg-slate-700 shadow rounded-md p-4 h-96 w-full mx-auto animate-pulse"></div>
      <div
        class="details w-2/3 mx-auto p-6 flex gap-6 bg-opacity-40 mt-5 bg-slate-700 shadow rounded-lg h-96 animate-pulse"></div>
    </div>
    <div v-else-if="error" class="max-w-xl mx-auto py-16 px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this movie</p>
      <p class="text-slate-500 text-sm mb-6">{{ error }}</p>
      <nuxt-link to="/" class="underline text-indigo-400">Back home</nuxt-link>
    </div>
    <div v-else-if="movie">
      <div class="movie pb-5">
        <div
          class="banner bg-cover bg-no-repeat bg-center relative h-96"
          :style="backdropImgPath"></div>
        <div
          class="details w-11/12 xl:w-2/3 mx-auto p-6 flex flex-col xl:flex-row gap-6 bg-slate-900 bg-opacity-40 mt-5 rounded-lg">
          <div class="w-full gap-6 flex flex-wrap xl:block xl:w-1/3">
            <Poster
              class="w-1/3 xl:w-full basis-1/3"
              :object="movie"
              mtype="movie"></Poster>
            <Information
              class="w-2/3 xl:w-full flex-1"
              mtype="movie"
              :object="movie"></Information>

            <MCollection
              v-if="movie.belongs_to_collection"
              class="xl:w-full basis-full flex-1"
              :movie="movie"></MCollection>
            <div
              v-if="providers && providers.results && JSON.stringify(providers.results) != '{}'"
              class="bg-slate-800 rounded-lg p-5 mt-0 xl:mt-6 hidden xl:block">
              <h3 class="mb-4 text-2xl font-bold">Providers</h3>
              <MProviders :providers="providers"></MProviders>
            </div>
          </div>
          <div class="w-full xl:w-2/3 overflow-hidden">
            <MTitle :movie="movie"></MTitle>
            <MCast :cast="cast"></MCast>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      movie: null,
      loading: true,
      error: null,
      backdropImgPath: {
        backgroundImage: '',
      },
      cast: [],
      providers: null,
    }
  },
  async created() {
    const { getMovie, getMovieCredits, getMovieProviders, backdropStyle } = useTmdb()
    const id = this.$route.params.mid
    this.loading = true
    this.error = null
    try {
      const movie = await getMovie(id)
      this.movie = movie
      this.backdropImgPath = backdropStyle(movie.backdrop_path)

      const [credits, providers] = await Promise.all([
        getMovieCredits(id).catch(() => ({ cast: [] })),
        getMovieProviders(id).catch(() => null),
      ])
      this.cast = credits.cast || []
      this.providers = providers
    } catch (e) {
      this.error = e?.statusMessage || e?.message || 'Unknown error'
      this.movie = null
    } finally {
      this.loading = false
    }
  },
}
</script>

<style scoped>
.banner:before {
  content: '';
  background-color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
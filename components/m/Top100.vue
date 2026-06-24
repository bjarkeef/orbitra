<template>
  <div class="page-shell">
    <h2 class="text-3xl sm:text-4xl font-black mb-5 text-slate-100">Top 100 Movies</h2>
    <div v-if="loading">
      <SkeletonPosterGrid :count="12" />
    </div>
    <div v-else-if="movies">
      <div
        v-if="currentMoviePage < 3"
        class="poster-grid">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies.slice(0, 18)"
          :key="movie.id" />
      </div>
      <div
        v-else
        class="poster-grid">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies"
          :key="movie.id" />
      </div>
    </div>
    <button
      type="button"
      class="btn-load-more"
      @click="getMoreMovies(currentMoviePage)">
      {{ loadingMoreMovies ? "Fetching more movies..." : "Load more" }}
    </button>
  </div>
</template>
<script>
export default {
  data() {
    return {
      movies: null,
      loading: false,
      loadingMoreMovies: false,
      currentMoviePage: 2,
    };
  },
  async mounted() {
    const { getTopRatedMovies } = useTmdb();
    this.loading = true;
    try {
      const movies = await getTopRatedMovies(1);
      this.movies = movies.results || [];
    } catch {
      this.movies = [];
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async getMoreMovies(pageId) {
      const { getTopRatedMovies } = useTmdb();
      this.loadingMoreMovies = true;
      try {
        const movies = await getTopRatedMovies(pageId);
        this.currentMoviePage++;
        (movies.results || []).forEach((v) => this.movies.push(v));
      } finally {
        this.loadingMoreMovies = false;
      }
    },
  },
};
</script>
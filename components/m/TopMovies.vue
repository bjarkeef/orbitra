<template>
  <div class="page-shell">
    <h2 class="text-3xl sm:text-4xl w-full text-center font-black mb-2 text-slate-100">
      Most popular movies
    </h2>
    <p class="text-lg sm:text-xl w-full text-center font-medium mb-5 text-slate-400">
      See what movies are trending right now
    </p>
    <div v-if="loading">
      <SkeletonPosterGrid :count="12" />
    </div>
    <div v-else>
      <div
        v-if="currentMoviePage < 3"
        class="poster-grid">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies.slice(0, 12)"
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
      movies: [],
      loading: false,
      loadingMoreMovies: false,
      currentMoviePage: 2,
    };
  },
  async created() {
    const { discoverMovies } = useTmdb();
    this.loading = true;
    try {
      const movies = await discoverMovies(1);
      this.movies = movies.results || [];
    } catch {
      this.movies = [];
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async getMoreMovies(pageId) {
      const { discoverMovies } = useTmdb();
      this.loadingMoreMovies = true;
      try {
        const movies = await discoverMovies(pageId);
        this.currentMoviePage++;
        (movies.results || []).forEach((v) => this.movies.push(v));
      } finally {
        this.loadingMoreMovies = false;
      }
    },
  },
};
</script>
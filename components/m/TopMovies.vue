<template>
  <div class="max-w-screen-2xl m-auto py-6 px-6">
    <h2 class="text-4xl w-full text-center font-black mb-2">
      Most popular movies
    </h2>
    <p class="text-xl w-full text-center font-medium mb-5">
      See what movies are trending right now
    </p>
    <div v-if="loading">
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <div
          class="bg-slate-700 shadow rounded-md p-4 max-w-sm w-full mx-auto animate-pulse"
          v-for="num in 6"
          :key="num"></div>
      </div>
    </div>
    <div v-else>
      <div
        v-if="currentMoviePage < 3"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies.slice(0, 12)"
          :key="movie.id" mtype="movie" />
      </div>
      <div
        v-else
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        <MMovie
          :movie="movie"
          :loading="loading"
          v-for="movie in movies"
          :key="movie.id" mtype="movie" />
      </div>
    </div>
    <button
      class="p-2 rounded-md text-center bg-slate-900 mt-6 mx-auto block"
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
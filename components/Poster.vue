<template>
  <div>
    <div class="relative" v-if="this.mtype === 'tv'">
      <img
        v-if="object.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + object.poster_path"
        :alt="object.name"
        class="rounded-md" />
      <img
        class="bg-slate-900 rounded-md"
        v-else
        src="@/assets/img/noPoster.png"
        alt="No Poster" />
    </div>
    <div class="relative" v-else-if="this.mtype === 'movie'">
      <img
        v-if="object.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + object.poster_path"
        :alt="object.name"
        class="rounded-md" />
      <img
        class="bg-slate-900 rounded-md"
        v-else
        src="@/assets/img/noPoster.png"
        alt="No Poster" />
      <div
        class="absolute top-3 left-3 bg-slate-700 py-1 px-2 rounded-md text-sm"
        v-if="this.videos && this.fetching === false">
        <a
          target="_blank"
          :href="'https://youtube.com/watch?v=' + this.videos.results[0].key"
          v-if="this.videos.results.length > 0"
          >Watch Trailer</a
        >
      </div>
      <div
        class="absolute top-3 left-3 bg-slate-700 py-1 px-2 rounded-md text-sm"
        v-if="this.object.adult">
        <span class="text-xl">18+</span>
      </div>
    </div>
    <div v-else-if="this.mtype === 'person'">
      <img
        v-if="object.profile_path"
        :src="'https://image.tmdb.org/t/p/w500/' + object.profile_path"
        :alt="object.name"
        class="rounded-md" />
      <img
        class="bg-slate-900 rounded-md"
        v-else
        src="@/assets/img/noPoster.png"
        alt="No Poster" />
    </div>
    <div v-else-if="this.mtype === 'collection'">
      <img
        v-if="object.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + object.poster_path"
        :alt="object.name"
        class="rounded-md" />
      <img
        class="bg-slate-900 rounded-md"
        v-else
        src="@/assets/img/noPoster.png"
        alt="No Poster" />
    </div>
    <div v-else>
      <img
        v-if="object.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + object.poster_path"
        :alt="object.name"
        class="rounded-md" />
      <img
        class="bg-slate-900 rounded-md"
        v-else
        src="@/assets/img/noPoster.png"
        alt="No Poster" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["object", "mtype"],
  data() {
    return {
      videos: null,
      fetching: false,
    };
  },
  mounted() {
    if (this.mtype === "movie" && this.object?.id) {
      this.getVideos();
    }
  },
  methods: {
    async getVideos() {
      const { getMovieVideos } = useTmdb();
      this.fetching = true;
      try {
        const id = this.object?.id || this.$route.params.mid;
        this.videos = await getMovieVideos(id);
      } catch {
        this.videos = { results: [] };
      } finally {
        this.fetching = false;
      }
    },
  },
};
</script>

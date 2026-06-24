<template>
  <div>
    <SkeletonDetailPage v-if="loading && !season" />
    <div v-else-if="season" class="tv pb-8">
      <div class="media-banner" :style="backdropImgPath" />
      <div class="detail-panel">
        <div class="w-full xl:w-1/3">
          <img
            v-if="season.poster_path"
            :src="'https://image.tmdb.org/t/p/w500/' + season.poster_path"
            :alt="season.name"
            class="rounded-md w-full bg-slate-900"
            loading="lazy"
          />
          <img
            class="bg-slate-900 rounded-md w-full"
            v-else
            src="@/assets/img/noPoster.png"
            alt="No Poster"
          />

          <div class="section-card mt-6">
            <h3 class="text-2xl mb-3 font-bold text-slate-100">Information</h3>
            <p class="text-slate-300">
              Rating:
              {{
                season.vote_average ? season.vote_average.toFixed(1) : "---"
              }}
            </p>
          </div>
        </div>
        <div class="w-full xl:w-2/3 min-w-0">
          <div class="section-card w-full">
            <NuxtLink
              class="btn-back"
              :to="'/tv/' + $route.params.tvid"
            >Go back to show</NuxtLink>
            <h1 v-if="tvname" class="mt-5 text-3xl sm:text-4xl font-bold mb-2 text-slate-100">
              {{ tvname + " – " + season.name }}
            </h1>
            <h1 v-else class="mt-5 text-3xl sm:text-4xl font-bold mb-2 text-slate-100">
              {{ season.name }}
            </h1>
            <hr class="card-divider" />
            <p class="text-slate-300 leading-relaxed">{{ season.overview }}</p>
          </div>

          <div class="section-card scrollbar mt-6 overflow-x-auto">
            <h3 class="mb-4 text-2xl font-bold text-slate-100">Cast</h3>
            <TvCast :cast="cast" />
          </div>
          <TvEpisodes
            v-if="season.episodes"
            :tv="tv"
            :season="season"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      season: null,
      tv: null,
      loading: true,
      backdropImgPath: {
        backgroundImage: "",
      },
      cast: [],
      tvname: null,
    };
  },
  async created() {
    const { getTv, getTvSeason, tmdb, backdropStyle } = useTmdb();
    const tvId = this.$route.params.tvid;
    const seasonNum = this.$route.params.seasonnum;
    this.loading = true;
    try {
      const [show, result] = await Promise.all([
        getTv(tvId).catch(() => null),
        getTvSeason(tvId, seasonNum),
      ]);
      this.tv = show;
      this.tvname = show?.name || null;
      this.season = result;
      this.backdropImgPath = backdropStyle(
        show?.backdrop_path || result?.poster_path || null
      );
      try {
        const credits = await tmdb(`tv/${tvId}/season/${seasonNum}/credits`);
        this.cast = credits.cast || [];
      } catch {
        this.cast = [];
      }
    } catch {
      this.season = null;
    } finally {
      this.loading = false;
    }
  },

  methods: {},
};
</script>

<template>
  <div>
    <SkeletonDetailPage v-if="loading && !episode" />
    <div v-else-if="episode" class="tv pb-8">
      <div class="media-banner" :style="backdropImgPath" />
      <div class="detail-panel">
        <div class="w-full xl:w-1/3">
          <img
            v-if="stillSrc"
            :src="stillSrc"
            :alt="episode.name"
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
            <p class="text-slate-300">Air date: {{ episode.air_date ? episode.air_date : "---" }}</p>
            <p class="text-slate-300">
              Rating:
              {{
                episode.vote_average ? episode.vote_average.toFixed(1) : "---"
              }}
            </p>
            <p class="text-slate-300">
              Runtime: {{ episode.runtime ? episode.runtime : "---" }} min
            </p>
          </div>
        </div>
        <div class="w-full xl:w-2/3 min-w-0">
          <div class="section-card w-full">
            <NuxtLink
              class="btn-back"
              :to="
                '/tv/' +
                $route.params.tvid +
                '/season/' +
                $route.params.seasonnum
              "
            >Go back to season</NuxtLink>
            <h1 class="mt-5 text-3xl sm:text-4xl font-bold mb-2 text-slate-100">
              {{ episode.episode_number }}. {{ episode.name }}
            </h1>
            <hr class="card-divider" />
            <p class="text-slate-300 leading-relaxed">{{ episode.overview }}</p>
          </div>

          <div class="section-card scrollbar mt-6 overflow-x-auto">
            <h3 class="mb-4 text-2xl font-bold text-slate-100">Cast</h3>
            <TvCast :cast="cast" />
          </div>
          <div
            v-if="episode.crew?.length"
            class="section-card scrollbar mt-6 overflow-x-auto"
          >
            <h3 class="mb-4 text-2xl font-bold text-slate-100">Crew</h3>
            <TvCast :cast="episode.crew" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  setup() {
    const { getTvEpisode, getTvCredits, backdropStyle, imageUrl } = useTmdb()
    return { getTvEpisode, getTvCredits, backdropStyle, imageUrl }
  },
  data() {
    return {
      season: null,
      tv: null,
      episode: null,
      loading: true,
      backdropImgPath: {
        backgroundImage: "",
      },
      cast: [],
    };
  },
  computed: {
    stillSrc() {
      return this.imageUrl(this.episode?.still_path, 'w500')
    },
  },
  async created() {
    const tvId = this.$route.params.tvid;
    const seasonNum = this.$route.params.seasonnum;
    const episodeNum = this.$route.params.episodenum;
    this.loading = true;
    try {
      const result = await this.getTvEpisode(tvId, seasonNum, episodeNum);
      this.episode = result;
      this.backdropImgPath = this.backdropStyle(result?.still_path || null);
      try {
        const credits = await this.getTvCredits(tvId);
        this.cast = credits.cast || [];
      } catch {
        this.cast = [];
      }
    } catch {
      this.episode = null;
    } finally {
      this.loading = false;
    }
  },
};
</script>

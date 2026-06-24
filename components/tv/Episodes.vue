<template>
  <div v-if="season.episodes" class="seasons mt-3">
    <h3 class="text-2xl mb-2 font-bold text-slate-100">Episodes</h3>
    <div class="gap-3 grid grid-cols-1 sm:grid-cols-2">
      <NuxtLink
        class="list-card flex-col"
        v-for="episode in season.episodes"
        :key="episode.id"
        :to="
          '/tv/' +
          tv +
          '/season/' +
          season.season_number +
          '/episode/' +
          episode.episode_number
        "
      >
        <div class="w-full">
          <img
            v-if="episode.still_path"
            :src="'https://image.tmdb.org/t/p/w500/' + episode.still_path"
            :alt="episode.name"
            class="rounded-md w-full aspect-video object-cover bg-slate-900"
            loading="lazy"
          />
          <img
            class="bg-slate-900 w-full rounded-md aspect-video object-cover"
            v-else
            src="@/assets/img/noPoster.png"
            alt="No Poster"
          />
        </div>
        <div class="min-w-0">
          <h3 class="text-lg sm:text-xl mb-2 font-bold text-slate-100">
            {{ episode.episode_number }}. {{ episode.name }}
          </h3>
          <p class="text-sm mb-2 text-slate-400 line-clamp-3">
            {{ episode.overview }}
          </p>
          <p class="text-sm text-slate-400">Air date: {{ episode.air_date ? episode.air_date : '---' }}</p>
          <p class="text-sm text-slate-400">
            Rating:
            {{ episode.vote_average ? episode.vote_average.toFixed(1) : '---' }}
          </p>
          <p class="text-sm text-slate-400">Runtime: {{ episode.runtime }} min</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script>
export default {
  props: ['season', 'tv'],
  setup() {},
}
</script>

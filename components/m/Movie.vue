<template>
  <div class="group h-full overflow-hidden rounded-md bg-slate-900 ring-1 ring-slate-800/80">
    <!-- Movie -->
    <NuxtLink
      v-if="kind === 'movie'"
      :to="'/m/' + movie.id"
      class="relative flex h-full"
    >
      <img
        v-if="movie.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + movie.poster_path"
        :alt="movie.title"
        class="h-full w-full object-cover aspect-poster"
        loading="lazy"
      />
      <img
        v-else
        class="h-full w-full object-cover aspect-poster bg-slate-900"
        src="@/assets/img/noPoster.png"
        alt="No Poster"
      />
      <div class="poster-overlay">
        <aside class="min-w-0 pr-2">
          <h3 class="text-sm font-semibold text-white line-clamp-2">{{ movie.title }}</h3>
          <p class="text-2xs text-slate-300 mt-0.5">{{ movie.release_date }}</p>
        </aside>
        <aside class="poster-score shrink-0">
          {{ movie.vote_average ? movie.vote_average.toFixed(1) : '0' }}
        </aside>
      </div>
    </NuxtLink>

    <!-- TV -->
    <NuxtLink
      v-else-if="kind === 'tv'"
      :to="'/tv/' + movie.id"
      class="relative flex h-full"
    >
      <img
        v-if="movie.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + movie.poster_path"
        :alt="movie.name || movie.title"
        class="h-full w-full object-cover aspect-poster"
        loading="lazy"
      />
      <img
        v-else
        class="h-full w-full object-cover aspect-poster bg-slate-900"
        src="@/assets/img/noPoster.png"
        alt="No Poster"
      />
      <div class="poster-overlay">
        <aside class="min-w-0 pr-2">
          <h3 class="text-sm font-semibold text-white line-clamp-2">{{ movie.name }}</h3>
          <p class="text-2xs text-slate-300 mt-0.5">{{ movie.first_air_date }}</p>
        </aside>
        <aside class="poster-score shrink-0">
          {{ movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A' }}
        </aside>
      </div>
    </NuxtLink>

    <!-- Person -->
    <NuxtLink
      v-else-if="kind === 'person'"
      :to="'/actor/' + movie.id"
      class="relative block h-full"
    >
      <img
        v-if="movie.profile_path"
        :src="'https://image.tmdb.org/t/p/w500/' + movie.profile_path"
        :alt="movie.name"
        class="h-full w-full object-cover aspect-poster"
        loading="lazy"
      />
      <img
        v-else
        class="h-full w-full object-cover aspect-poster bg-slate-900"
        src="@/assets/img/noActor.png"
        alt="No Poster"
      />
      <div class="poster-overlay">
        <aside class="min-w-0">
          <h3 class="text-sm font-semibold text-white line-clamp-2">{{ movie.name }}</h3>
        </aside>
      </div>
    </NuxtLink>

    <!-- Default (movie) -->
    <NuxtLink
      v-else
      :to="'/m/' + movie.id"
      class="relative block h-full"
    >
      <img
        v-if="movie.poster_path"
        :src="'https://image.tmdb.org/t/p/w500/' + movie.poster_path"
        :alt="movie.title"
        class="h-full w-full object-cover aspect-poster"
        loading="lazy"
      />
      <img
        v-else
        class="h-full w-full object-cover aspect-poster bg-slate-900"
        src="@/assets/img/noPoster.png"
        alt="No Poster"
      />
      <div class="poster-overlay">
        <aside class="min-w-0 pr-2">
          <h3 class="text-sm font-semibold text-white line-clamp-2">{{ movie.title }}</h3>
          <p class="text-2xs text-slate-300 mt-0.5">{{ movie.release_date }}</p>
        </aside>
        <aside class="poster-score shrink-0">
          {{ movie.vote_average ? movie.vote_average.toFixed(1) : '0' }}
        </aside>
      </div>
    </NuxtLink>
  </div>
</template>

<script>
export default {
  props: ['movie', 'mtype'],
  computed: {
    kind() {
      const t = (this.mtype || this.movie?.media_type || '').toLowerCase()
      if (t === 'tv' || t === 'movie' || t === 'person') return t
      if (this.movie?.media_type) return String(this.movie.media_type).toLowerCase()
      return 'movie'
    },
  },
  created() {
    if (this.mtype && this.movie && !this.movie.media_type) {
      this.movie.media_type = this.mtype
    }
  },
}
</script>

<template>
  <div class="movie overflow-hidden h-full rounded-md bg-slate-900">
    <NuxtLink :to="linkTo" class="flex h-full relative group block min-h-[12rem]">
      <img
        v-if="kind === 'person' && movie.profile_path"
        :src="img(movie.profile_path)"
        :alt="displayTitle"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <img
        v-else-if="kind !== 'person' && movie.poster_path"
        :src="img(movie.poster_path)"
        :alt="displayTitle"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <img
        v-else-if="kind === 'person'"
        class="h-full w-full object-cover bg-slate-950"
        src="@/assets/img/noActor.png"
        alt="No photo"
      />
      <img
        v-else
        class="h-full w-full object-cover bg-slate-950"
        src="@/assets/img/noPoster.png"
        alt="No poster"
      />
      <div
        class="details w-full flex h-full items-end justify-between p-2 absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      >
        <aside class="min-w-0 pr-2">
          <h3 class="truncate font-semibold text-sm">{{ displayTitle }}</h3>
          <span v-if="dateLabel" class="text-xs text-slate-300">{{ dateLabel }}</span>
        </aside>
        <aside
          v-if="kind !== 'person'"
          class="rounded-md p-1 text-center movie-score shrink-0 text-sm bg-black/40"
        >
          {{ scoreLabel }}
        </aside>
      </div>
    </NuxtLink>
  </div>
</template>

<script>
/**
 * Poster card for movie / tv / person.
 * Prefer explicit `mtype` prop; fall back to item.media_type; then heuristics.
 * Never mutates the `movie` prop object.
 */
export default {
  name: 'MMovie',
  props: {
    movie: { type: Object, required: true },
    /** Optional override: movie | tv | person */
    mtype: { type: String, default: '' },
  },
  computed: {
    kind() {
      const fromProp = String(this.mtype || '').toLowerCase()
      if (fromProp === 'movie' || fromProp === 'tv' || fromProp === 'person') return fromProp
      const fromItem = String(this.movie?.media_type || '').toLowerCase()
      if (fromItem === 'movie' || fromItem === 'tv' || fromItem === 'person') return fromItem
      if (this.movie?.profile_path && !this.movie?.poster_path) return 'person'
      if (this.movie?.first_air_date && !this.movie?.release_date) return 'tv'
      if (this.movie?.name && !this.movie?.title) return 'tv'
      return 'movie'
    },
    displayTitle() {
      if (this.kind === 'movie') return this.movie.title || this.movie.original_title || 'Untitled'
      return this.movie.name || this.movie.original_name || this.movie.title || 'Untitled'
    },
    dateLabel() {
      if (this.kind === 'movie') return this.movie.release_date || ''
      if (this.kind === 'tv') return this.movie.first_air_date || ''
      return ''
    },
    scoreLabel() {
      const v = this.movie?.vote_average
      if (v === undefined || v === null || Number.isNaN(Number(v))) return '—'
      return Number(v).toFixed(1)
    },
    linkTo() {
      if (this.kind === 'tv') return `/tv/${this.movie.id}`
      if (this.kind === 'person') return `/actor/${this.movie.id}`
      return `/m/${this.movie.id}`
    },
  },
  methods: {
    img(path) {
      const { imageUrl } = useTmdb()
      return imageUrl(path, 'w500')
    },
  },
}
</script>

<style scoped>
.details {
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.95) 10%,
    rgba(255, 255, 255, 0.01) 100%
  );
}
</style>

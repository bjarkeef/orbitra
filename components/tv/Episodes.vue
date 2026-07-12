<template>
  <div v-if="season.episodes" class="space-y-3">
    <NuxtLink
      v-for="episode in season.episodes"
      :key="episode.id"
      class="group flex flex-col sm:flex-row gap-3 sm:gap-4 rounded-xl bg-slate-900/50 ring-1 ring-slate-700/50 p-3
        hover:ring-indigo-500/40 hover:bg-slate-900/80 transition-colors"
      :to="`/tv/${tv}/season/${season.season_number}/episode/${episode.episode_number}`"
    >
      <div class="sm:w-44 shrink-0">
        <div class="rounded-lg overflow-hidden aspect-video bg-slate-950 ring-1 ring-slate-800">
          <NuxtImg
            v-if="stillSrc(episode)"
            :src="stillSrc(episode)"
            :alt="episode.name"
            width="500"
            height="281"
            class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
            format="webp"
            densities="1x 2x"
          />
          <NuxtImg
            v-else
            src="/img/noPoster.png"
            alt=""
            width="500"
            height="281"
            class="w-full h-full object-cover opacity-50"
            loading="lazy"
          />
        </div>
      </div>
      <div class="min-w-0 flex-1 flex flex-col">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h3 class="text-base sm:text-lg font-bold text-slate-100 group-hover:text-white">
            <span class="text-slate-500 font-semibold tabular-nums mr-1.5">{{ episode.episode_number }}.</span>
            {{ episode.name || 'Untitled' }}
          </h3>
          <UIRatingBadge
            v-if="episode.vote_average"
            :vote-average="episode.vote_average"
            :vote-count="episode.vote_count"
            :min-votes="5"
          />
        </div>
        <p class="mt-1.5 text-sm text-slate-400 line-clamp-2 sm:line-clamp-3 flex-1">
          {{ episode.overview || 'No synopsis.' }}
        </p>
        <p class="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
          <span v-if="episode.air_date">{{ episode.air_date }}</span>
          <span v-if="episode.runtime">{{ episode.runtime }} min</span>
        </p>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface EpisodeRow {
  id: number
  name?: string
  overview?: string
  air_date?: string | null
  vote_average?: number
  vote_count?: number
  runtime?: number
  episode_number: number
  still_path?: string | null
}

interface SeasonPayload {
  season_number?: number
  episodes?: EpisodeRow[]
}

defineProps<{
  season: SeasonPayload
  tv: string | number
}>()

const { imageUrl } = useTmdb()

function stillSrc(episode: EpisodeRow) {
  return imageUrl(episode?.still_path, 'w500')
}
</script>

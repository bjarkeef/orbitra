<template>
  <div v-if="hasCommunity || showUser" class="rating-panel space-y-4">
    <!-- Community (TMDB) -->
    <div v-if="hasCommunity">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Community
          </p>
          <p class="mt-1 flex items-baseline gap-1.5">
            <span
              class="text-3xl font-black tabular-nums tracking-tight"
              :class="tierCls.text"
            >{{ scoreText }}</span>
            <span class="text-sm text-slate-500">/ 10</span>
          </p>
          <p v-if="votes > 0" class="mt-1 text-xs text-slate-500">
            {{ formatVoteCount(votes) }} TMDB vote{{ votes === 1 ? '' : 's' }}
            <span v-if="votes < 50" class="text-slate-600"> · limited sample</span>
          </p>
          <p v-else class="mt-1 text-xs text-slate-600">Few or no votes yet</p>
        </div>
        <div
          class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ring-1"
          :class="[tierCls.bg, tierCls.ring]"
          :title="`TMDB ${scoreText}/10`"
        >
          <span class="text-lg leading-none" aria-hidden="true">★</span>
          <span class="text-sm font-bold tabular-nums" :class="tierCls.text">{{ scoreText }}</span>
        </div>
      </div>
      <div class="mt-3 h-2 rounded-full bg-slate-900/80 overflow-hidden ring-1 ring-slate-700/40">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="tierCls.bar"
          :style="{ width: percent + '%' }"
        />
      </div>
    </div>

    <!-- Your rating (movies / local only) -->
    <div v-if="showUser" class="pt-3 border-t border-slate-700/50">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Your rating
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Saved in this browser · counts toward collection progress
      </p>
      <div class="mt-3 flex flex-wrap gap-1">
        <button
          v-for="n in 10"
          :key="n"
          type="button"
          class="user-score-btn"
          :class="{ 'user-score-btn-on': userScore === n }"
          :aria-pressed="userScore === n"
          :aria-label="`Rate ${n} out of 10`"
          @click="onPick(n)"
        >
          {{ n }}
        </button>
        <button
          v-if="userScore"
          type="button"
          class="ml-1 text-xs text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline"
          @click="onClear"
        >
          Clear
        </button>
      </div>
      <p v-if="userScore" class="mt-2 text-sm text-indigo-200/90">
        You rated this <strong class="font-semibold">{{ userScore }}</strong>/10
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatScore,
  formatVoteCount,
  parseScore,
  parseVoteCount,
  scorePercent,
  tierClasses,
  tierFromScore,
} from '~/utils/ratings'

const props = withDefaults(
  defineProps<{
    voteAverage?: number | null
    voteCount?: number | null
    /** Enable local 1–10 rater (movies with a TMDB id). */
    mediaId?: string | number | null
    allowUserRating?: boolean
  }>(),
  {
    voteAverage: null,
    voteCount: null,
    mediaId: null,
    allowUserRating: false,
  },
)

const { getRating, rateMovie, clearRating } = useMovieRatings()

const scoreText = computed(() => formatScore(props.voteAverage))
const votes = computed(() => parseVoteCount(props.voteCount))
const hasCommunity = computed(() => Boolean(scoreText.value))
const tierCls = computed(() => tierClasses(tierFromScore(parseScore(props.voteAverage))))
const percent = computed(() => scorePercent(props.voteAverage))

const showUser = computed(
  () => props.allowUserRating && props.mediaId != null && props.mediaId !== '',
)

const userScore = computed(() => {
  if (!showUser.value || props.mediaId == null) return null
  const entry = getRating(props.mediaId)
  return entry?.score ?? null
})

function onPick(n: number) {
  if (props.mediaId == null) return
  if (userScore.value === n) {
    clearRating(props.mediaId)
    return
  }
  rateMovie(props.mediaId, n)
}

function onClear() {
  if (props.mediaId == null) return
  clearRating(props.mediaId)
}
</script>

<style scoped>
.user-score-btn {
  @apply w-8 h-8 rounded-md text-xs font-semibold tabular-nums
    bg-slate-900 text-slate-400 ring-1 ring-slate-700/70
    hover:text-slate-100 hover:ring-slate-500 transition-colors;
}
.user-score-btn-on {
  @apply bg-indigo-500/30 text-indigo-100 ring-indigo-400/50;
}
</style>

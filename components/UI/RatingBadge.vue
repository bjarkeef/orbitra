<template>
  <span
    v-if="show"
    class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ring-1 backdrop-blur-sm"
    :class="[classes.bg, classes.text, classes.ring, sizeClass]"
    :title="titleAttr"
  >
    <span class="opacity-90" aria-hidden="true">★</span>
    {{ scoreText }}
  </span>
</template>

<script setup lang="ts">
import {
  formatScore,
  formatVoteCount,
  parseScore,
  parseVoteCount,
  shouldShowPosterRating,
  tierClasses,
  tierFromScore,
  RATING_MIN_VOTES_POSTER,
} from '~/utils/ratings'

const props = withDefaults(
  defineProps<{
    voteAverage?: number | null
    voteCount?: number | null
    /** Force show even with low votes (detail contexts). */
    force?: boolean
    size?: 'sm' | 'md'
    minVotes?: number
  }>(),
  {
    voteAverage: null,
    voteCount: null,
    force: false,
    size: 'sm',
    minVotes: RATING_MIN_VOTES_POSTER,
  },
)

const scoreText = computed(() => formatScore(props.voteAverage))
const votes = computed(() => parseVoteCount(props.voteCount))
const show = computed(() => {
  if (props.force) return Boolean(scoreText.value)
  return shouldShowPosterRating(props.voteAverage, props.voteCount, props.minVotes)
})
const tier = computed(() => tierFromScore(parseScore(props.voteAverage)))
const classes = computed(() => tierClasses(tier.value))
const sizeClass = computed(() => (props.size === 'md' ? 'text-sm px-2 py-1' : ''))
const titleAttr = computed(() => {
  const s = scoreText.value
  if (!s) return 'No rating'
  if (votes.value > 0) return `TMDB ${s}/10 · ${formatVoteCount(votes.value)} votes`
  return `TMDB ${s}/10`
})
</script>

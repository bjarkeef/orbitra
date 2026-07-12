<template>
  <div class="flex gap-3 min-w-fit">
    <div v-for="member in visible" :key="member.id + '-' + (member.credit_id || member.character || '')" class="w-36">
      <NuxtLink :to="'/actor/' + member.id" class="cast-tile">
        <NuxtImg
          v-if="profileSrc(member)"
          :src="profileSrc(member)"
          :alt="member.original_name || member.name || 'Cast member'"
          width="300"
          height="300"
          class="cast-avatar"
          loading="lazy"
          format="webp"
          densities="1x 2x"
        />
        <NuxtImg
          v-else
          src="/img/noActor.png"
          alt=""
          width="128"
          height="128"
          class="cast-avatar"
          loading="lazy"
        />
        <div class="text-sm text-slate-200">
          {{ member.original_name || member.name }}
          <span v-if="member.character" class="text-slate-400"><br />as {{ member.character }}</span>
          <span v-else-if="member.job" class="text-slate-400"><br />{{ member.job }}</span>
        </div>
      </NuxtLink>
    </div>
    <button
      v-if="!expanded && sorted.length > initialCount"
      type="button"
      class="bg-slate-900/90 hover:bg-slate-900 w-36 rounded-lg px-2 py-6 mr-4 my-auto transition-colors text-slate-300 text-sm"
      @click="expanded = true"
    >
      See all
    </button>
    <template v-if="expanded">
      <div v-for="member in rest" :key="'more-' + member.id + '-' + (member.credit_id || member.character || '')" class="w-36">
        <NuxtLink :to="'/actor/' + member.id" class="cast-tile">
          <NuxtImg
            v-if="profileSrc(member)"
            :src="profileSrc(member)"
            :alt="member.original_name || member.name || 'Cast member'"
            width="300"
            height="300"
            class="cast-avatar"
            loading="lazy"
            format="webp"
            densities="1x 2x"
          />
          <NuxtImg
            v-else
            src="/img/noActor.png"
            alt=""
            width="128"
            height="128"
            class="cast-avatar"
            loading="lazy"
          />
          <div class="text-sm text-slate-200">
            {{ member.original_name || member.name }}
            <span v-if="member.character" class="text-slate-400"><br />as {{ member.character }}</span>
            <span v-else-if="member.job" class="text-slate-400"><br />{{ member.job }}</span>
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/** Cast / crew row member (movie, TV, season, episode). */
export interface CastRailMember {
  id: number
  original_name?: string
  name?: string
  character?: string
  job?: string
  credit_id?: string
  profile_path?: string | null
  popularity?: number
}

const props = withDefaults(defineProps<{
  cast: CastRailMember[]
  /** Sort by TMDB popularity (movies). Leave false to keep API order. */
  sortByPopularity?: boolean
  initialCount?: number
}>(), {
  sortByPopularity: false,
  initialCount: 12,
})

const expanded = ref(false)
const { imageUrl } = useTmdb()

const sorted = computed(() => {
  const list = props.cast || []
  if (!props.sortByPopularity) return list
  return [...list].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
})

const visible = computed(() => sorted.value.slice(0, props.initialCount))
const rest = computed(() => sorted.value.slice(props.initialCount))

function profileSrc(member: CastRailMember) {
  return imageUrl(member?.profile_path, 'w300_and_h300_bestv2')
}
</script>

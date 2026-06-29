<template>
  <div>
    <div class="section-card scrollbar overflow-x-auto">
      <h2 class="mb-4 text-xl font-bold text-slate-100">Cast</h2>
      <div class="flex gap-3 min-w-fit">
        <div v-for="member in sortByPopularity(cast.slice(0, 12))" :key="member.id" class="w-36">
          <NuxtLink :to="'/actor/' + member.id" class="cast-tile">
            <img
              v-if="profileSrc(member)"
              :src="profileSrc(member)"
              :alt="member.original_name"
              class="cast-avatar"
              loading="lazy"
            />
            <img v-else class="cast-avatar" src="@/assets/img/noActor.png" alt="No Profile Image" />
            <div class="text-sm text-slate-200">
              {{ member.original_name }}
              <span v-if="member.character" class="text-slate-400"><br />as {{ member.character }}</span>
            </div>
          </NuxtLink>
        </div>
        <button
          v-if="!seeAllActors && cast.length > 12"
          type="button"
          class="bg-slate-900/90 hover:bg-slate-900 w-36 rounded-lg px-2 py-6 mr-4 my-auto transition-colors text-slate-300 text-sm"
          @click="seeAllActors = true"
        >
          See all actors
        </button>
        <div v-if="seeAllActors" class="flex gap-3 min-w-fit">
          <div v-for="member in sortByPopularity(cast.slice(12, 999))" :key="member.id" class="w-36">
            <NuxtLink :to="'/actor/' + member.id" class="cast-tile">
              <img
                v-if="profileSrc(member)"
                :src="profileSrc(member)"
                :alt="member.original_name"
                class="cast-avatar"
                loading="lazy"
              />
              <img v-else class="cast-avatar" src="@/assets/img/noActor.png" alt="No Profile Image" />
              <div class="text-sm text-slate-200">
                {{ member.original_name }}
                <span v-if="member.character" class="text-slate-400"><br />as {{ member.character }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface MovieCastMember {
  id: number
  original_name?: string
  character?: string
  profile_path?: string | null
  popularity?: number
}

defineProps<{
  cast: MovieCastMember[]
}>()

const seeAllActors = ref(false)
const { imageUrl } = useTmdb()

function profileSrc(member: MovieCastMember) {
  return imageUrl(member?.profile_path, 'w300_and_h300_bestv2')
}

function sortByPopularity(array: MovieCastMember[]) {
  return [...array].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
}
</script>

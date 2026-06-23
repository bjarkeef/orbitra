<template>
  <div>
    <div v-if="mtype === 'tv'" class="relative">
      <img v-if="object.poster_path" :src="posterSrc" :alt="object.name || object.title" class="rounded-md" loading="lazy" />
      <img v-else class="bg-slate-900 rounded-md" src="@/assets/img/noPoster.png" alt="No Poster" />
    </div>
    <div v-else-if="mtype === 'movie'" class="relative">
      <img v-if="object.poster_path" :src="posterSrc" :alt="object.title || object.name" class="rounded-md" loading="lazy" />
      <img v-else class="bg-slate-900 rounded-md" src="@/assets/img/noPoster.png" alt="No Poster" />
      <div v-if="trailerKey" class="absolute top-3 left-3 bg-slate-700 py-1 px-2 rounded-md text-sm">
        <a target="_blank" rel="noopener noreferrer" :href="'https://youtube.com/watch?v=' + trailerKey">Watch Trailer</a>
      </div>
      <div v-if="object.adult" class="absolute top-3 left-3 bg-slate-700 py-1 px-2 rounded-md text-sm"><span class="text-xl">18+</span></div>
    </div>
    <div v-else-if="mtype === 'person'">
      <img v-if="object.profile_path" :src="profileSrc" :alt="object.name" class="rounded-md" loading="lazy" />
      <img v-else class="bg-slate-900 rounded-md" src="@/assets/img/noPoster.png" alt="No Poster" />
    </div>
    <div v-else>
      <img v-if="object.poster_path" :src="posterSrc" :alt="object.name || object.title" class="rounded-md" loading="lazy" />
      <img v-else class="bg-slate-900 rounded-md" src="@/assets/img/noPoster.png" alt="No Poster" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    object: { type: Object, required: true },
    mtype: { type: String, default: '' },
    videos: { type: Object, default: null },
  },
  computed: {
    posterSrc() {
      const { imageUrl } = useTmdb()
      return this.object?.poster_path ? imageUrl(this.object.poster_path, 'w500') : ''
    },
    profileSrc() {
      const { imageUrl } = useTmdb()
      return this.object?.profile_path ? imageUrl(this.object.profile_path, 'w500') : ''
    },
    trailerKey() {
      const results = this.videos?.results
      if (!Array.isArray(results) || !results.length) return ''
      const yt = results.find((v) => v.site === 'YouTube' && v.type === 'Trailer') || results[0]
      return yt?.key || ''
    },
  },
}
</script>

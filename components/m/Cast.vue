<template>
  <div class="bg-slate-800 rounded-lg p-5 scrollbar mt-6 overflow-x-scroll">
    <h3 class="mb-4 text-xl font-bold">Cast</h3>
    <div class="flex gap-3 min-w-fit">
      <div v-for="member in sorted" :key="member.id" class="w-36">
        <NuxtLink :to="'/actor/' + member.id" class="flex flex-col gap-2 p-2 rounded-lg hover:bg-slate-700/50">
          <img v-if="member.profile_path" :src="profileImg(member.profile_path)" :alt="member.name" class="w-32 h-32 rounded-md object-cover" loading="lazy" />
          <img v-else class="bg-slate-900 w-32 h-32 object-cover rounded-md" src="@/assets/img/noActor.png" alt="No profile" />
          <div class="text-sm">{{ member.original_name || member.name }}<span v-if="member.character"><br />as {{ member.character }}</span></div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: { cast: { type: Array, default: () => [] } },
  computed: {
    sorted() {
      return [...(this.cast || [])].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20)
    },
  },
  methods: {
    profileImg(path) {
      const { imageUrl } = useTmdb()
      return imageUrl(path, 'w300_and_h300_bestv2')
    },
  },
}
</script>

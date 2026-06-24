<template>
  <div>
    <div class="flex gap-3 min-w-fit">
      <div v-for="member in cast.slice(0, 12)" :key="member.id" class="w-36">
        <NuxtLink
          :to="'/actor/' + member.id"
          class="cast-tile"
        >
          <img
            :src="profileSrc(member)"
            :alt="member.original_name"
            class="cast-avatar"
            v-if="profileSrc(member)"
            loading="lazy"
          />
          <img
            class="cast-avatar"
            v-else
            src="@/assets/img/noActor.png"
            alt="No Profile Image"
          />
          <div class="text-sm text-slate-200">
            {{ member.original_name }}
            <span v-if="member.character" class="text-slate-400"
              ><br />
              as {{ member.character }}</span
            >
          </div>
        </NuxtLink>
      </div>
      <button
        type="button"
        class="bg-slate-900/90 hover:bg-slate-900 w-36 rounded-lg px-2 py-6 mr-4 my-auto transition-colors text-slate-300 text-sm"
        v-if="!seeAllActors && cast.length > 12"
        @click="seeAllActors = true"
      >
        See all actors
      </button>
      <div v-if="seeAllActors" class="flex gap-3 min-w-fit">
        <div
          v-for="member in cast.slice(12, 999)"
          :key="member.id"
          class="w-36"
        >
          <NuxtLink
            :to="'/actor/' + member.id"
            class="cast-tile"
          >
            <img
              :src="profileSrc(member)"
              :alt="member.original_name"
              class="cast-avatar"
              v-if="profileSrc(member)"
              loading="lazy"
            />
            <img
              class="cast-avatar"
              v-else
              src="@/assets/img/noActor.png"
              alt="No Profile Image"
            />
            <div class="text-sm text-slate-200">
              {{ member.original_name }}
              <span v-if="member.character" class="text-slate-400"
                ><br />
                as {{ member.character }}</span
              >
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: ['cast'],
  setup() {
    const { imageUrl } = useTmdb()
    return { imageUrl }
  },
  data() {
    return {
      seeAllActors: false,
    }
  },
  methods: {
    profileSrc(member) {
      return this.imageUrl(member?.profile_path, 'w300_and_h300_bestv2')
    },
  },
}
</script>

<template>
  <div class="page-shell pb-16">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <NuxtLink to="/orbit" class="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
          ← All orbits
        </NuxtLink>
        <h1 class="mt-1 text-2xl sm:text-3xl font-black text-white">
          {{ personName || 'Orbit' }}
        </h1>
      </div>
      <NuxtLink
        v-if="personId"
        :to="'/actor/' + personId + '?view=orbit'"
        class="btn-secondary text-sm"
      >
        Full person page
      </NuxtLink>
    </div>

    <div v-if="errorMsg" class="section-card text-center py-12">
      <p class="text-rose-300">{{ errorMsg }}</p>
      <NuxtLink to="/orbit" class="btn-ghost mt-4 inline-block">Back to orbit explorer</NuxtLink>
    </div>

    <ClientOnly v-else>
      <LazyActorOrbitStage
        :person-id="personId"
        :person-name="personName"
        :sync-route="true"
      />
      <template #fallback>
        <div class="h-96 rounded-xl bg-slate-900/80 animate-pulse ring-1 ring-slate-700/60" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getPersonDetailed } = useTmdb()

const personId = computed(() => String(route.params.personId))

const { data: person, error } = useLazyAsyncData(
  () => `orbit-person-${personId.value}`,
  () => getPersonDetailed(personId.value),
  { watch: [personId] },
)

const personName = computed(() => person.value?.name || '')
const errorMsg = computed(() => {
  const e = error.value as { statusMessage?: string, message?: string } | null
  if (!e) return null
  return e.statusMessage || e.message || 'Could not load person'
})

useSeoMeta({
  title: computed(() => personName.value ? `${personName.value} · Orbit — Orbitra` : 'Orbit — Orbitra'),
  description: computed(() =>
    personName.value
      ? `Co-star collaboration orbit for ${personName.value} on Orbitra.`
      : 'Co-star orbit graph on Orbitra.',
  ),
})
</script>

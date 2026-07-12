<template>
  <!-- Match rail gutters; card itself stays mid-width so ultrawides don't stretch it -->
  <section class="max-w-screen-2xl mx-auto px-4 sm:px-6" aria-labelledby="orbit-spotlight-heading">
    <div class="mx-auto max-w-3xl lg:max-w-4xl">
      <div
        class="relative overflow-hidden rounded-3xl ring-1 ring-indigo-400/25
          bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-900
          shadow-xl shadow-indigo-950/40"
      >
        <!-- Soft glow + orbit rings (decorative) -->
        <div
          class="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full
            bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          class="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2
            hidden sm:block h-52 w-52 lg:h-60 lg:w-60"
          aria-hidden="true"
        >
          <div class="absolute inset-0 rounded-full border border-indigo-400/20" />
          <div class="absolute inset-4 rounded-full border border-indigo-400/15" />
          <div class="absolute inset-10 rounded-full border border-indigo-300/10" />
        </div>

        <div class="relative p-6 sm:p-8 lg:p-9">
          <div class="grid gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] md:items-center">
            <!-- Copy -->
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/90">
                Signature feature
              </p>
              <h2
                id="orbit-spotlight-heading"
                class="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
              >
                Map co-star orbits
              </h2>
              <p class="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
                Server-built collaboration graphs — posters and faces on the canvas,
                shareable filters, motion only when you want it.
              </p>
              <div class="mt-5 flex flex-wrap gap-2.5">
                <NuxtLink
                  :to="'/orbit/' + spotlight.id"
                  class="btn-primary !px-4 !py-2 text-sm"
                >
                  {{ spotlight.name.split(' ')[0] }}'s orbit
                </NuxtLink>
                <NuxtLink
                  to="/orbit"
                  class="inline-flex items-center justify-center px-4 py-2 rounded-full
                    text-sm font-semibold text-slate-200 bg-slate-800/90 ring-1 ring-slate-600/70
                    hover:bg-slate-700/90 hover:ring-slate-500 transition-colors"
                >
                  Browse all
                </NuxtLink>
              </div>
              <p class="mt-4 text-xs text-slate-500">
                Or pick
                <NuxtLink to="/tonight" class="text-indigo-300/90 hover:text-indigo-200 font-semibold">
                  Tonight
                </NuxtLink>
                for a mood-based watch pick.
              </p>
            </div>

            <!-- Person constellation -->
            <div class="relative min-w-0">
              <ul class="grid grid-cols-2 gap-2.5 sm:gap-3 list-none m-0 p-0">
                <li
                  v-for="(p, i) in people"
                  :key="p.id"
                  :class="i === 0 ? 'col-span-2' : ''"
                >
                  <NuxtLink
                    :to="'/orbit/' + p.id"
                    class="group flex items-center gap-3 rounded-2xl
                      bg-slate-950/55 ring-1 ring-slate-700/60 px-3 py-2.5
                      hover:ring-indigo-400/45 hover:bg-slate-950/80 transition-all"
                    :class="i === 0 ? 'sm:py-3.5 sm:px-4' : ''"
                  >
                    <span
                      class="relative shrink-0 overflow-hidden rounded-full
                        bg-slate-800 ring-2 ring-indigo-500/30 group-hover:ring-indigo-400/50
                        transition-shadow"
                      :class="i === 0 ? 'h-14 w-14 sm:h-16 sm:w-16' : 'h-11 w-11'"
                    >
                      <NuxtImg
                        v-if="p.image"
                        :src="p.image"
                        :alt="''"
                        :width="i === 0 ? 128 : 88"
                        :height="i === 0 ? 128 : 88"
                        class="h-full w-full object-cover object-top"
                        loading="lazy"
                        format="webp"
                      />
                      <span
                        v-else
                        class="flex h-full w-full items-center justify-center
                          text-xs font-bold text-indigo-200/80"
                        aria-hidden="true"
                      >
                        {{ initials(p.name) }}
                      </span>
                    </span>
                    <span class="min-w-0 flex-1">
                      <span
                        class="block font-bold text-slate-100 truncate group-hover:text-white"
                        :class="i === 0 ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'"
                      >
                        {{ p.name }}
                      </span>
                      <span class="block text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        {{ p.blurb }}
                      </span>
                    </span>
                    <span
                      class="shrink-0 text-indigo-300/70 group-hover:text-indigo-200 text-sm"
                      aria-hidden="true"
                    >→</span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface SpotlightPerson {
  id: number
  name: string
  blurb: string
  image: string
}

const curated = [
  { id: 6193, name: 'Leonardo DiCaprio', blurb: 'Featured · open his co-star web' },
  { id: 1245, name: 'Scarlett Johansson', blurb: 'Dense Marvel / indie orbit' },
  { id: 525, name: 'Christopher Nolan', blurb: 'Director · cast constellations' },
  { id: 5064, name: 'Meryl Streep', blurb: 'Career-spanning collaborators' },
] as const

const { imageUrl } = useTmdb()

const { data: faces } = useLazyAsyncData(
  'home-orbit-spotlight-faces',
  async () => {
    const rows = await Promise.all(
      curated.map(async (c) => {
        try {
          const person = await $fetch<{ name?: string, profile_path?: string | null }>(
            `/api/tmdb/person/${c.id}`,
          )
          return {
            id: c.id,
            name: person.name || c.name,
            blurb: c.blurb,
            image: imageUrl(person.profile_path, 'w185'),
          } satisfies SpotlightPerson
        }
        catch {
          return {
            id: c.id,
            name: c.name,
            blurb: c.blurb,
            image: '',
          } satisfies SpotlightPerson
        }
      }),
    )
    return rows
  },
)

const people = computed<SpotlightPerson[]>(() => {
  if (faces.value?.length) return faces.value
  return curated.map(c => ({
    id: c.id,
    name: c.name,
    blurb: c.blurb,
    image: '',
  }))
})

const spotlight = computed(() => people.value[0] || {
  id: 6193,
  name: 'Leonardo DiCaprio',
  blurb: '',
  image: '',
})

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')
}
</script>

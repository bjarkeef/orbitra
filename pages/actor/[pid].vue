<template>
  <div>
    <SkeletonDetailPage v-if="pending && !person" />

    <div v-else-if="errorMsg && !person" class="max-w-xl mx-auto py-16 px-4 sm:px-6 text-center">
      <p class="text-xl text-slate-300 mb-2">Could not load this person</p>
      <p class="text-slate-500 text-sm mb-6">{{ errorMsg }}</p>
      <button type="button" class="btn-ghost mr-4" @click="refresh()">Retry</button>
      <NuxtLink to="/" class="btn-ghost">Back home</NuxtLink>
    </div>

    <div v-else-if="person" class="person-page pb-16">
      <!-- Hero -->
      <header class="relative w-full overflow-hidden min-h-[20rem] sm:min-h-[24rem]">
        <div
          class="absolute inset-0 bg-cover bg-center scale-105"
          :style="backdropImgPath"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/55 to-transparent" />

        <div class="relative max-w-screen-2xl mx-auto px-4 sm:px-6 pt-10 pb-12 flex flex-col sm:flex-row gap-8 items-end min-h-[20rem] sm:min-h-[24rem]">
          <div class="shrink-0 w-36 sm:w-44 md:w-48 mx-auto sm:mx-0">
            <div class="rounded-2xl overflow-hidden aspect-[2/3] bg-slate-900 ring-1 ring-white/10 shadow-2xl shadow-black/50">
              <img
                v-if="profileUrl"
                :src="profileUrl"
                :alt="person.name"
                class="w-full h-full object-cover"
              />
              <img
                v-else
                src="@/assets/img/noActor.png"
                alt=""
                class="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>

          <div class="flex-1 min-w-0 text-center sm:text-left pb-1">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
              {{ person.known_for_department || 'Person' }}
            </p>
            <h1 class="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
              {{ person.name }}
            </h1>

            <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span
                v-if="ageLine"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >
                {{ ageLine }}
              </span>
              <span
                v-if="bundle"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >
                {{ bundle.breakdown.totalTitles }} titles
              </span>
              <span
                v-if="bundle"
                class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10"
              >
                {{ bundle.breakdown.movies }} movies · {{ bundle.breakdown.tv }} TV
              </span>
            </div>

            <div
              v-if="externalLinks.length"
              class="mt-5 flex flex-wrap justify-center sm:justify-start gap-2"
            >
              <a
                v-for="link in externalLinks"
                :key="link.id"
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full bg-indigo-500/20 px-3.5 py-1.5 text-xs font-semibold text-indigo-100 ring-1 ring-indigo-400/30 hover:bg-indigo-500/35 transition-colors"
              >
                {{ link.label }}
                <span class="opacity-60" aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 -mt-4 relative z-10 space-y-8">
        <!-- Bio + birthplace map + aka -->
        <section class="grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 section-card">
            <h2 class="text-xl font-bold text-slate-100">Biography</h2>
            <p
              v-if="person.biography"
              class="mt-3 whitespace-pre-line text-slate-300 leading-relaxed text-sm sm:text-base"
              :class="bioExpanded ? '' : 'line-clamp-[12]'"
            >
              {{ person.biography }}
            </p>
            <p v-else class="mt-3 text-slate-500 text-sm">No biography on TMDB for this person.</p>
            <button
              v-if="person.biography && person.biography.length > 600"
              type="button"
              class="btn-ghost mt-3 text-sm"
              @click="bioExpanded = !bioExpanded"
            >
              {{ bioExpanded ? 'Show less' : 'Read full biography' }}
            </button>

            <div
              v-if="person.also_known_as?.length"
              class="mt-6 pt-5 border-t border-slate-700/60"
            >
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide">Also known as</h3>
              <p class="mt-2 text-sm text-slate-300 leading-relaxed">
                {{ person.also_known_as.join(' · ') }}
              </p>
            </div>
          </div>

          <div class="section-card flex flex-col gap-4">
            <h2 class="text-xl font-bold text-slate-100">Born</h2>
            <p v-if="person.birthday" class="text-slate-300 text-sm">
              {{ formatDate(person.birthday) }}
              <span v-if="person.deathday" class="text-slate-500">
                – {{ formatDate(person.deathday) }}
              </span>
            </p>
            <p v-if="person.place_of_birth" class="text-slate-200 font-medium">
              {{ person.place_of_birth }}
            </p>
            <p v-else class="text-sm text-slate-500">Birthplace not listed.</p>

            <!-- Map: OpenStreetMap embed via search link + static frame -->
            <div
              v-if="mapEmbedSrc"
              class="rounded-xl overflow-hidden ring-1 ring-slate-700/80 bg-slate-900 aspect-[4/3] relative"
            >
              <iframe
                :src="mapEmbedSrc"
                class="absolute inset-0 w-full h-full border-0 grayscale-[20%]"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Birthplace map"
              />
            </div>
            <a
              v-if="mapSearchUrl"
              :href="mapSearchUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary text-center text-sm !bg-slate-900"
            >
              Open in OpenStreetMap
            </a>

            <div
              v-if="extrasPending && !taggedProfiles.length"
              class="h-20 rounded-lg bg-slate-800 animate-pulse"
            />
            <div v-else-if="taggedProfiles.length" class="pt-2">
              <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Photos</h3>
              <div class="flex gap-2 overflow-x-auto scrollbar pb-1">
                <img
                  v-for="(img, i) in taggedProfiles.slice(0, 8)"
                  :key="img.file_path + i"
                  :src="imageUrl(img.file_path, 'w185')"
                  alt=""
                  class="h-20 w-14 object-cover rounded-md ring-1 ring-slate-700 shrink-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Role breakdown -->
        <section v-if="bundle" class="section-card">
          <h2 class="text-xl font-bold text-slate-100 mb-4">Roles across career</h2>
          <p class="text-xs text-slate-500 mb-4">
            Titles counted once; a person can act and direct on the same film (roles merged).
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              v-for="row in roleStats"
              :key="row.key"
              class="rounded-xl bg-slate-900/70 ring-1 ring-slate-700/60 px-4 py-3"
            >
              <p class="text-2xl font-black text-indigo-200 tabular-nums">{{ row.count }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ row.label }}</p>
              <div class="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-indigo-500/80"
                  :style="{ width: row.pct + '%' }"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Critical vs commercial -->
        <section v-if="bundle" class="grid gap-6 lg:grid-cols-2">
          <div class="section-card">
            <h2 class="text-lg font-bold text-slate-100">Most critically rated</h2>
            <p class="text-xs text-slate-500 mt-1 mb-4">
              Highest TMDB score (min {{ minVotesCritical }} votes)
            </p>
            <ul class="space-y-2 list-none p-0 m-0">
              <li
                v-for="(t, i) in bundle.criticallyAcclaimed.slice(0, 8)"
                :key="'c-' + t.key"
              >
                <NuxtLink
                  :to="titleHref(t)"
                  class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-900/80 transition-colors"
                >
                  <span class="text-xs font-bold text-slate-500 w-5">{{ i + 1 }}</span>
                  <img
                    v-if="t.poster_path"
                    :src="imageUrl(t.poster_path, 'w185')"
                    alt=""
                    class="w-10 h-14 object-cover rounded bg-slate-900 shrink-0"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-slate-100 truncate">{{ t.title }}</p>
                    <p class="text-xs text-slate-500">
                      {{ t.year || '—' }} · {{ t.media_type }}
                      <span v-if="t.roles[0]"> · {{ t.roles[0].label }}</span>
                    </p>
                  </div>
                  <span class="text-sm font-bold text-amber-200/90 shrink-0">
                    ★ {{ t.vote_average.toFixed(1) }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
            <p v-if="!bundle.criticallyAcclaimed.length" class="text-sm text-slate-500">
              Not enough vote data yet.
            </p>
          </div>

          <div class="section-card">
            <h2 class="text-lg font-bold text-slate-100">Most commercially successful</h2>
            <p class="text-xs text-slate-500 mt-1 mb-4">
              Highest TMDB vote count (attention / reach proxy; not box office)
            </p>
            <ul class="space-y-2 list-none p-0 m-0">
              <li
                v-for="(t, i) in bundle.commerciallySuccessful.slice(0, 8)"
                :key="'m-' + t.key"
              >
                <NuxtLink
                  :to="titleHref(t)"
                  class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-900/80 transition-colors"
                >
                  <span class="text-xs font-bold text-slate-500 w-5">{{ i + 1 }}</span>
                  <img
                    v-if="t.poster_path"
                    :src="imageUrl(t.poster_path, 'w185')"
                    alt=""
                    class="w-10 h-14 object-cover rounded bg-slate-900 shrink-0"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-slate-100 truncate">{{ t.title }}</p>
                    <p class="text-xs text-slate-500">
                      {{ t.year || '—' }} · {{ t.media_type }}
                    </p>
                  </div>
                  <span class="text-xs font-semibold text-slate-400 shrink-0 tabular-nums">
                    {{ t.vote_count.toLocaleString() }} votes
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </section>

        <!-- Career timeline -->
        <section v-if="yearGroups.length" class="section-card">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 class="text-xl font-bold text-slate-100">Career timeline</h2>
              <p class="text-xs text-slate-500 mt-1">By release / first air year · movie &amp; TV merged</p>
            </div>
            <div class="flex rounded-lg overflow-hidden border border-slate-600 text-sm">
              <button
                type="button"
                class="px-3 py-1.5 transition-colors"
                :class="viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                @click="viewMode = 'timeline'"
              >
                Timeline
              </button>
              <button
                type="button"
                class="px-3 py-1.5 transition-colors"
                :class="viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                @click="viewMode = 'grid'"
              >
                Grid
              </button>
              <button
                type="button"
                class="px-3 py-1.5 transition-colors"
                :class="viewMode === 'graph' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                @click="viewMode = 'graph'"
              >
                Orbit
              </button>
            </div>
          </div>

          <div v-if="viewMode === 'timeline'" class="space-y-8">
            <div
              v-for="group in yearGroups"
              :key="group.year ?? 'u'"
              class="relative pl-6 border-l border-slate-700"
            >
              <span class="absolute -left-2 top-0 h-4 w-4 rounded-full bg-indigo-500 ring-4 ring-slate-800" />
              <h3 class="text-lg font-bold text-indigo-200 mb-3">
                {{ group.year ?? 'Undated' }}
                <span class="text-xs font-normal text-slate-500 ml-2">{{ group.items.length }} title(s)</span>
              </h3>
              <ul class="space-y-2 list-none p-0 m-0">
                <li
                  v-for="t in group.items"
                  :key="t.key"
                >
                  <NuxtLink
                    :to="titleHref(t)"
                    class="flex gap-3 items-start rounded-lg hover:bg-slate-900/60 p-2 -ml-2 transition-colors"
                  >
                    <img
                      v-if="t.poster_path"
                      :src="imageUrl(t.poster_path, 'w185')"
                      alt=""
                      class="w-12 h-[4.5rem] object-cover rounded bg-slate-900 shrink-0"
                      loading="lazy"
                    />
                    <div class="min-w-0">
                      <p class="font-semibold text-slate-100">{{ t.title }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        <span class="uppercase">{{ t.media_type }}</span>
                        · {{ t.roles.map((r) => r.label).join(', ') }}
                        <span v-if="t.vote_average"> · ★ {{ t.vote_average.toFixed(1) }}</span>
                      </p>
                    </div>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>

          <div v-else-if="viewMode === 'grid'">
            <div class="poster-grid-sm">
              <HomePosterCard
                v-for="t in popularGrid"
                :key="t.key"
                :item="creditAsMediaItem(t)"
                :media-type="t.media_type"
              />
            </div>
          </div>

          <div v-else>
            <ActorGraph
              :person-id="person.id"
              :max-projects="maxProjects"
              :top-cast-per-project="topCastPerProject"
              @select="onNodeSelect"
              @insights="onInsights"
            />
            <div
              v-if="selectedNode"
              class="mt-4 p-4 rounded-lg bg-slate-900/80 border border-slate-700 flex flex-wrap gap-4 items-start"
            >
              <img
                v-if="selectedNode.image"
                :src="nodeImage(selectedNode)"
                :alt="selectedNode.label"
                class="w-16 h-16 rounded-lg object-cover bg-slate-800"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs uppercase tracking-wide text-slate-500 mb-0.5">
                  {{ nodeTypeLabel(selectedNode) }}
                </p>
                <h4 class="text-lg font-bold text-slate-100">{{ selectedNode.label }}</h4>
                <p v-if="selectedNode.year" class="text-sm text-slate-400">
                  {{ selectedNode.year }}
                  <span v-if="selectedNode.character"> · as {{ selectedNode.character }}</span>
                </p>
              </div>
              <NuxtLink
                v-if="selectedNode.type === 'project'"
                :to="projectLink(selectedNode)"
                class="btn-secondary"
              >
                Open {{ selectedNode.mediaType === 'tv' ? 'show' : 'movie' }}
              </NuxtLink>
              <NuxtLink
                v-else-if="selectedNode.type !== 'actor'"
                :to="'/actor/' + selectedNode.tmdbId"
                class="btn-secondary"
              >
                Open person
              </NuxtLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  aggregatePersonCredits,
  groupCreditsByYear,
} from '~/utils/personCredits'

const route = useRoute()
const {
  getPerson,
  getPersonCombinedCredits,
  getPersonExternalIds,
  getPersonImages,
  backdropStyle,
  imageUrl,
  birthplaceMapUrl,
  personExternalLinks,
} = useTmdb()

const id = computed(() => String(route.params.pid))
const viewMode = ref('timeline')
const bioExpanded = ref(false)
const selectedNode = ref(null)
const insights = ref(null)
const maxProjects = 24
const topCastPerProject = 8
const minVotesCritical = 100

const {
  data: person,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  () => `person-${id.value}`,
  () => getPerson(id.value),
  { watch: [id] },
)

const {
  data: extras,
  pending: extrasPending,
} = useLazyAsyncData(
  () => `person-extras-${id.value}`,
  async () => {
    const pid = id.value
    const [credits, external, images] = await Promise.all([
      getPersonCombinedCredits(pid).catch(() => ({ cast: [], crew: [] })),
      getPersonExternalIds(pid).catch(() => ({})),
      getPersonImages(pid).catch(() => ({ profiles: [] })),
    ])
    return { credits, external, images }
  },
  { watch: [id] },
)

const bundle = computed(() => {
  if (!extras.value?.credits) return null
  return aggregatePersonCredits(extras.value.credits, {
    minVotesForCritical: minVotesCritical,
  })
})

const yearGroups = computed(() =>
  bundle.value ? groupCreditsByYear(bundle.value.timeline) : [],
)

const popularGrid = computed(() => {
  if (!bundle.value) return []
  return bundle.value.titles
    .slice()
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 24)
})

const roleStats = computed(() => {
  const b = bundle.value?.breakdown
  if (!b || !b.totalTitles) return []
  const total = b.totalTitles
  const rows = [
    { key: 'acting', label: 'Acting credits', count: b.acting },
    { key: 'directing', label: 'Directing', count: b.directing },
    { key: 'writing', label: 'Writing', count: b.writing },
    { key: 'other_crew', label: 'Other crew', count: b.other_crew },
  ]
  return rows.map((r) => ({
    ...r,
    pct: Math.round((r.count / total) * 100),
  }))
})

const externalLinks = computed(() =>
  personExternalLinks(extras.value?.external, person.value?.homepage),
)

const taggedProfiles = computed(() => extras.value?.images?.profiles || [])

const profileUrl = computed(() =>
  imageUrl(person.value?.profile_path, 'w500'),
)

const mapSearchUrl = computed(() =>
  birthplaceMapUrl(person.value?.place_of_birth),
)

/** Birthplace map embed (query geocode in embed; OSM link is the open alternative). */
const mapEmbedSrc = computed(() => {
  const place = person.value?.place_of_birth
  if (!place) return ''
  return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=6&output=embed`
})

const ageLine = computed(() => {
  const p = person.value
  if (!p?.birthday) return ''
  const born = p.birthday
  if (p.deathday) {
    return `${formatDate(born)} – ${formatDate(p.deathday)}`
  }
  const age = calcAge(born)
  return age != null ? `Born ${formatDate(born)} · ${age} years` : `Born ${formatDate(born)}`
})

const backdropImgPath = computed(() => {
  const fromCredits = bundle.value?.commerciallySuccessful?.find((t) => t.backdrop_path)
    || bundle.value?.titles?.find((t) => t.backdrop_path)
  if (fromCredits?.backdrop_path) return backdropStyle(fromCredits.backdrop_path)
  return { backgroundImage: '' }
})

const errorMsg = computed(() => {
  const e = error.value
  if (!e) return null
  return e.statusMessage || e.message || 'Unknown error'
})

useHead(() => ({
  title: person.value?.name ? `${person.value.name} — Orbitra` : 'Person — Orbitra',
}))

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

function calcAge(birthday) {
  try {
    const b = new Date(birthday + 'T12:00:00')
    const now = new Date()
    let age = now.getFullYear() - b.getFullYear()
    const m = now.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1
    return age >= 0 && age < 130 ? age : null
  } catch {
    return null
  }
}

function titleHref(t) {
  return t.media_type === 'tv' ? `/tv/${t.id}` : `/m/${t.id}`
}

function creditAsMediaItem(t) {
  return {
    id: t.id,
    media_type: t.media_type,
    title: t.media_type === 'movie' ? t.title : undefined,
    name: t.media_type === 'tv' ? t.title : undefined,
    poster_path: t.poster_path,
    vote_average: t.vote_average,
    vote_count: t.vote_count,
  }
}

function onNodeSelect(node) {
  selectedNode.value = node
}
function onInsights(val) {
  insights.value = val
}
function nodeTypeLabel(n) {
  if (!n) return ''
  if (n.type === 'actor') return 'Person (center)'
  if (n.type === 'project') return n.mediaType === 'tv' ? 'TV show' : 'Movie'
  if (n.type === 'repeat') return 'Repeat collaborator'
  return 'Co-star'
}
function nodeImage(n) {
  if (!n?.image) return ''
  return imageUrl(n.image, 'w185')
}
function projectLink(n) {
  return n.mediaType === 'tv' ? `/tv/${n.tmdbId}` : `/m/${n.tmdbId}`
}
</script>

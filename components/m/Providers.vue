<template>
  <div v-if="hasAnyRegion" class="watch-providers">
    <div class="flex flex-wrap items-center gap-3 mb-3">
      <label class="text-sm text-slate-400 shrink-0" for="watch-region-select">
        Country
      </label>
      <select
        id="watch-region-select"
        class="select-field text-sm min-w-[10rem]"
        :value="activeRegion"
        @change="onRegionChange"
      >
        <option
          v-for="code in availableRegions"
          :key="code"
          :value="code"
        >
          {{ regionLabel(code) }}
        </option>
      </select>
    </div>

    <p class="text-xs text-slate-500 mb-4 leading-relaxed">
      Logos show where this title is listed (stream, rent, or buy). TMDB does not provide direct links into Netflix or other apps — use the button below to open TMDB’s watch page (JustWatch data) for this country.
    </p>

    <div v-if="!regionData" class="text-sm text-slate-500 py-2">
      No streaming, rental, or purchase options listed for {{ regionLabel(activeRegion) }}.
    </div>

    <template v-else>
      <a
        v-if="watchPageUrl"
        :href="watchPageUrl"
        target="_blank"
        rel="noopener nofollow"
        class="btn-secondary inline-flex mb-5 text-sm"
      >
        Open watch options on TMDB
        <span class="sr-only"> (opens in a new tab; powered by JustWatch)</span>
      </a>

      <div
        v-for="group in providerGroups"
        :key="group.id"
        class="mb-4 last:mb-0 rounded-xl bg-slate-950/50 ring-1 ring-slate-800/80 p-3"
      >
        <div class="flex items-baseline gap-2 mb-2.5">
          <span
            class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            :class="group.badgeClass"
          >{{ group.label }}</span>
          <span class="text-xs text-slate-500">{{ group.hint }}</span>
        </div>
        <ul class="flex flex-wrap gap-3 list-none p-0 m-0" :aria-label="group.ariaLabel">
          <li
            v-for="p in group.items"
            :key="group.id + '-' + p.provider_id"
            class="flex flex-col items-center gap-1 w-16"
            :title="availabilityTitle(p.provider_name, group.kind)"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              :alt="p.provider_name"
              class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700"
              loading="lazy"
            />
            <span
              v-else
              class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] text-center text-slate-300 px-0.5"
            >{{ p.provider_name }}</span>
            <span class="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight">{{ p.provider_name }}</span>
          </li>
        </ul>
      </div>

      <p
        v-if="!providerGroups.length"
        class="text-sm text-slate-500 py-2"
      >
        No outlets for this title in {{ regionLabel(activeRegion) }}.
      </p>
    </template>

    <p class="text-xs text-slate-600 mt-4 leading-relaxed">
      Availability via TMDB / JustWatch. The button opens TMDB’s watch page for this title — not the streaming app itself.
    </p>
  </div>
  <p v-else class="text-sm text-slate-500">No watch providers available.</p>
</template>

<script setup lang="ts">
import { COUNTRY_NAMES, WATCH_REGION_OPTIONS } from '~/composables/useWatchRegion'

const props = defineProps({
  /** TMDB `/watch/providers` payload */
  providers: {
    type: Object,
    default: null,
  },
})

const { imageUrl } = useTmdb()
const { watchRegion, setWatchRegion } = useWatchRegion()

const resultsMap = computed(() => props.providers?.results || {})

const hasAnyRegion = computed(() => Object.keys(resultsMap.value).length > 0)

const availableRegions = computed(() => {
  const keys = Object.keys(resultsMap.value).sort()
  const preferred = watchRegion.value
  if (!keys.length) return []
  const ordered = []
  if (keys.includes(preferred)) ordered.push(preferred)
  for (const o of WATCH_REGION_OPTIONS) {
    if (keys.includes(o.code) && !ordered.includes(o.code)) ordered.push(o.code)
  }
  for (const k of keys) {
    if (!ordered.includes(k)) ordered.push(k)
  }
  return ordered
})

const activeRegion = computed(() => {
  const keys = availableRegions.value
  if (!keys.length) return watchRegion.value
  if (keys.includes(watchRegion.value)) return watchRegion.value
  return keys[0]
})

const regionData = computed(() => resultsMap.value[activeRegion.value] || null)

const watchPageUrl = computed(() => {
  const link = regionData.value?.link
  return link && String(link).trim() ? String(link).trim() : ''
})

function sortProviders(list) {
  if (!Array.isArray(list)) return []
  return list.slice().sort((a, b) => {
    const pa = a.display_priority ?? 999
    const pb = b.display_priority ?? 999
    if (pa !== pb) return pa - pb
    return String(a.provider_name || '').localeCompare(String(b.provider_name || ''))
  })
}

const streamList = computed(() => sortProviders(regionData.value?.flatrate))
const freeList = computed(() =>
  sortProviders([...(regionData.value?.free || []), ...(regionData.value?.ads || [])]),
)
const rentList = computed(() => sortProviders(regionData.value?.rent))
const buyList = computed(() => sortProviders(regionData.value?.buy))

/** Stream → free → rent → buy — clear monetization grouping for the UI. */
const providerGroups = computed(() => {
  const groups = [
    {
      id: 'stream',
      kind: 'stream',
      label: 'Stream',
      hint: 'Included with subscription',
      ariaLabel: 'Streaming services',
      badgeClass: 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30',
      items: streamList.value,
    },
    {
      id: 'free',
      kind: 'free',
      label: 'Free',
      hint: 'Ad-supported or free tier',
      ariaLabel: 'Free services',
      badgeClass: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30',
      items: freeList.value,
    },
    {
      id: 'rent',
      kind: 'rent',
      label: 'Rent',
      hint: 'Transactional rental',
      ariaLabel: 'Rental services',
      badgeClass: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30',
      items: rentList.value,
    },
    {
      id: 'buy',
      kind: 'buy',
      label: 'Buy',
      hint: 'Digital purchase',
      ariaLabel: 'Purchase services',
      badgeClass: 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30',
      items: buyList.value,
    },
  ]
  return groups.filter(g => g.items.length > 0)
})

function regionLabel(code) {
  return COUNTRY_NAMES[code] || code
}

function logoSrc(path) {
  return imageUrl(path, 'w185')
}

function availabilityTitle(name, kind) {
  const verb
    = kind === 'stream'
      ? 'Listed for streaming on'
      : kind === 'free'
        ? 'Listed as free on'
        : kind === 'rent'
          ? 'Listed for rent on'
          : 'Listed for purchase on'
  return `${verb} ${name} (open TMDB watch page for links)`
}

function onRegionChange(ev) {
  const code = ev?.target?.value
  if (code) setWatchRegion(code)
}
</script>

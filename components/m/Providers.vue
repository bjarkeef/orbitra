<template>
  <div v-if="hasAnyRegion" class="watch-providers">
    <div class="flex flex-wrap items-center gap-3 mb-4">
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

    <div v-if="!regionData" class="text-sm text-slate-500 py-2">
      No streaming, rental, or purchase options listed for {{ regionLabel(activeRegion) }}.
    </div>

    <template v-else>
      <div v-if="streamList.length" class="mb-4">
        <div class="flex items-baseline gap-2 mb-2">
          <h4 class="text-sm font-semibold text-slate-200">Stream</h4>
          <span class="text-xs text-slate-500">Included with subscription</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="p in streamList"
            :key="'s-' + p.provider_id"
            :href="regionData.link || '#'"
            target="_blank"
            rel="noopener nofollow"
            class="group flex flex-col items-center gap-1 w-16"
            :title="p.provider_name"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              :alt="p.provider_name"
              class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 group-hover:scale-105 transition-all"
              loading="lazy"
            />
            <span
              v-else
              class="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] text-center text-slate-300 px-0.5"
            >{{ p.provider_name }}</span>
            <span class="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight">{{ p.provider_name }}</span>
          </a>
        </div>
      </div>

      <div v-if="freeList.length" class="mb-4">
        <div class="flex items-baseline gap-2 mb-2">
          <h4 class="text-sm font-semibold text-slate-200">Free</h4>
          <span class="text-xs text-slate-500">Ad-supported or free tier</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="p in freeList"
            :key="'f-' + p.provider_id"
            :href="regionData.link || '#'"
            target="_blank"
            rel="noopener nofollow"
            class="group flex flex-col items-center gap-1 w-16"
            :title="p.provider_name"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              :alt="p.provider_name"
              class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 group-hover:scale-105 transition-all"
              loading="lazy"
            />
            <span class="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight">{{ p.provider_name }}</span>
          </a>
        </div>
      </div>

      <div v-if="rentList.length" class="mb-4">
        <h4 class="text-sm font-semibold text-slate-200 mb-2">Rent</h4>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="p in rentList"
            :key="'r-' + p.provider_id"
            :href="regionData.link || '#'"
            target="_blank"
            rel="noopener nofollow"
            class="group flex flex-col items-center gap-1 w-16"
            :title="p.provider_name"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              :alt="p.provider_name"
              class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 group-hover:scale-105 transition-all"
              loading="lazy"
            />
            <span class="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight">{{ p.provider_name }}</span>
          </a>
        </div>
      </div>

      <div v-if="buyList.length" class="mb-4">
        <h4 class="text-sm font-semibold text-slate-200 mb-2">Buy</h4>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="p in buyList"
            :key="'b-' + p.provider_id"
            :href="regionData.link || '#'"
            target="_blank"
            rel="noopener nofollow"
            class="group flex flex-col items-center gap-1 w-16"
            :title="p.provider_name"
          >
            <img
              v-if="p.logo_path"
              :src="logoSrc(p.logo_path)"
              :alt="p.provider_name"
              class="w-12 h-12 rounded-lg object-cover ring-1 ring-slate-700 group-hover:ring-indigo-400 group-hover:scale-105 transition-all"
              loading="lazy"
            />
            <span class="text-[10px] text-slate-400 text-center line-clamp-2 leading-tight">{{ p.provider_name }}</span>
          </a>
        </div>
      </div>

      <p
        v-if="!streamList.length && !freeList.length && !rentList.length && !buyList.length"
        class="text-sm text-slate-500 py-2"
      >
        No outlets for this title in {{ regionLabel(activeRegion) }}.
      </p>
    </template>

    <p class="text-xs text-slate-600 mt-4">
      Availability data by JustWatch. Links open JustWatch for this title.
    </p>
  </div>
  <p v-else class="text-sm text-slate-500">No watch providers available.</p>
</template>

<script setup>
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

function regionLabel(code) {
  return COUNTRY_NAMES[code] || code
}

function logoSrc(path) {
  return imageUrl(path, 'w185')
}

function onRegionChange(ev) {
  const code = ev?.target?.value
  if (code) setWatchRegion(code)
}
</script>
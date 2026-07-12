<template>
  <section v-if="paths.length" class="section-card">
    <div class="flex flex-wrap items-end justify-between gap-2 mb-4">
      <div>
        <h2 class="text-xl font-bold text-slate-100">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <p class="text-xs text-slate-500 tabular-nums">
        {{ paths.length }} image{{ paths.length === 1 ? '' : 's' }}
      </p>
    </div>
    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar -mx-1 px-1">
      <button
        v-for="(path, i) in paths"
        :key="path + i"
        type="button"
        class="shrink-0 rounded-lg overflow-hidden ring-1 ring-slate-700/60 bg-slate-950
          hover:ring-indigo-400/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
          cursor-zoom-in"
        :class="thumbClass"
        :aria-label="`View image ${i + 1} of ${paths.length}`"
        @click="openAt(i)"
      >
        <NuxtImg
          :src="thumbUrl(path)"
          alt=""
          width="500"
          height="750"
          class="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          format="webp"
          densities="1x 2x"
        />
      </button>
    </div>

    <!-- Lightbox modal -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[110] flex flex-col bg-black/92 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @keydown="onKeydown"
      >
        <div class="flex items-center justify-between gap-3 px-4 py-3 shrink-0 border-b border-white/10">
          <p class="text-sm text-slate-300 tabular-nums">
            {{ activeIndex + 1 }} / {{ paths.length }}
          </p>
          <div class="flex items-center gap-2">
            <a
              v-if="activeFullUrl"
              :href="activeFullUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/10"
            >
              Open original ↗
            </a>
            <button
              type="button"
              class="rounded-full w-9 h-9 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white text-lg"
              aria-label="Close gallery"
              @click="close"
            >
              ×
            </button>
          </div>
        </div>

        <div class="flex-1 flex items-center justify-center min-h-0 relative px-2 sm:px-12 py-4">
          <button
            v-if="paths.length > 1"
            type="button"
            class="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl"
            aria-label="Previous image"
            @click="prev"
          >
            ‹
          </button>
          <NuxtImg
            :src="activeDisplayUrl"
            alt=""
            width="1280"
            height="720"
            class="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
            draggable="false"
            format="webp"
            quality="90"
            loading="eager"
          />
          <button
            v-if="paths.length > 1"
            type="button"
            class="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl"
            aria-label="Next image"
            @click="next"
          >
            ›
          </button>
        </div>

        <!-- Filmstrip -->
        <div
          v-if="paths.length > 1"
          class="shrink-0 flex gap-1.5 overflow-x-auto px-4 py-3 border-t border-white/10 scrollbar justify-center sm:justify-start"
        >
          <button
            v-for="(path, i) in paths"
            :key="'strip-' + path + i"
            type="button"
            class="shrink-0 w-14 h-10 sm:w-16 sm:h-11 rounded-md overflow-hidden ring-2 transition-colors"
            :class="i === activeIndex ? 'ring-indigo-400' : 'ring-transparent opacity-60 hover:opacity-100'"
            :aria-label="`Go to image ${i + 1}`"
            :aria-current="i === activeIndex ? 'true' : undefined"
            @click="activeIndex = i"
          >
            <NuxtImg
              :src="thumbUrl(path)"
              alt=""
              width="128"
              height="80"
              class="w-full h-full object-cover"
              format="webp"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import type { TmdbImageAsset, TmdbMediaImages, TmdbPersonImages } from '~/composables/useTmdb'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    images?: TmdbMediaImages | TmdbPersonImages | null
    prefer?: 'backdrops' | 'posters' | 'profiles' | 'auto'
    max?: number
    aspect?: 'video' | 'poster' | 'square'
  }>(),
  {
    title: 'Gallery',
    subtitle: 'From TMDB · click to enlarge',
    images: null,
    prefer: 'auto',
    max: 16,
    aspect: 'video',
  },
)

const { imageUrl } = useTmdb()

const open = ref(false)
const activeIndex = ref(0)

function assetsOf(kind: 'backdrops' | 'posters' | 'profiles'): TmdbImageAsset[] {
  const img = props.images as Record<string, TmdbImageAsset[] | undefined> | null
  if (!img) return []
  const list = img[kind] || []
  return list
    .filter(a => a?.file_path)
    .slice()
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
}

const paths = computed(() => {
  const prefer = props.prefer
  let list: TmdbImageAsset[] = []
  if (prefer === 'profiles') list = assetsOf('profiles')
  else if (prefer === 'posters') list = assetsOf('posters')
  else if (prefer === 'backdrops') list = assetsOf('backdrops')
  else {
    list = assetsOf('backdrops')
    if (list.length < 4) list = [...list, ...assetsOf('posters')]
    if (!list.length) list = assetsOf('profiles')
  }
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of list) {
    if (seen.has(a.file_path)) continue
    seen.add(a.file_path)
    out.push(a.file_path)
    if (out.length >= props.max) break
  }
  return out
})

const thumbClass = computed(() => {
  if (props.aspect === 'poster') return 'w-24 sm:w-28 aspect-[2/3]'
  if (props.aspect === 'square') return 'w-24 sm:w-28 aspect-square'
  return 'w-40 sm:w-48 aspect-video'
})

const activePath = computed(() => paths.value[activeIndex.value] || '')
const activeDisplayUrl = computed(() => {
  const p = activePath.value
  if (!p) return ''
  return imageUrl(p, 'w780') || imageUrl(p, 'w500') || imageUrl(p, 'original') || ''
})
const activeFullUrl = computed(() => {
  const p = activePath.value
  if (!p) return ''
  return imageUrl(p, 'original') || imageUrl(p, 'w780') || ''
})

function thumbUrl(path: string) {
  if (props.aspect === 'poster' || props.aspect === 'square') {
    return imageUrl(path, 'w185') || imageUrl(path, 'w500')
  }
  return imageUrl(path, 'w500') || imageUrl(path, 'w780')
}

function openAt(i: number) {
  activeIndex.value = i
  open.value = true
}

function close() {
  open.value = false
}

function prev() {
  const n = paths.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value - 1 + n) % n
}

function next() {
  const n = paths.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + 1) % n
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
  else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    next()
  }
}

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) {
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeydown)
  }
  else {
    document.documentElement.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

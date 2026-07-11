<template>
  <div class="page-shell pb-16">
    <header class="mb-10 max-w-2xl">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/90">Signature feature</p>
      <h1 class="mt-2 text-3xl sm:text-4xl font-black text-white tracking-tight">
        Map the orbits of film &amp; TV
      </h1>
      <p class="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
        Pick a person and explore their co-star constellation — built on the server, rendered as a living graph.
        No API keys in the browser.
      </p>
    </header>

    <section class="section-card mb-10">
      <h2 class="text-lg font-bold text-slate-100 mb-3">Find someone to orbit</h2>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="q"
          type="search"
          placeholder="Search people (e.g. Nolan, Blanchett…)"
          class="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          @keydown.enter.prevent="runSearch"
        />
        <button type="button" class="btn-primary" :disabled="searching" @click="runSearch">
          {{ searching ? 'Searching…' : 'Search' }}
        </button>
      </div>
      <ul v-if="results.length" class="mt-4 grid sm:grid-cols-2 gap-2 list-none p-0 m-0">
        <li v-for="p in results" :key="p.id">
          <NuxtLink
            :to="'/orbit/' + p.id"
            class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-900/80 ring-1 ring-transparent hover:ring-slate-700 transition-colors"
          >
            <img
              v-if="p.profile_path"
              :src="imageUrl(p.profile_path, 'w185')"
              alt=""
              class="w-12 h-12 rounded-full object-cover bg-slate-800"
              loading="lazy"
            />
            <span
              v-else
              class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs"
            >?</span>
            <div class="min-w-0">
              <p class="font-semibold text-slate-100 truncate">{{ p.name }}</p>
              <p class="text-xs text-slate-500 truncate">
                {{ p.known_for_department || 'Person' }}
                <span v-if="knownFor(p)"> · {{ knownFor(p) }}</span>
              </p>
            </div>
          </NuxtLink>
        </li>
      </ul>
      <p v-else-if="searched && !searching" class="mt-4 text-sm text-slate-500">No people matched.</p>
    </section>

    <section>
      <h2 class="text-lg font-bold text-slate-100 mb-4">Featured orbits</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="f in featured"
          :key="f.id"
          :to="'/orbit/' + f.id"
          class="section-card !p-4 hover:ring-indigo-400/40 transition-shadow group"
        >
          <p class="text-xs uppercase tracking-wide text-slate-500">{{ f.blurb }}</p>
          <p class="mt-1 text-xl font-black text-white group-hover:text-indigo-100">{{ f.name }}</p>
          <p class="mt-2 text-sm text-indigo-300">Open orbit →</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { searchMulti, imageUrl } = useTmdb()

const q = ref('')
const results = ref<any[]>([])
const searching = ref(false)
const searched = ref(false)

const featured = [
  { id: 6193, name: 'Leonardo DiCaprio', blurb: 'Repeat collaborators & prestige titles' },
  { id: 1245, name: 'Scarlett Johansson', blurb: 'Blockbusters meet indie orbits' },
  { id: 525, name: 'Christopher Nolan', blurb: 'Crew-adjacent casts across eras' },
  { id: 1892, name: 'Matt Damon', blurb: 'Ensemble webs & franchises' },
  { id: 5064, name: 'Meryl Streep', blurb: 'Decades of co-star density' },
  { id: 287, name: 'Brad Pitt', blurb: 'High-visibility collab graph' },
]

async function runSearch() {
  const query = q.value.trim()
  if (query.length < 2) return
  searching.value = true
  searched.value = true
  try {
    const res = await searchMulti(query, { page: 1 })
    results.value = (res.results || []).filter((r: any) => r.media_type === 'person').slice(0, 12)
  }
  catch {
    results.value = []
  }
  finally {
    searching.value = false
  }
}

function knownFor(p: any) {
  const k = p.known_for
  if (!Array.isArray(k) || !k.length) return ''
  return k
    .slice(0, 2)
    .map((x: any) => x.title || x.name)
    .filter(Boolean)
    .join(', ')
}

useSeoMeta({
  title: 'Orbit explorer — Orbitra',
  description: 'Explore co-star collaboration orbits for film and TV people. Server-built graphs, no client API keys.',
})
</script>

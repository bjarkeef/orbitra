<template>
  <div
    v-if="nodes.length"
    class="rounded-xl bg-slate-900/80 ring-1 ring-slate-700/70 p-3 sm:p-4"
  >
    <div class="flex items-center justify-between gap-2 mb-2">
      <h3 class="text-xs font-bold uppercase tracking-wide text-slate-400">Orbit list</h3>
      <p class="text-[10px] text-slate-600">Keyboard-friendly companion</p>
    </div>
    <ul
      ref="listEl"
      class="max-h-48 sm:max-h-64 overflow-y-auto space-y-0.5 list-none p-0 m-0"
      role="listbox"
      :aria-label="'Orbit nodes'"
      @keydown="onKey"
    >
      <li
        v-for="n in sorted"
        :key="n.id"
        role="option"
        :aria-selected="n.id === selectedId"
        tabindex="0"
        class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left cursor-pointer transition-colors"
        :class="n.id === selectedId
          ? 'bg-indigo-500/20 ring-1 ring-indigo-400/40'
          : 'hover:bg-slate-800/80'"
        @click="$emit('select', n)"
        @keydown.enter.prevent="$emit('select', n)"
      >
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :class="dotClass(n.type)"
          aria-hidden="true"
        />
        <span class="text-sm text-slate-200 truncate flex-1">{{ n.label }}</span>
        <span class="text-[10px] uppercase text-slate-500 shrink-0">{{ typeShort(n) }}</span>
        <span v-if="n.collabCount && n.collabCount >= 2" class="text-[10px] font-bold text-rose-300 tabular-nums">
          ×{{ n.collabCount }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { GraphNode } from '~/utils/orbitTypes'

const props = defineProps<{
  nodes: GraphNode[]
  selectedId?: string | null
}>()

defineEmits<{
  select: [node: GraphNode]
}>()

const sorted = computed(() => {
  const order: Record<string, number> = { actor: 0, project: 1, repeat: 2, costar: 3 }
  return props.nodes.slice().sort((a, b) => {
    const d = (order[a.type] ?? 9) - (order[b.type] ?? 9)
    if (d) return d
    if ((b.collabCount || 0) !== (a.collabCount || 0)) {
      return (b.collabCount || 0) - (a.collabCount || 0)
    }
    return a.label.localeCompare(b.label)
  })
})

function typeShort(n: GraphNode) {
  if (n.type === 'actor') return 'center'
  if (n.type === 'project') return n.mediaType === 'tv' ? 'tv' : 'movie'
  if (n.type === 'repeat') return 'repeat'
  return 'co-star'
}

function dotClass(type: string) {
  if (type === 'actor') return 'bg-indigo-500'
  if (type === 'project') return 'bg-amber-500'
  if (type === 'repeat') return 'bg-rose-400'
  return 'bg-emerald-500'
}

function onKey(e: KeyboardEvent) {
  // focus moves naturally via tabindex; Enter handled per-item
  if (e.key === 'Escape') {
    (e.target as HTMLElement)?.blur?.()
  }
}
</script>

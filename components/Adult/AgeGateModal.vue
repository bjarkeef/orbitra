<template>
  <Teleport to="body">
    <div
      v-if="gateOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        class="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
        @click="onBackdrop"
      />
      <div
        ref="dialogEl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        tabindex="-1"
        class="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 outline-none ring-1 ring-indigo-500/20"
        @keydown="onKeydown"
      >
        <h2 id="age-gate-title" class="text-xl font-black text-slate-100 tracking-tight">
          Age confirmation
        </h2>
        <p id="age-gate-desc" class="mt-3 text-sm text-slate-300 leading-relaxed">
          Adult titles are marked on TMDB and may include explicit sexual content.
          You must be 18 or older to enable this on Orbitra. Your choice is stored in a
          cookie for 30 days so it works with server rendering.
        </p>
        <div class="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            ref="declineBtn"
            type="button"
            class="btn-secondary !bg-slate-800 hover:!bg-slate-700"
            @click="declineAgeGate"
          >
            I am under 18 — go home
          </button>
          <button
            ref="confirmBtn"
            type="button"
            class="btn-primary"
            @click="confirmAgeGate"
          >
            I am 18 or older
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const {
  gateOpen,
  confirmAgeGate,
  declineAgeGate,
} = useAdultContent()

const dialogEl = ref(null)
const confirmBtn = ref(null)
const declineBtn = ref(null)
let previouslyFocused = null

function focusables() {
  return [confirmBtn.value, declineBtn.value].filter(Boolean)
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    declineAgeGate()
    return
  }
  if (e.key !== 'Tab') return
  const nodes = focusables()
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function onBackdrop() {
  // Backdrop click declines — same as under-18 path for safety
  declineAgeGate()
}

watch(gateOpen, async (open) => {
  if (!import.meta.client) return
  if (open) {
    previouslyFocused = document.activeElement
    await nextTick()
    dialogEl.value?.focus()
    confirmBtn.value?.focus()
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = ''
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus()
    }
    previouslyFocused = null
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.documentElement.style.overflow = ''
})
</script>

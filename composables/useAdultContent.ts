/**
 * Adult-content preference + age-gate state (cookie-backed for SSR).
 *
 * Cookies (document-visible so client UI can read them; not HttpOnly):
 * - `orbitra_age_verified` — user confirmed 18+ (30-day max-age)
 * - `orbitra_adult_enabled` — include adult results when "1"
 *
 * Preference is sent to the Nitro proxy as `X-Orbitra-Include-Adult: 1`
 * (see useTmdb) — never as a query param that would leak into shared caches.
 */

export const AGE_VERIFIED_COOKIE = 'orbitra_age_verified'
export const ADULT_ENABLED_COOKIE = 'orbitra_adult_enabled'
/** Request header the client sets when adult is enabled; proxy only trusts this. */
export const ADULT_INCLUDE_HEADER = 'x-orbitra-include-adult'

const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60 // 30 days

function cookieOpts() {
  return {
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  }
}

/**
 * Reactive adult preference and age-gate controls.
 * Safe on SSR: cookies hydrate from the request; modal only opens on client when needed.
 */
export function useAdultContent() {
  const ageVerified = useCookie<string | null>(AGE_VERIFIED_COOKIE, {
    ...cookieOpts(),
    default: () => null,
  })
  const adultEnabled = useCookie<string | null>(ADULT_ENABLED_COOKIE, {
    ...cookieOpts(),
    default: () => null,
  })

  const isAgeVerified = computed(() => ageVerified.value === '1')

  const isAdultEnabled = computed(
    () => isAgeVerified.value && adultEnabled.value === '1',
  )

  const gateOpen = useState<boolean>('orbitra-age-gate-open', () => false)
  const gateDeclineTo = useState<string>('orbitra-age-gate-decline-to', () => '/')
  const gateOnConfirm = useState<(() => void) | null>('orbitra-age-gate-on-confirm', () => null)

  function openAgeGate(options?: { declineTo?: string; onConfirm?: () => void }) {
    gateDeclineTo.value = options?.declineTo ?? '/'
    gateOnConfirm.value = options?.onConfirm ?? null
    gateOpen.value = true
  }

  function closeAgeGate() {
    gateOpen.value = false
    gateOnConfirm.value = null
  }

  function confirmAgeGate() {
    ageVerified.value = '1'
    const cb = gateOnConfirm.value
    closeAgeGate()
    if (typeof cb === 'function') cb()
  }

  function declineAgeGate() {
    ageVerified.value = null
    adultEnabled.value = null
    const to = gateDeclineTo.value || '/'
    closeAgeGate()
    navigateTo(to)
  }

  function clearTmdbCaches() {
    try {
      clearTmdbClientCache()
    } catch {
      /* ignore */
    }
  }

  function enableAdultContent(): boolean {
    if (!isAgeVerified.value) {
      openAgeGate({
        declineTo: '/',
        onConfirm: () => {
          adultEnabled.value = '1'
          clearTmdbCaches()
        },
      })
      return false
    }
    adultEnabled.value = '1'
    clearTmdbCaches()
    return true
  }

  function disableAdultContent() {
    adultEnabled.value = null
    clearTmdbCaches()
  }

  function setAdultEnabled(on: boolean) {
    if (on) enableAdultContent()
    else disableAdultContent()
  }

  function filterAdultResults<T extends { adult?: boolean }>(items: T[] | null | undefined): T[] {
    if (!items?.length) return []
    if (isAdultEnabled.value) return items
    return items.filter((item) => !item?.adult)
  }

  function filterAdultPaged<T extends { adult?: boolean }>(
    page: { results?: T[]; page?: number; total_pages?: number; total_results?: number } | null | undefined,
  ) {
    if (!page) return page
    return {
      ...page,
      results: filterAdultResults(page.results),
    }
  }

  return {
    ageVerified,
    adultEnabled,
    isAgeVerified,
    isAdultEnabled,
    gateOpen,
    gateDeclineTo,
    openAgeGate,
    closeAgeGate,
    confirmAgeGate,
    declineAgeGate,
    enableAdultContent,
    disableAdultContent,
    setAdultEnabled,
    filterAdultResults,
    filterAdultPaged,
    ADULT_INCLUDE_HEADER,
  }
}

/**
 * User's preferred JustWatch / TMDB watch region (ISO 3166-1 alpha-2).
 * Stored in a cookie so SSR and client share the same country for providers.
 *
 * @module composables/useWatchRegion
 */

/** Cookie max-age: 1 year. */
const REGION_MAX_AGE = 60 * 60 * 24 * 365

/** Fallback when locale cannot be inferred. */
export const DEFAULT_WATCH_REGION = 'US'

/** Common streaming markets (label for settings / country picker). */
export const WATCH_REGION_OPTIONS: Array<{ code: string, name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'PL', name: 'Poland' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'ZA', name: 'South Africa' },
]

/** Full ISO names for provider country dropdown (subset + common codes). */
export const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(
  WATCH_REGION_OPTIONS.map(o => [o.code, o.name]),
)

/**
 * Normalize to a 2-letter uppercase region code, or null if invalid.
 */
export function normalizeRegionCode(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(s)) return null
  return s
}

/**
 * Infer region from browser locale (e.g. en-GB ÔåÆ GB). Client-only.
 */
function inferRegionFromNavigator(): string | null {
  if (!import.meta.client || typeof navigator === 'undefined') return null
  const locales = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : []
  for (const loc of locales) {
    const parts = String(loc).split(/[-_]/)
    if (parts.length >= 2) {
      const code = normalizeRegionCode(parts[parts.length - 1])
      if (code) return code
    }
  }
  return null
}

/**
 * Composable for the user's watch country preference.
 */
export function useWatchRegion() {
  const regionCookie = useCookie<string | null>('orbitra_watch_region', {
    maxAge: REGION_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    default: () => null,
  })

  const watchRegion = computed({
    get(): string {
      const fromCookie = normalizeRegionCode(regionCookie.value)
      if (fromCookie) return fromCookie
      const inferred = inferRegionFromNavigator()
      return inferred || DEFAULT_WATCH_REGION
    },
    set(code: string) {
      const n = normalizeRegionCode(code)
      regionCookie.value = n || DEFAULT_WATCH_REGION
    },
  })

  /** True when the user has explicitly saved a region (cookie set). */
  const hasExplicitRegion = computed(() => !!normalizeRegionCode(regionCookie.value))

  function setWatchRegion(code: string) {
    const n = normalizeRegionCode(code)
    regionCookie.value = n || DEFAULT_WATCH_REGION
  }

  /** Display name for the active region. */
  const watchRegionLabel = computed(() => {
    const code = watchRegion.value
    return COUNTRY_NAMES[code] || code
  })

  return {
    watchRegion,
    watchRegionLabel,
    hasExplicitRegion,
    setWatchRegion,
    regionOptions: WATCH_REGION_OPTIONS,
    DEFAULT_WATCH_REGION,
  }
}

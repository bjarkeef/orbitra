/**
 * Non-blocking TMDB page payload helpers.
 * Prefer useLazyAsyncData so route changes paint the layout + skeleton immediately.
 */
export function usePageError(err: Ref<any> | ComputedRef<any>) {
  return computed(() => {
    const e = unref(err)
    if (!e) return null
    return e.statusMessage || e.message || 'Something went wrong'
  })
}

/** Stable async-data key that updates when the route param changes */
export function pageKey(prefix: string, id: string | number | Ref<string | number> | ComputedRef<string | number>) {
  return computed(() => `${prefix}-${unref(id)}`)
}

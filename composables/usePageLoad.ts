/**
 * Non-blocking page payload helpers for Orbitra detail / list routes.
 *
 * Prefer `useLazyAsyncData` so route changes paint the layout + skeleton immediately
 * while TMDB data loads in the background.
 *
 * @module usePageLoad
 */

import type { ComputedRef, Ref } from 'vue'

/**
 * Loose error shape accepted from Nuxt async data, `$fetch`, and H3 `createError`.
 * Only the fields we surface to users are required.
 */
export interface PageLoadErrorLike {
  statusMessage?: string
  statusCode?: number
  message?: string
  data?: { statusMessage?: string; message?: string }
}

/** Accepts a ref, computed, or plain value that may hold an error. */
export type MaybeRefOrGetterError =
  | Ref<PageLoadErrorLike | Error | null | undefined>
  | ComputedRef<PageLoadErrorLike | Error | null | undefined>
  | PageLoadErrorLike
  | Error
  | null
  | undefined

/** Route / entity id for building cache keys. */
export type PageKeyId = string | number

/** Ref or computed id, or a plain id value. */
export type MaybeRefPageId =
  | Ref<PageKeyId>
  | ComputedRef<PageKeyId>
  | PageKeyId

/**
 * Extract a user-facing error string from a Nuxt / H3 / Fetch error object.
 * Returns `null` when there is no error (so templates can use `v-if="errorMsg"`).
 *
 * Priority: `statusMessage` → nested `data.statusMessage` → `message` → fallback.
 *
 * @param err - Error from `useAsyncData` / `useLazyAsyncData` `.error` or a thrown value
 * @param fallback - Message when the error has no usable text
 * @returns Human-readable message, or `null` if `err` is falsy
 *
 * @example
 * ```ts
 * const { error } = useLazyAsyncData(...)
 * const errorMsg = usePageError(error)
 * ```
 */
export function usePageError(
  err: MaybeRefOrGetterError,
  fallback = 'Something went wrong',
): ComputedRef<string | null> {
  return computed((): string | null => {
    const e = unref(err as Ref<PageLoadErrorLike | Error | string | null | undefined>)
    if (e == null) return null

    if (typeof e === 'string') {
      const trimmed = e.trim()
      return trimmed || fallback
    }

    if (typeof e !== 'object') {
      return fallback
    }

    const shaped = e as PageLoadErrorLike & Error
    const fromStatus =
      shaped.statusMessage ||
      shaped.data?.statusMessage ||
      shaped.data?.message
    if (fromStatus && String(fromStatus).trim()) {
      return String(fromStatus).trim()
    }

    if (shaped.message && String(shaped.message).trim()) {
      // Avoid leaking opaque "[object Object]" style messages
      const msg = String(shaped.message).trim()
      if (msg !== '[object Object]') return msg
    }

    return fallback
  })
}

/**
 * Build a stable `useAsyncData` / `useLazyAsyncData` key that updates when the route id changes.
 * Using a computed key (or a function returning the same string) avoids stale caches across navigations.
 *
 * @param prefix - Namespace for the resource (e.g. `movie`, `person-credits`)
 * @param id - Entity id, or a ref/computed of it
 * @returns Computed key string `` `${prefix}-${id}` ``
 * @throws {Error} When `prefix` is empty/whitespace
 *
 * @example
 * ```ts
 * const id = computed(() => String(route.params.mid))
 * const key = pageKey('movie', id)
 * useLazyAsyncData(key, () => getMovie(id.value))
 * ```
 */
export function pageKey(
  prefix: string,
  id: MaybeRefPageId,
): ComputedRef<string> {
  const ns = String(prefix ?? '').trim()
  if (!ns) {
    throw new Error('pageKey prefix is required')
  }

  return computed((): string => {
    const raw = unref(id as Ref<PageKeyId>)
    const part =
      raw === null || raw === undefined || raw === ''
        ? 'unknown'
        : String(raw).trim() || 'unknown'
    return `${ns}-${part}`
  })
}

/**
 * Convenience: normalize any thrown / async-data error to a string for one-off handlers.
 * Prefer {@link usePageError} inside components so the message stays reactive.
 *
 * @param err - Unknown catch value or async-data error
 * @param fallback - Default copy
 * @returns Always a non-empty string
 */
export function formatPageError(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  if (err == null) return fallback
  if (typeof err === 'string') {
    const t = err.trim()
    return t || fallback
  }
  if (typeof err === 'object') {
    const shaped = err as PageLoadErrorLike & Error
    const msg =
      shaped.statusMessage ||
      shaped.data?.statusMessage ||
      shaped.data?.message ||
      shaped.message
    if (msg && String(msg).trim() && String(msg) !== '[object Object]') {
      return String(msg).trim()
    }
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

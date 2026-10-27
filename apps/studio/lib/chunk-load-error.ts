/**
 * Recovery for failed lazy-loaded JS/CSS chunks (route chunks, `next/dynamic`,
 * `React.lazy`, Monaco, …), which happen on flaky or mobile networks and after
 * deploys that remove old chunks.
 *
 * A page reload is the only reliable recovery: WebKit caches a failed module
 * fetch in the document's module map, so every later `import()` of the same
 * URL fails instantly until the document is replaced.
 */

export const CHUNK_LOAD_RELOAD_STORAGE_KEY = 'supabase-studio:chunk-load-reload'

/**
 * Minimum time between two automatic reloads in the same tab. A chunk that
 * fails again within this window after a reload is treated as persistent
 * (offline, chunk deleted by a deploy) and falls through to the error UI
 * instead of looping. It's longer than a cold boot on a slow mobile
 * connection, so a reload that itself takes a while to boot can't loop; a
 * fresh flake after the window gets its own reload.
 */
export const CHUNK_LOAD_RELOAD_GUARD_MS = 30_000

const CHUNK_LOAD_ERROR_PATTERNS = [
  // Chrome / Chromium
  /Failed to fetch dynamically imported module/i,
  // Firefox
  /error loading dynamically imported module/i,
  // Safari / WebKit (incl. every iOS browser); carries no URL
  /Importing a module script failed/i,
  // Vite's dynamic-import dependency preloader
  /Unable to preload CSS/i,
  // Next.js / webpack (JS and CSS chunks)
  /Loading (CSS )?chunk [^\s]+ failed/i,
]

export function isChunkLoadError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const name = 'name' in error && typeof error.name === 'string' ? error.name : ''
  if (name === 'ChunkLoadError') return true

  const message = 'message' in error && typeof error.message === 'string' ? error.message : ''
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * The guard is keyed on time, not on the error message: WebKit's message is
 * identical for every chunk and sessionStorage outlives reloads, so a
 * message-keyed guard (as in TanStack's `lazyRouteComponent`) only ever
 * reloads once per tab.
 */
export function shouldReloadForChunkError({
  now,
  lastReloadAt,
  guardMs = CHUNK_LOAD_RELOAD_GUARD_MS,
}: {
  now: number
  lastReloadAt: number | null
  guardMs?: number
}): boolean {
  if (lastReloadAt === null) return true
  // A timestamp in the future means the clock moved backwards; don't trust it
  if (lastReloadAt > now) return false
  return now - lastReloadAt >= guardMs
}

type ChunkReloadStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * Returns `undefined` when there's no usable value, and `null` when storage
 * itself can't be read (private mode, blocked site data, SSR).
 */
function readLastReloadAt(storage: ChunkReloadStorage): number | undefined | null {
  try {
    const raw = storage.getItem(CHUNK_LOAD_RELOAD_STORAGE_KEY)
    if (raw === null) return undefined
    const value = Number(raw)
    return Number.isFinite(value) ? value : undefined
  } catch {
    return null
  }
}

function writeLastReloadAt(storage: ChunkReloadStorage, now: number): boolean {
  try {
    storage.setItem(CHUNK_LOAD_RELOAD_STORAGE_KEY, String(now))
    return true
  } catch {
    return false
  }
}

function getSessionStorage(): ChunkReloadStorage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

/**
 * Decides whether `error` should trigger a page reload, recording the reload
 * in the guard when it should. Without a working storage there's no loop
 * guard, so it never reloads.
 */
export function claimChunkLoadReload(
  error: unknown,
  {
    storage = getSessionStorage(),
    now = Date.now(),
  }: { storage?: ChunkReloadStorage; now?: number } = {}
): boolean {
  if (!storage || !isChunkLoadError(error)) return false

  const lastReloadAt = readLastReloadAt(storage)
  if (lastReloadAt === null) return false
  if (!shouldReloadForChunkError({ now, lastReloadAt: lastReloadAt ?? null })) return false

  return writeLastReloadAt(storage, now)
}

const decisions = new WeakMap<object, boolean>()

/**
 * Memoized per error object, so an error boundary's fallback (render) and its
 * `onError` handler (commit) can both ask and get the same answer while the
 * guard is only claimed once.
 */
export function getChunkLoadReloadDecision(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false

  const cached = decisions.get(error)
  if (cached !== undefined) return cached

  const decision = claimChunkLoadReload(error)
  decisions.set(error, decision)
  return decision
}

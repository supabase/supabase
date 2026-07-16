import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { initSentryTanStackClient } from './sentry.tanstack'
import { getQueryClient } from '@/data/query-client'
import { IS_PLATFORM } from '@/lib/constants'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

export interface RouterContext {
  queryClient: QueryClient
}

// Skew protection: pin this browser session to the deployment that served
// it, so lazily-loaded JS chunks fetched *during* that session always come
// from the same build as the one already running — never a 404 from a
// newer deploy's assets replacing the old ones. The pin is deliberately
// scoped to a single page life: `clearPinOnUnload` (below) drops it right
// before any reload/navigation, so every fresh document load re-resolves
// against the latest deployment (Vercel's default, unpinned behavior) and
// then re-pins to whatever that load actually got — it never replays a
// stale pin across reloads. Path MUST be `/`, not BASE_PATH: Studio's own
// redirect chain starts at the bare domain root (`/` → BASE_PATH →
// BASE_PATH/org, see redirects.shared.ts), and a cookie scoped to BASE_PATH
// is never sent on that first `/` hop — so it'd resolve against the latest
// deployment, contaminating the shell HTML with new-deployment chunk hashes
// before the pin ever kicks in. The version-check request stays unpinned
// via `credentials: 'omit'` (see deployment-commit-query.ts), not via
// cookie scoping. No-op unless we're on a Vercel deploy with Skew Protection
// enabled.
function pinDeploymentForSession() {
  if (typeof document === 'undefined') return
  if (!IS_PLATFORM) return
  if (process.env.NEXT_PUBLIC_VERCEL_SKEW_PROTECTION_ENABLED !== '1') return
  const deploymentId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID
  if (!deploymentId) return
  if (document.cookie.includes('__vdpl=')) return
  document.cookie = `__vdpl=${deploymentId}; Path=/; SameSite=Lax; Secure`
}

// Drops the pin right before the page unloads (reload, back/forward,
// typing a new URL, closing the tab) so the NEXT document request — whatever
// it is — always resolves against the latest deployment instead of
// replaying this session's pin. `pagehide` over `beforeunload`: it doesn't
// block bfcache eligibility and still fires reliably for reloads/navigation.
function clearPinOnUnload() {
  if (typeof window === 'undefined') return
  window.addEventListener('pagehide', () => {
    document.cookie = `__vdpl=; Path=/; Max-Age=0`
  })
}

// Backstop for the pin above: if a lazily-loaded chunk 404s — most likely the
// pinned deployment aged out of Skew Protection's Maximum Age, so its hashed
// chunks are gone — Vite emits `vite:preloadError`. Drop the pin and reload so
// we land on the latest deployment (a plain reload wouldn't recover, since the
// cookie would just re-pin to the dead deployment). A short time-window guard
// prevents a reload loop if the latest deployment is itself broken.
function registerChunkErrorBackstop() {
  if (typeof window === 'undefined') return
  window.addEventListener('vite:preloadError', (event) => {
    const KEY = 'studio:chunk-error-reload-at'
    let last = 0
    try {
      last = Number(sessionStorage.getItem(KEY) || 0)
    } catch {
      // sessionStorage unavailable — fall through and attempt a reload anyway.
    }
    // Reloaded very recently → likely a loop; let Vite surface the error.
    if (Date.now() - last < 10_000) return
    event.preventDefault()
    try {
      sessionStorage.setItem(KEY, String(Date.now()))
    } catch {
      // ignore — worst case we lose loop protection for this reload.
    }
    document.cookie = `__vdpl=; Path=/; Max-Age=0`
    window.location.reload()
  })
}

function getContext(): RouterContext {
  return {
    queryClient: getQueryClient(),
  }
}

export function getRouter() {
  pinDeploymentForSession()
  clearPinOnUnload()
  registerChunkErrorBackstop()

  const context = getContext()

  const router = createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Next-style search params (plain strings, repeated keys → arrays)
    // instead of TanStack's JSON defaults, which coerce "2"→2/"true"→true
    // and JSON-quote strings on write. The whole app — including the
    // next/router compat shim and nuqs — expects the Next semantics.
    parseSearch,
    stringifySearch,
    // Inlined via Vite's `define` at build time; stays undefined (= app at `/`)
    // unless NEXT_PUBLIC_BASE_PATH is set. Must agree with Vite `base`
    basepath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  })

  // Sentry: nothing loads Next's convention files (instrumentation-client.ts)
  // under TanStack Start, so init happens here — the earliest point with
  // access to the router instance, which the tracing integration needs.
  // No-op on the server and when no DSN is configured (see module).
  initSentryTanStackClient(router)

  // @tanstack/react-router-ssr-query@1.166.12 pulls in @tanstack/query-core@5.100
  // as a peer, but our app pins react-query to 5.83. The QueryClient class is
  // structurally identical between the two, but TS treats them as nominally
  // distinct types because each version has its own `#private` field.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient as any })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

// Next exports a `next/compat/router` variant whose `useRouter()` returns
// `NextRouter | null` so that components can be rendered outside a
// pages-router context without crashing. Under TanStack we always have a
// router, so this never returns null in practice. Re-export the full
// pages-router shim so the surface stays in sync (back, forward, reload,
// prefetch, isReady, locale, etc.).

export { useRouter } from '../router'

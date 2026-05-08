import {
  useLocation,
  useMatches,
  useParams,
  useSearch,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'

import { getRouterEventsProxy } from '../_router-events'

// See note in ../router.ts: pages-router semantics expose `pathname` as
// the route pattern, not the resolved URL. Convert TanStack's `$param`
// route id to Next's `[param]` so legacy consumers keep working.
function toNextPathPattern(routeId: string) {
  return routeId.replace(/\$([a-zA-Z0-9_]+)/g, '[$1]')
}

export function useRouter() {
  const router = useTanStackRouter()
  const location = useLocation()
  const matches = useMatches()
  const params = useParams({ strict: false })
  const search = useSearch({ strict: false })
  const leafRouteId = matches[matches.length - 1]?.routeId ?? location.pathname
  const pathPattern = toNextPathPattern(leafRouteId)
  return {
    pathname: pathPattern,
    // Match pages-router: `route` mirrors `pathname` (the bracketed
    // pattern). Studio call sites read `router.route` directly.
    route: pathPattern,
    query: { ...params, ...search },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push: (path: string) => router.navigate({ to: path as any }),
    events: getRouterEventsProxy(router),
  }
}

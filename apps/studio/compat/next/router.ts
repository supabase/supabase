import {
  useLocation,
  useMatches,
  useParams,
  useSearch,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'

import { getRouterEventsProxy } from './_router-events'

// Next's pages-router exposes `router.pathname` as the route *pattern*
// (e.g. `/project/[ref]/sql/[id]`), not the resolved URL. TanStack's
// route id uses `$param` — convert so legacy code that does
// `router.pathname.endsWith('/sql/[id]')` keeps working.
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
    // Next's pages-router exposes `route` and `pathname` as the same value
    // — the route pattern with bracketed dynamic segments. Some studio
    // code (e.g. AppLayout/BranchLink, AppLayout/ProjectDropdown) reads
    // `router.route` specifically; without this it's `undefined` and
    // downstream `.split('/')` calls crash.
    route: pathPattern,
    query: { ...params, ...search },
    asPath: location.href,
    basePath: router.basepath ?? '',
    events: getRouterEventsProxy(router),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push: (path: string) => router.navigate({ to: path as any }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replace: (path: string) => router.navigate({ to: path as any, replace: true }),
  }
}

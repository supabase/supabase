import {
  useLocation,
  useParams,
  useSearch,
  useRouter as useTanStackRouter,
} from '@tanstack/react-router'

import { getRouterEventsProxy } from '../_router-events'

export function useRouter() {
  const router = useTanStackRouter()
  const location = useLocation()
  const params = useParams({ strict: false })
  const search = useSearch({ strict: false })
  return {
    pathname: location.pathname,
    query: { ...params, ...search },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    push: (path: string) => router.navigate({ to: path as any }),
    events: getRouterEventsProxy(router),
  }
}

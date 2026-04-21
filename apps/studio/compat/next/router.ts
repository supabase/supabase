import { useLocation, useRouter as useTanStackRouter } from '@tanstack/react-router'

import { getRouterEventsProxy } from './_router-events'

export function useRouter() {
  const router = useTanStackRouter()
  const location = useLocation()
  return {
    pathname: location.pathname,
    basePath: router.basepath ?? '',
    events: getRouterEventsProxy(router),
  }
}

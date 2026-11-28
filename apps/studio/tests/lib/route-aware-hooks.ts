import { createContext, useContext } from 'react'

/** Provided by `renderRoute` inside its memory router. */
export const RenderedRouteContext = createContext(false)

/**
 * Builds a hook that calls `useRouteHook` inside a route rendered by `renderRoute` and
 * `useFallbackHook` everywhere else. Lets the global `common` test mock read the
 * route's real location while plain component tests keep their static defaults. A component
 * never moves between the two, so hook order stays stable.
 */
export function routeAwareHook<TArgs extends unknown[], TRouteResult, TFallbackResult>(
  useRouteHook: (...args: TArgs) => TRouteResult,
  useFallbackHook: (...args: TArgs) => TFallbackResult
) {
  return function useRouteAware(...args: TArgs): TRouteResult | TFallbackResult {
    const isRenderedRoute = useContext(RenderedRouteContext)
    const useHook = isRenderedRoute ? useRouteHook : useFallbackHook
    return useHook(...args)
  }
}

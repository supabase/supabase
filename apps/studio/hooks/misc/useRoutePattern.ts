import { useLocation, useMatches } from '@tanstack/react-router'

/**
 * Returns the matched leaf route pattern without a trailing slash on index routes
 * (e.g. `/project/$ref/sql/$id`, `/project/$ref`, `/`).
 *
 * Falls back to `location.pathname` when rendered outside a matched child route
 * (such as component tests mounted with a bare root route).
 */
export function useRoutePattern(): string {
  const leafFullPath = useMatches({
    select: (matches) => {
      const leaf = matches.at(-1)
      if (!leaf || leaf.routeId === '__root__') return undefined
      return leaf.fullPath.replace(/(.)\/$/, '$1')
    },
  })
  const pathname = useLocation({ select: (location) => location.pathname })

  return leafFullPath ?? pathname
}

import type { ParsedUrlQuery } from 'querystring'

/**
 * Sanitizes a route for project navigation (e.g. when building href for project switch).
 * Truncates to avoid carrying extra query params as path segments.
 */
export function sanitizeRoute(route: string, routerQueries: ParsedUrlQuery): string {
  const queryArray = Object.entries(routerQueries)

  if (queryArray.length > 1) {
    // [Joshen] Ideally we shouldn't use hard coded numbers, but temp workaround
    // for storage bucket route since its longer
    const isStorageBucketRoute = 'bucketId' in routerQueries
    const isSecurityAdvisorRoute = 'preset' in routerQueries

    return route
      .split('/')
      .slice(0, isStorageBucketRoute || isSecurityAdvisorRoute ? 5 : 4)
      .join('/')
  }
  return route
}

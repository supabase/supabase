import type { ParsedUrlQuery } from 'querystring'

/**
 * Sanitizes a route for project navigation (e.g. when building href for project switch).
 * Truncates to avoid carrying project-specific dynamic path segments.
 * Uses route segments (not query params) to determine truncation, so non-path query keys
 * (e.g. sort, filter) do not incorrectly trigger or affect truncation.
 */
export function sanitizeRoute(_route: string, _routerQueries: ParsedUrlQuery): string {
  const routeSegments = _route.split('/')

  const hasStorageBucketSegment = routeSegments.includes('[bucketId]')
  const hasSecurityAdvisorSegment = routeSegments.includes('[preset]')
  const hasOtherDynamicSegment = routeSegments.some(
    (s) => s.startsWith('[') && s.endsWith(']') && s !== '[ref]'
  )

  const needsTruncation =
    hasStorageBucketSegment || hasSecurityAdvisorSegment || hasOtherDynamicSegment
  if (!needsTruncation) return _route

  const sliceLength = hasStorageBucketSegment || hasSecurityAdvisorSegment ? 5 : 4
  return routeSegments.slice(0, sliceLength).join('/')
}

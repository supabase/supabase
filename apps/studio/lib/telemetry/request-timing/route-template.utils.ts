/**
 * Route template for a matched route's `fullPath`, e.g. `/project/$ref/editor/` becomes
 * `/project/[ref]/editor`.
 *
 * This is the same shape the `pathname` of other Studio telemetry events has (the compat
 * router's `pathname`), so the events can be grouped by route together. `fullPath` already
 * leaves out pathless layout routes. A template never contains a project ref or slug.
 */
export function toRouteTemplate(fullPath: string) {
  const withBracketParams = fullPath.replace(/\$([a-zA-Z0-9_]+)/g, '[$1]')
  if (withBracketParams === '' || withBracketParams === '/') return '/'
  return withBracketParams.replace(/\/$/, '')
}

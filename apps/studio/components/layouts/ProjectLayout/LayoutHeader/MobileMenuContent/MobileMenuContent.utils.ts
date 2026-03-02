/**
 * Derives the current section key from the project pathname.
 * e.g. /project/[ref]/database/schemas → 'database', /project/[ref] → null (home).
 */
export function getSectionKeyFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const projectIndex = segments.indexOf('project')
  if (projectIndex === -1 || segments.length <= projectIndex + 1) return null
  const refSegment = segments[projectIndex + 1]
  if (!refSegment || refSegment.startsWith('[')) return null
  const sectionSegment = segments[projectIndex + 2]
  if (!sectionSegment) return null
  return sectionSegment
}

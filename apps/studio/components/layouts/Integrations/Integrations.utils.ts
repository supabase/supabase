/**
 * Builds the integrations page key from pathname segments.
 * e.g. /project/ref/integrations → 'integrations'
 *      /project/ref/integrations/abc-123 → 'integrations/abc-123'
 * Returns empty string if path is too short.
 */
export function getIntegrationsPageFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const projectIndex = segments.indexOf('project')
  if (projectIndex === -1 || segments.length <= projectIndex + 2) return ''

  const section = segments[projectIndex + 2]
  const subSection = segments[projectIndex + 3]
  if (!section) return ''

  return subSection ? `${section}/${subSection}` : section
}

/**
 * Extracts the 'category' query parameter from a full URL (asPath).
 * Returns null if not present or asPath is invalid.
 */
export function getCategoryParamFromAsPath(asPath: string | undefined): string | null {
  if (!asPath || typeof asPath !== 'string') return null

  const queryPart = asPath.split('?')[1]
  if (!queryPart) return null

  const params = new URLSearchParams(queryPart)
  return params.get('category')
}

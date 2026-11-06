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

export interface ResolveSectionDisplayParams {
  viewLevel: 'top' | 'section'
  selectedSectionKey: string | null
  currentSectionKey: string | null
  currentProduct: string
  routes: Array<{ key: string; label: string }>
}

export interface SectionDisplay {
  sectionKey: string | null
  sectionLabel: string | null
}

/**
 * Resolves which section to show and its label for the mobile menu.
 * When in section view: uses selectedSectionKey (user clicked) or falls back to currentSectionKey.
 * Label resolves from currentProduct when matching the current section, otherwise from route labels.
 */
export function resolveSectionDisplay({
  viewLevel,
  selectedSectionKey,
  currentSectionKey,
  currentProduct,
  routes,
}: ResolveSectionDisplayParams): SectionDisplay {
  if (viewLevel !== 'section') {
    return { sectionKey: null, sectionLabel: null }
  }

  const sectionKey = selectedSectionKey ?? currentSectionKey

  if (!sectionKey) {
    return { sectionKey: null, sectionLabel: null }
  }

  const isCurrentSection = sectionKey === currentSectionKey
  if (isCurrentSection) {
    return { sectionKey, sectionLabel: currentProduct }
  }

  const matchingRoute = routes.find((r) => r.key === sectionKey)
  const sectionLabel = matchingRoute?.label ?? sectionKey

  return { sectionKey, sectionLabel }
}

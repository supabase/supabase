export interface StudioPageTitleParts {
  entity?: string
  section?: string
  surface?: string
  project?: string
  org?: string
  brand?: string
}

export const STUDIO_PAGE_TITLE_SEPARATOR = ' | '
const MAX_SEGMENT_LENGTH = 60

const normalizeTitleSegment = (value?: string) => {
  if (value === undefined) return undefined

  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length === 0) return undefined

  if (normalized.length <= MAX_SEGMENT_LENGTH) return normalized
  return `${normalized.slice(0, MAX_SEGMENT_LENGTH - 1).trimEnd()}…`
}

export const buildStudioPageTitle = (parts: StudioPageTitleParts) => {
  const orderedParts = [
    parts.entity,
    parts.section,
    parts.surface,
    parts.project,
    parts.org,
    parts.brand,
  ]

  const segments: string[] = []

  orderedParts.forEach((part) => {
    const segment = normalizeTitleSegment(part)
    if (!segment) return

    const lastSegment = segments[segments.length - 1]
    if (lastSegment !== undefined && lastSegment.toLowerCase() === segment.toLowerCase()) return

    segments.push(segment)
  })

  return segments.join(STUDIO_PAGE_TITLE_SEPARATOR)
}

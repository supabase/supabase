import type { GettingStartedState } from './GettingStarted/GettingStarted.types'
import type { ConnectSectionVariant } from './ConnectSection.config'

export const DEFAULT_SECTION_ORDER = [
  'connect',
  'getting-started',
  'usage',
  'advisor',
  'custom-report',
]

/**
 * Reconciles a stored section order with the canonical list.
 * Preserves user ordering for known sections, inserts missing
 * sections at their default-relative position.
 */
export function mergeSectionOrder(stored: string[]): string[] {
  const known = stored.filter((id) => DEFAULT_SECTION_ORDER.includes(id))
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !known.includes(id))

  if (missing.length === 0 && known.length === stored.length) return stored

  const merged = [...known]
  for (const id of missing) {
    const defaultIndex = DEFAULT_SECTION_ORDER.indexOf(id)
    const nextKnown = DEFAULT_SECTION_ORDER.slice(defaultIndex + 1).find((c) => merged.includes(c))

    if (!nextKnown) {
      merged.push(id)
    } else {
      merged.splice(merged.indexOf(nextKnown), 0, id)
    }
  }
  return merged
}

// Temporary: getSectionVisibility and related types support the connectSection
// experiment (connect vs getting-started). Remove after the experiment concludes.
interface SectionVisibilityInput {
  connectSectionVariant: ConnectSectionVariant | false | undefined
  isMatureProject: boolean
  hasProject: boolean
  gettingStartedState: GettingStartedState
}

export function getSectionVisibility(input: SectionVisibilityInput) {
  const { connectSectionVariant, isMatureProject, hasProject, gettingStartedState } = input
  const canShowEither = connectSectionVariant !== undefined && !isMatureProject && hasProject

  return {
    showConnectSection: canShowEither && connectSectionVariant === 'connect',
    showGettingStarted:
      canShowEither && connectSectionVariant !== 'connect' && gettingStartedState !== 'hidden',
  }
}

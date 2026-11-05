export const DEFAULT_SECTION_ORDER = ['connect', 'usage', 'issues', 'custom-report']

/**
 * Reconciles a stored section order with the canonical list.
 * Preserves user ordering for known sections, inserts missing
 * sections at their default-relative position.
 */
export function mergeSectionOrder(stored: string[]): string[] {
  // Keep the Issues row in the position the user chose for Advisors.
  const renamed = stored.map((id) => (id === 'advisor' ? 'issues' : id))
  const known = [...new Set(renamed.filter((id) => DEFAULT_SECTION_ORDER.includes(id)))]
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !known.includes(id))

  if (
    missing.length === 0 &&
    known.length === stored.length &&
    known.every((id, index) => id === stored[index])
  )
    return stored

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

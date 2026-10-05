/**
 * cmdk filter for the Connect comboboxes, matching a plain substring against the option label and
 * its key (passed through as a cmdk keyword) so `nextjs` finds `Next.js`.
 *
 * Also used to decide whether a combobox announces its empty state, so the announcement cannot
 * disagree with what the list actually filtered out.
 */
export function getOptionMatchScore(value: string, search: string, keywords?: string[]) {
  const normalizedSearch = search.trim().toLowerCase()
  if (normalizedSearch.length === 0) return 1

  const searchableValues = [value, ...(keywords ?? [])]

  return searchableValues.some((item) => item.toLowerCase().includes(normalizedSearch)) ? 1 : 0
}

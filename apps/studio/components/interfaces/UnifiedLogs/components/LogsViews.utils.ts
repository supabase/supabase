export const MIN_FILTERS_TO_SAVE = 1

export const VIEW_NAME_MAX_LENGTH = 64

export const isDuplicateViewName = (name: string, existingNames: string[]): boolean => {
  const normalized = name.trim().toLowerCase()
  return existingNames.some((existing) => existing.trim().toLowerCase() === normalized)
}

const MAX_VIEW_NAME_IN_COPY = 32

export const truncateViewName = (name: string): string =>
  name.length <= MAX_VIEW_NAME_IN_COPY
    ? name
    : `${name.slice(0, MAX_VIEW_NAME_IN_COPY - 1).trimEnd()}…`

// Order-independent so two filter sets with the same conditions in a different
// order count as "the same combination" for dismissal purposes. JSON-encoded
// rather than delimiter-joined since filter values are free text and can
// contain the delimiter itself (e.g. an ILIKE search for "a|b").
export const getFilterCombinationKey = (filter: string[] | null | undefined): string => {
  if (!filter || filter.length === 0) return ''
  return JSON.stringify([...filter].sort())
}

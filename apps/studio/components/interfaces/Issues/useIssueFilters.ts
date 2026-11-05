import {
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs'

import { ISSUE_CATEGORIES, ISSUE_SEVERITIES } from './Issues.constants'

// Filters live in the URL so a filtered view can be shared or bookmarked, and so links to
// the old per-category advisor pages can land on the matching list
const issueFilterParsers = {
  severity: parseAsArrayOf(parseAsStringLiteral(ISSUE_SEVERITIES)).withDefault([]),
  category: parseAsArrayOf(parseAsStringLiteral(ISSUE_CATEGORIES)).withDefault([]),
  q: parseAsString.withDefault(''),
}

const serializeIssueFilters = createSerializer(issueFilterParsers)

export function useIssueFilters() {
  const [filters, setFilters] = useQueryStates(issueFilterParsers)

  const activeFilterCount = filters.severity.length + filters.category.length

  const clearFilters = () => setFilters({ severity: null, category: null, q: null })

  /** Builds a link that keeps the current filters, so moving between issues keeps the list. */
  const getHref = (pathname: string) => serializeIssueFilters(pathname, filters)

  return { filters, setFilters, activeFilterCount, clearFilters, getHref }
}

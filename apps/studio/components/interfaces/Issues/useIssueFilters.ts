import {
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs'

import { ISSUE_CATEGORIES, ISSUE_ORIGIN_TYPES, ISSUE_SEVERITIES } from './Issues.constants'
import { ISSUE_STATUS_VIEW_STATUSES, type IssueStatusView } from './Issues.utils'
import type { IssueListFilters } from '@/data/issues/issue-schema'

const STATUS_VIEWS: IssueStatusView[] = ['open', 'snoozed', 'closed']

// Filters live in the URL so a filtered view can be shared, bookmarked, or linked to by an
// agent ("here are the open critical security issues")
const issueFilterParsers = {
  status: parseAsStringLiteral(STATUS_VIEWS).withDefault('open'),
  severity: parseAsArrayOf(parseAsStringLiteral(ISSUE_SEVERITIES)).withDefault([]),
  category: parseAsArrayOf(parseAsStringLiteral(ISSUE_CATEGORIES)).withDefault([]),
  source: parseAsArrayOf(parseAsStringLiteral(ISSUE_ORIGIN_TYPES)).withDefault([]),
  q: parseAsString.withDefault(''),
}

const serializeIssueFilters = createSerializer(issueFilterParsers)

export type IssueFilterState = ReturnType<typeof useIssueFilters>['filters']

export function useIssueFilters() {
  const [filters, setFilters] = useQueryStates(issueFilterParsers)

  const apiFilters: IssueListFilters = {
    status: ISSUE_STATUS_VIEW_STATUSES[filters.status],
    severity: filters.severity,
    category: filters.category,
    origin: filters.source,
    search: filters.q,
  }

  const activeFilterCount =
    filters.severity.length +
    filters.category.length +
    filters.source.length +
    (filters.status === 'open' ? 0 : 1)

  const clearFilters = () =>
    setFilters({ status: null, severity: null, category: null, source: null, q: null })

  /** Builds a link that keeps the current filters, so moving between issues keeps the list. */
  const getHref = (pathname: string) => serializeIssueFilters(pathname, filters)

  return { filters, setFilters, apiFilters, activeFilterCount, clearFilters, getHref }
}

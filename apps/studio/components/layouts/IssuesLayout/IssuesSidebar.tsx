import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useRef } from 'react'
import { Button } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IssuesFilterMenu } from './IssuesFilterMenu'
import { IssuesListItem } from './IssuesListItem'
import type { IssueStatusView } from '@/components/interfaces/Issues/Issues.utils'
import { useIssueFilters } from '@/components/interfaces/Issues/useIssueFilters'
import { AlertError } from '@/components/ui/AlertError'
import type { Issue } from '@/data/issues/issue-schema'
import { issuesQueryOptions } from '@/data/issues/issues-query'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const EMPTY_COPY: Record<IssueStatusView, { title: string; description: string }> = {
  open: {
    title: 'No open issues',
    description: 'Failing checks and issues filed by people or agents show up here.',
  },
  snoozed: {
    title: 'No snoozed issues',
    description: 'Snoozed issues reopen on their own when the snooze ends.',
  },
  closed: {
    title: 'No closed issues',
    description: 'Resolved and dismissed issues show up here.',
  },
}

export const IssuesSidebar = () => {
  const { ref, id } = useParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { filters, setFilters, apiFilters, activeFilterCount, clearFilters, getHref } =
    useIssueFilters()

  const debouncedSearch = useDebounce(filters.q, 250)
  const { data, error, isPending, isError, isSuccess } = useQuery(
    issuesQueryOptions({ projectRef: ref, filters: { ...apiFilters, search: debouncedSearch } })
  )

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search issues' }
  )
  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, clearFilters)

  const issues = data?.issues ?? []
  const hasFiltersApplied = activeFilterCount > 0 || filters.q.length > 0
  const emptyCopy = EMPTY_COPY[filters.status]

  const getIssueHref = (issue: Issue) => getHref(`/project/${ref}/issues/${issue.id}`)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 px-3 pt-3">
        <div className="flex items-center gap-1">
          <span id="issues-sidebar-search-label" className="sr-only">
            Search issues
          </span>
          <InnerSideBarFilters className="w-full gap-0 p-0">
            <InnerSideBarFilterSearchInput
              ref={searchInputRef}
              name="issues-sidebar-search"
              value={filters.q}
              placeholder="Search issues"
              aria-labelledby="issues-sidebar-search-label"
              isLoading={filters.q !== debouncedSearch}
              onChange={(event) => setFilters({ q: event.target.value || null })}
              onKeyDown={onSearchInputEscape(filters.q, (q) => setFilters({ q: q || null }))}
            />
          </InnerSideBarFilters>
          <IssuesFilterMenu counts={data?.counts} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto p-3">
        {isPending && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to retrieve issues" />}
        {isSuccess && issues.length === 0 && (
          <div className="flex flex-col gap-1 px-2 py-2">
            <p className="text-sm text-foreground-light">
              {hasFiltersApplied ? 'No issues match these filters' : emptyCopy.title}
            </p>
            <p className="text-sm text-foreground-lighter">
              {hasFiltersApplied
                ? 'Try another search or clear the filters.'
                : emptyCopy.description}
            </p>
            {hasFiltersApplied && (
              <Button variant="default" size="tiny" className="mt-2 w-fit" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
        {isSuccess &&
          issues.map((issue) => (
            <IssuesListItem
              key={issue.id}
              issue={issue}
              href={getIssueHref(issue)}
              isActive={issue.id === id}
            />
          ))}
      </div>
    </div>
  )
}

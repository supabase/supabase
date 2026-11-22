import { useParams } from 'common'
import { useRef } from 'react'
import { Button } from 'ui'
import { InnerSideBarFilters, InnerSideBarFilterSearchInput } from 'ui-patterns/InnerSideMenu'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IssuesFilterMenu } from './IssuesFilterMenu'
import { IssuesListItem } from './IssuesListItem'
import { filterIssues } from '@/components/interfaces/Issues/Issues.utils'
import { useIssueFilters } from '@/components/interfaces/Issues/useIssueFilters'
import { AlertError } from '@/components/ui/AlertError'
import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const IssuesSidebar = () => {
  const { ref, id } = useParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { filters, setFilters, activeFilterCount, clearFilters, getHref } = useIssueFilters()
  const {
    issues: allIssues,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useProjectIssues({ projectRef: ref })

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search issues' }
  )
  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, clearFilters)

  const issues = filterIssues(allIssues, {
    severity: filters.severity,
    category: filters.category,
    search: filters.q,
  })
  const hasFiltersApplied = activeFilterCount > 0 || filters.q.length > 0

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
              onChange={(event) => setFilters({ q: event.target.value || null })}
              onKeyDown={onSearchInputEscape(filters.q, (q) => setFilters({ q: q || null }))}
            />
          </InnerSideBarFilters>
          <IssuesFilterMenu />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto p-3">
        {isLoading && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to retrieve issues" />}
        {isSuccess && issues.length === 0 && (
          <div className="flex flex-col gap-1 px-2 py-2">
            <p className="text-sm text-foreground-light">
              {hasFiltersApplied ? 'No issues match these filters' : 'No open issues'}
            </p>
            <p className="text-sm text-foreground-lighter">
              {hasFiltersApplied
                ? 'Try another search or clear the filters.'
                : 'Failing checks show up here.'}
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
              href={getHref(`/project/${ref}/issues/${issue.id}`)}
              isActive={issue.id === id}
            />
          ))}
      </div>
    </div>
  )
}

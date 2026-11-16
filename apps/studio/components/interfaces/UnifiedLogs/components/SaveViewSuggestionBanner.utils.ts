import isEqual from 'lodash/isEqual'
import type { FilterGroup } from 'ui-patterns/FilterBar'

import type { LogsView } from '../UnifiedLogs.views'

// How many filters before we proactively offer to save a view. Deliberately higher
// than MIN_FILTERS_TO_SAVE so the unprompted banner only interrupts once the filter
// set is worth keeping.
export const SAVE_VIEW_SUGGESTION_THRESHOLD = 2

// How many filters before the user can save a view themselves.
export const MIN_FILTERS_TO_SAVE = 1

const MAX_VIEW_NAME_IN_COPY = 32

// A view name can run to VIEW_NAME_MAX_LENGTH, which would crowd out the rest of the
// sentence in the banner. Truncate the name itself so the surrounding copy survives —
// CSS truncation would clip the question instead.
export const truncateViewName = (name: string): string =>
  name.length <= MAX_VIEW_NAME_IN_COPY
    ? name
    : `${name.slice(0, MAX_VIEW_NAME_IN_COPY - 1).trimEnd()}…`

// Order-independent so two filter sets with the same conditions in a different
// order count as "the same combination" for dismissal purposes.
export const getFilterCombinationKey = (filter: string[] | null | undefined): string =>
  [...(filter ?? [])].sort().join('|')

// True when some saved view already has this exact filter set, regardless of
// whether that view is the currently active one (e.g. the user rebuilt the same
// filters by hand, or applied a view and then matched another view's filters).
export const isFilterComboAlreadySaved = (filters: FilterGroup, views: LogsView[]): boolean =>
  views.some((view) => isEqual(view.filters, filters))

export const shouldShowSaveViewSuggestion = ({
  isEnabled,
  activeFilterCount,
  hasActiveView,
  isDialogOpen,
  isDismissed,
  isAlreadySaved,
}: {
  isEnabled: boolean
  activeFilterCount: number
  hasActiveView: boolean
  isDialogOpen: boolean
  isDismissed: boolean
  isAlreadySaved: boolean
}): boolean =>
  isEnabled &&
  activeFilterCount >= SAVE_VIEW_SUGGESTION_THRESHOLD &&
  !hasActiveView &&
  !isDialogOpen &&
  !isDismissed &&
  !isAlreadySaved

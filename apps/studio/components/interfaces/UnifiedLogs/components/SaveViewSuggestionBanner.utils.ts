import isEqual from 'lodash/isEqual'
import type { FilterGroup } from 'ui-patterns/FilterBar'

import type { LogsView } from '../UnifiedLogs.views'

export const SAVE_VIEW_SUGGESTION_THRESHOLD = 2

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

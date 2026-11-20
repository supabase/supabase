import { describe, expect, it } from 'vitest'

import type { LogsView } from '../UnifiedLogs.views'
import {
  getFilterCombinationKey,
  isFilterComboAlreadySaved,
  SAVE_VIEW_SUGGESTION_THRESHOLD,
  shouldShowSaveViewSuggestion,
} from './SaveViewSuggestionBanner.utils'

const baseArgs = {
  isEnabled: true,
  activeFilterCount: SAVE_VIEW_SUGGESTION_THRESHOLD,
  hasActiveView: false,
  isDialogOpen: false,
  isDismissed: false,
  isAlreadySaved: false,
}

describe('shouldShowSaveViewSuggestion', () => {
  it('shows when every condition is met', () => {
    expect(shouldShowSaveViewSuggestion(baseArgs)).toBe(true)
  })

  it('hides when the flag is disabled', () => {
    expect(shouldShowSaveViewSuggestion({ ...baseArgs, isEnabled: false })).toBe(false)
  })

  it('hides when below the filter threshold', () => {
    expect(
      shouldShowSaveViewSuggestion({
        ...baseArgs,
        activeFilterCount: SAVE_VIEW_SUGGESTION_THRESHOLD - 1,
      })
    ).toBe(false)
  })

  it('shows above the threshold', () => {
    expect(
      shouldShowSaveViewSuggestion({
        ...baseArgs,
        activeFilterCount: SAVE_VIEW_SUGGESTION_THRESHOLD + 5,
      })
    ).toBe(true)
  })

  it('hides when a view is already active', () => {
    expect(shouldShowSaveViewSuggestion({ ...baseArgs, hasActiveView: true })).toBe(false)
  })

  it('hides while the save dialog is open', () => {
    expect(shouldShowSaveViewSuggestion({ ...baseArgs, isDialogOpen: true })).toBe(false)
  })

  it('hides when already dismissed for this filter combination', () => {
    expect(shouldShowSaveViewSuggestion({ ...baseArgs, isDismissed: true })).toBe(false)
  })

  it('hides when this filter combination is already saved as a view', () => {
    expect(shouldShowSaveViewSuggestion({ ...baseArgs, isAlreadySaved: true })).toBe(false)
  })
})

const makeView = (filters: LogsView['filters']): LogsView => ({
  id: 'view-1',
  type: 'logs_view',
  version: 1,
  name: 'Some view',
  logSource: 'edge_logs',
  filters,
  viewOptions: {},
})

describe('isFilterComboAlreadySaved', () => {
  const filters = {
    logicalOperator: 'AND' as const,
    conditions: [{ propertyName: 'level', operator: '=', value: 'error' }],
  }

  it('is true when a saved view has the exact same filters', () => {
    expect(isFilterComboAlreadySaved(filters, [makeView(filters)])).toBe(true)
  })

  it('is true regardless of which view matches, not just the active one', () => {
    const other = makeView({ logicalOperator: 'AND', conditions: [] })
    expect(isFilterComboAlreadySaved(filters, [other, makeView(filters)])).toBe(true)
  })

  it('is false when no saved view matches', () => {
    const different = makeView({ logicalOperator: 'AND', conditions: [] })
    expect(isFilterComboAlreadySaved(filters, [different])).toBe(false)
  })

  it('is false when there are no saved views', () => {
    expect(isFilterComboAlreadySaved(filters, [])).toBe(false)
  })
})

describe('getFilterCombinationKey', () => {
  it('is order-independent', () => {
    expect(getFilterCombinationKey(['a', 'b', 'c'])).toBe(getFilterCombinationKey(['c', 'a', 'b']))
  })

  it('differs when the filter set actually differs', () => {
    expect(getFilterCombinationKey(['a', 'b'])).not.toBe(getFilterCombinationKey(['a', 'c']))
  })

  it('treats null/undefined/empty as the same empty key', () => {
    expect(getFilterCombinationKey(null)).toBe('')
    expect(getFilterCombinationKey(undefined)).toBe('')
    expect(getFilterCombinationKey([])).toBe('')
  })
})

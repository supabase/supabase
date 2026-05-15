import { Dispatch, RefObject, SetStateAction } from 'react'

import type { EdgeFunctionsSort } from '@/components/interfaces/EdgeFunctions/EdgeFunctionsSortDropdown'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const DEFAULT_SORT: EdgeFunctionsSort = 'name:asc'

interface UseFunctionsListShortcutsParams {
  searchInputRef: RefObject<HTMLInputElement>
  setSearch: Dispatch<SetStateAction<string>> | ((value: string) => void)
  sort: EdgeFunctionsSort
  setSort: (value: EdgeFunctionsSort) => void
  onCreateNew: () => void
  onRefresh: () => void
}

export function useFunctionsListShortcuts({
  searchInputRef,
  setSearch,
  sort,
  setSort,
  onCreateNew,
  onRefresh,
}: UseFunctionsListShortcutsParams) {
  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search functions' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_NEW_ITEM, onCreateNew, {
    label: 'Deploy a new function',
  })

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => {
    setSearch('')
  })

  useShortcut(SHORTCUT_IDS.FUNCTIONS_LIST_REFRESH, onRefresh)

  useShortcut(SHORTCUT_IDS.FUNCTIONS_LIST_CLEAR_SORT, () => setSort(DEFAULT_SORT), {
    enabled: sort !== DEFAULT_SORT,
  })
}

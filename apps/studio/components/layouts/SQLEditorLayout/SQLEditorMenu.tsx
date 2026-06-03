import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
} from 'ui-patterns/InnerSideMenu'

import { SearchList } from './SQLEditorNavV2/SearchList'
import { SQLEditorCreateMenu } from './SQLEditorNavV2/SQLEditorCreateMenu'
import { SQLEditorNav } from './SQLEditorNavV2/SQLEditorNav'
import {
  SQL_EDITOR_CHROME_HEADER_CLASSNAME,
  SQL_EDITOR_NAV_CONTENT_CLASSNAME,
} from './SQLEditorNavV2/SQLEditorNav.constants'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import { getAppStateSnapshot } from '@/state/app-state'

export const SQLEditorMenu = () => {
  const { ref } = useParams()

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useLocalStorage<'name' | 'inserted_at'>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SORT(ref ?? ''),
    'inserted_at'
  )

  const appState = getAppStateSnapshot()
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    setShowSearch(debouncedSearch.length > 0)
  }, [debouncedSearch])

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex grow flex-col">
        <div className={SQL_EDITOR_CHROME_HEADER_CLASSNAME}>
          <InnerSideBarFilters className="w-full gap-2 p-0">
            <div className="min-w-0 flex-1">
              <InnerSideBarFilterSearchInput
                name="search-queries"
                placeholder="Search queries and chats..."
                aria-labelledby="Search queries and chats"
                value={search}
                onChange={(e) => {
                  const value = e.target.value
                  setSearch(value)
                  if (value.length === 0) setShowSearch(false)
                }}
                onKeyDown={(e) => {
                  if (e.code === 'Escape') {
                    setSearch('')
                    setShowSearch(false)
                  }
                }}
              >
                {showSearch ? (
                  <Tooltip>
                    <TooltipTrigger
                      className="absolute right-1 top-[.4rem] md:top-[.3rem] transition-colors text-foreground-light hover:text-foreground"
                      onClick={() => {
                        setSearch('')
                        setShowSearch(false)
                      }}
                    >
                      <X size={18} />
                    </TooltipTrigger>
                    <TooltipContent>Clear search</TooltipContent>
                  </Tooltip>
                ) : (
                  <InnerSideBarFilterSortDropdown
                    value={sort}
                    onValueChange={(value: any) => setSort(value)}
                  >
                    <InnerSideBarFilterSortDropdownItem key="name" value="name">
                      Alphabetical
                    </InnerSideBarFilterSortDropdownItem>
                    <InnerSideBarFilterSortDropdownItem key="inserted_at" value="inserted_at">
                      Created At
                    </InnerSideBarFilterSortDropdownItem>
                  </InnerSideBarFilterSortDropdown>
                )}
              </InnerSideBarFilterSearchInput>
            </div>
            <SQLEditorCreateMenu />
          </InnerSideBarFilters>
        </div>

        <div className={SQL_EDITOR_NAV_CONTENT_CLASSNAME}>
          {showSearch ? <SearchList search={debouncedSearch} /> : <SQLEditorNav sort={sort} />}
        </div>
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-studio">
        <Button block type="default" onClick={() => appState.setOnGoingQueriesPanelOpen(true)}>
          View running queries
        </Button>
      </div>
    </div>
  )
}

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ChevronDown, FolderPlus, List, Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  InnerSideBarFilters,
  InnerSideBarFilterSearchInput,
  InnerSideBarFilterSortDropdown,
  InnerSideBarFilterSortDropdownItem,
} from 'ui-patterns/InnerSideMenu'

import { SearchList } from './SQLEditorNavV2/SearchList'
import { SQLEditorNav } from './SQLEditorNavV2/SQLEditorNav'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useProfile } from '@/lib/profile'
import { getAppStateSnapshot } from '@/state/app-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export const SQLEditorMenu = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useLocalStorage<'name' | 'inserted_at'>(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SORT(ref ?? ''),
    'inserted_at'
  )

  const debouncedSearch = useDebounce(search, 500)

  const { can: canCreateSQLSnippet } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'sql', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  const createNewFolder = () => {
    if (!ref) return console.error('Project ref is required')
    setSearch('')
    setShowSearch(false)
    snapV2.addNewFolder({ projectRef: ref })
  }

  const handleNewQuery = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project is required')
    if (!profile) return console.error('Profile is required')
    if (!canCreateSQLSnippet) {
      return toast('Your queries will not be saved as you do not have sufficient permissions')
    }
    try {
      router.push(`/project/${ref}/sql/new?skip=true`)
      setSearch('')
      setShowSearch(false)
    } catch (error: any) {
      toast.error(`Failed to create new query: ${error.message}`)
    }
  }

  const openRunningQueries = () => {
    getAppStateSnapshot().setOnGoingQueriesPanelOpen(true)
  }

  useEffect(() => {
    setShowSearch(debouncedSearch.length > 0)
  }, [debouncedSearch])

  return (
    <div className="flex h-full grow flex-col gap-2 pt-5">
      <div className="mx-4 flex min-w-0 shrink-0 items-center">
        <Button
          data-testid="sql-editor-new-query-button"
          type="button"
          size="tiny"
          variant="default"
          className="h-7 min-w-0 flex-1 justify-start rounded-r-none hover:z-10"
          icon={<Plus size={14} strokeWidth={1.5} className="text-foreground-muted" />}
          onClick={handleNewQuery}
        >
          New query
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="default"
              aria-label="More query actions"
              className="h-7 w-7 shrink-0 rounded-l-none -ml-px px-0"
              icon={<ChevronDown size={14} strokeWidth={1.5} />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="w-52">
            <DropdownMenuItem className="gap-x-2" onClick={createNewFolder}>
              <FolderPlus size={14} />
              New folder
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2" onClick={openRunningQueries}>
              <List size={14} />
              View running queries
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 grow flex-col gap-2 pb-4">
        <InnerSideBarFilters className="mx-2">
          <InnerSideBarFilterSearchInput
            name="search-queries"
            placeholder="Search queries..."
            aria-labelledby="Search queries"
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
                  className="absolute right-1 top-[.4rem] transition-colors text-foreground-light hover:text-foreground md:top-[.3rem]"
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
                onValueChange={(value: 'name' | 'inserted_at') => setSort(value)}
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
        </InnerSideBarFilters>

        {showSearch ? <SearchList search={debouncedSearch} /> : <SQLEditorNav sort={sort} />}
      </div>
    </div>
  )
}

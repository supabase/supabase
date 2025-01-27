import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FilePlus, FolderPlus, Plus, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useProfile } from 'lib/profile'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
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
  InnerSideMenuItem,
} from 'ui-patterns/InnerSideMenu'
import { SQLEditorNav } from './SQLEditorNavV2/SQLEditorNav'
import { SearchList } from './SQLEditorNavV2/SearchList'

interface SQLEditorMenuProps {
  onViewOngoingQueries: () => void
}

export const SQLEditorMenu = ({ onViewOngoingQueries }: SQLEditorMenuProps) => {
  const router = useRouter()
  const { profile } = useProfile()
  const project = useSelectedProject()
  const { ref } = useParams()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sort, setSort] = useLocalStorage<'name' | 'inserted_at'>('sql-editor-sort', 'inserted_at')

  const debouncedSearch = useDebounce(search, 500)

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

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

  useEffect(() => {
    setShowSearch(debouncedSearch.length > 0)
  }, [debouncedSearch])

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex flex-col gap-y-4 flex-grow">
        <div className="mt-4 mx-4 flex items-center justify-between gap-x-2">
          <InnerSideBarFilters className="w-full p-0 gap-0">
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
          </InnerSideBarFilters>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                icon={<Plus className="text-foreground" />}
                className="w-[26px]"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
              <DropdownMenuItem className="gap-x-2" onClick={() => handleNewQuery()}>
                <FilePlus size={14} />
                Create a new snippet
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-x-2" onClick={() => createNewFolder()}>
                <FolderPlus size={14} />
                Create a new folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showSearch ? (
          <SearchList
            search={debouncedSearch}
            onSelectSnippet={() => {
              setSearch('')
              setShowSearch(false)
            }}
          />
        ) : (
          <>
            <div className="px-2">
              <InnerSideMenuItem
                title="Templates"
                isActive={router.asPath === `/project/${ref}/sql/templates`}
                href={`/project/${ref}/sql/templates`}
              >
                Templates
              </InnerSideMenuItem>
              <InnerSideMenuItem
                title="Quickstarts"
                isActive={router.asPath === `/project/${ref}/sql/quickstarts`}
                href={`/project/${ref}/sql/quickstarts`}
              >
                Quickstarts
              </InnerSideMenuItem>
            </div>

            <SQLEditorNav sort={sort} />
          </>
        )}
      </div>

      <div className="p-4 border-t sticky bottom-0 bg-studio">
        <Button block type="default" onClick={onViewOngoingQueries}>
          View running queries
        </Button>
      </div>
    </div>
  )
}

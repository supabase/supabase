import { Filter, Grid, List, Loader2, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'

import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { PROJECT_STATUS } from 'lib/constants'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import {
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface HomePageActionsProps {
  slug?: string
  hideNewProject?: boolean
  showViewToggle?: boolean
}

export const HomePageActions = ({
  slug: _slug,
  hideNewProject = false,
  showViewToggle = false,
}: HomePageActionsProps) => {
  const { slug: urlSlug } = useParams()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const slug = _slug ?? urlSlug
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)
  const [filterStatus, setFilterStatus] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString, ',').withDefault([])
  )
  const [viewMode, setViewMode] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECTS_VIEW, 'grid')

  const { isFetching: isFetchingProjects } = useOrgProjectsInfiniteQuery(
    {
      slug,
      search: search.length === 0 ? search : debouncedSearch,
      statuses: filterStatus,
    },
    { keepPreviousData: true }
  )

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search for a project"
          icon={<Search size={12} />}
          size="tiny"
          className="w-32 md:w-64 pl-8 [&>div>div>div>input]:!pl-7 [&>div>div>div>div]:!pl-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          actions={[
            search && (
              <Button
                size="tiny"
                type="text"
                icon={<X />}
                onClick={() => setSearch('')}
                className="p-0 h-5 w-5"
              />
            ),
          ]}
        />

        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              type={filterStatus.length === 0 ? 'dashed' : 'secondary'}
              className="h-[26px] w-[26px]"
              icon={<Filter />}
            />
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center">
            <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
              <p className="text-xs">Filter projects by status</p>
              <div className="flex flex-col">
                {[
                  { key: PROJECT_STATUS.ACTIVE_HEALTHY, label: 'Active' },
                  { key: PROJECT_STATUS.INACTIVE, label: 'Paused' },
                ].map(({ key, label }) => (
                  <div className="flex items-center gap-x-2 py-1">
                    <Checkbox_Shadcn_
                      id={key}
                      name={key}
                      checked={filterStatus.includes(key)}
                      onCheckedChange={() => {
                        if (filterStatus.includes(key)) {
                          setFilterStatus(filterStatus.filter((y) => y !== key))
                        } else {
                          setFilterStatus(filterStatus.concat([key]))
                        }
                      }}
                    />
                    <Label_Shadcn_ htmlFor={key} className="capitalize text-xs w-full">
                      {label}
                    </Label_Shadcn_>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>

        {isFetchingProjects && <Loader2 className="animate-spin" size={14} />}
      </div>

      <div className="flex items-center gap-2">
        {showViewToggle && viewMode && setViewMode && (
          <ToggleGroup
            type="single"
            size="sm"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'table')}
          >
            <ToggleGroupItem value="grid" size="sm" className="h-[26px] w-[26px] p-0">
              <Grid size={14} strokeWidth={1.5} />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" size="sm" className="h-[26px] w-[26px] p-0">
              <List size={14} strokeWidth={1.5} />
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {projectCreationEnabled && !hideNewProject && (
          <Button asChild icon={<Plus />} type="primary" size="tiny">
            <Link href={`/new/${slug}`}>New project</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

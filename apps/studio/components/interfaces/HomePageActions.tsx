import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { PROJECT_STATUS } from 'lib/constants'
import { Grid, List, Loader2, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { FilterPopover } from '../ui/FilterPopover'

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

  const [filterStatusStorage, setFilterStatusStorage, { isSuccess }] = useLocalStorageQuery<
    string[]
  >(LOCAL_STORAGE_KEYS.PROJECTS_FILTER, [])

  const { isFetching: isFetchingProjects } = useOrgProjectsInfiniteQuery(
    {
      slug,
      search: search.length === 0 ? search : debouncedSearch,
      statuses: filterStatus,
    },
    { placeholderData: keepPreviousData }
  )

  useEffect(() => {
    if (isSuccess && !!urlSlug) setFilterStatus(filterStatusStorage)
  }, [filterStatusStorage, isSuccess, urlSlug, setFilterStatus])

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search for a project"
          icon={<Search />}
          size="tiny"
          className="w-32 md:w-64"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          actions={[
            search && (
              <Button
                key="clear"
                size="tiny"
                type="text"
                icon={<X />}
                onClick={() => setSearch('')}
                className="p-0 h-5 w-5"
              />
            ),
          ]}
        />

        <FilterPopover
          name="Status"
          title="Filter projects by status"
          options={[
            { key: PROJECT_STATUS.ACTIVE_HEALTHY, label: 'Active' },
            { key: PROJECT_STATUS.INACTIVE, label: 'Paused' },
          ]}
          activeOptions={filterStatus}
          valueKey="key"
          labelKey="label"
          onSaveFilters={(options) => setFilterStatusStorage(options)}
        />

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

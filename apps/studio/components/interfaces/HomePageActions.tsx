import { Filter, Grid, List, Plus, Search } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { PROJECT_STATUS } from 'lib/constants'
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
  search: string
  filterStatus: string[]
  hideNewProject?: boolean
  viewMode?: 'grid' | 'table'
  showViewToggle?: boolean
  setSearch: (value: string) => void
  setFilterStatus: (value: string[]) => void
  setViewMode?: (value: 'grid' | 'table') => void
}

export const HomePageActions = ({
  search,
  filterStatus,
  hideNewProject = false,
  viewMode,
  showViewToggle = false,
  setSearch,
  setFilterStatus,
  setViewMode,
}: HomePageActionsProps) => {
  const { slug } = useParams()
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search for a project"
          icon={<Search size={12} />}
          size="tiny"
          className="w-64 pl-8 [&>div>div>div>input]:!pl-7 [&>div>div>div>div]:!pl-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              type={filterStatus.length !== 2 ? 'secondary' : 'dashed'}
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
                  <div key={key} className="group flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-x-2">
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
                      <Label_Shadcn_ htmlFor={key} className="capitalize text-xs">
                        {label}
                      </Label_Shadcn_>
                    </div>
                    <Button
                      size="tiny"
                      type="default"
                      onClick={() => setFilterStatus([key])}
                      className="transition opacity-0 group-hover:opacity-100 h-auto px-1 py-0.5"
                    >
                      Select only
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
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

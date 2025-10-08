import { RotateCcw, Settings2Icon, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  DropdownMenuLabel,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

import { CommandGroup } from '@ui/components/shadcn/ui/command'
import { useDebounce } from '@uidotdev/usehooks'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'
import { useNotificationsStateSnapshot } from 'state/notifications'
import { CriticalIcon, WarningIcon } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

// [Joshen] Opting to not use infinite loading for projects in this UI specifically
// since the UX feels quite awkward having infinite loading for just a specific section in this Popover

export const NotificationsFilter = ({ activeTab }: { activeTab: 'inbox' | 'archived' }) => {
  const [open, setOpen] = useState(false)
  const snap = useNotificationsStateSnapshot()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const { data: organizations } = useOrganizationsQuery()
  const { data } = useProjectsInfiniteQuery(
    { search: search.length === 0 ? search : debouncedSearch },
    { keepPreviousData: true }
  )
  const projects = useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []
  const projectCount = data?.pages[0].pagination.count ?? 0
  const pageLimit = data?.pages[0].pagination.limit ?? 0

  return (
    <Popover_Shadcn_ modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={snap.numFiltersApplied > 0 ? 'default' : 'text'}
          icon={<Settings2Icon strokeWidth={1} />}
          className="px-1 h-[26px]"
        >
          {snap.numFiltersApplied > 0 &&
            `${snap.numFiltersApplied} filter${snap.numFiltersApplied > 1 ? 's' : ''} applied`}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="end">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find filter..." />

          <CommandEmpty_Shadcn_>No filters found that match your search</CommandEmpty_Shadcn_>

          <CommandList_Shadcn_>
            <ScrollArea className="max-h-[240px] py-1 overflow-y-auto">
              <CommandGroup_Shadcn_>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <CommandItem_Shadcn_
                  disabled={activeTab === 'archived'}
                  onSelect={() => {
                    snap.setFilters('unread', 'status')
                  }}
                >
                  <Label_Shadcn_
                    htmlFor={'unread'}
                    className={cn(
                      'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
                      snap.filterStatuses.includes('unread') && 'text-foreground'
                    )}
                  >
                    <Checkbox_Shadcn_
                      name="unread"
                      checked={snap.filterStatuses.includes('unread')}
                    />
                    Unread
                  </Label_Shadcn_>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>

              <CommandSeparator_Shadcn_ />

              <CommandGroup_Shadcn_>
                <DropdownMenuLabel>Priority</DropdownMenuLabel>
                <CommandItem_Shadcn_
                  onSelect={() => {
                    snap.setFilters('Warning', 'priority')
                  }}
                  className="flex items-center gap-x-2"
                >
                  <Label_Shadcn_
                    htmlFor={'warning'}
                    className={cn(
                      'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
                      snap.filterPriorities.includes('Warning') && 'text-foreground'
                    )}
                  >
                    <Checkbox_Shadcn_
                      name="warning"
                      checked={snap.filterPriorities.includes('Warning')}
                    />
                    <WarningIcon className="size-4" />
                    Warning
                  </Label_Shadcn_>
                </CommandItem_Shadcn_>
                <CommandItem_Shadcn_
                  key={'critical'}
                  onSelect={() => {
                    snap.setFilters('Critical', 'priority')
                  }}
                >
                  <Label_Shadcn_
                    htmlFor={'critical'}
                    className={cn(
                      'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
                      snap.filterPriorities.includes('Critical') && 'text-foreground'
                    )}
                  >
                    <Checkbox_Shadcn_
                      name="critical"
                      checked={snap.filterPriorities.includes('Critical')}
                    />
                    <CriticalIcon className="size-4" />
                    Critical
                  </Label_Shadcn_>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>

              <CommandSeparator_Shadcn_ />

              <CommandGroup_Shadcn_>
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                {(organizations ?? []).map((org) => (
                  <CommandItem_Shadcn_
                    key={org.slug}
                    value={org.name.replaceAll('"', '')}
                    className="flex items-center gap-x-2"
                    onSelect={() => {
                      snap.setFilters(org.slug, 'organizations')
                    }}
                  >
                    <Label_Shadcn_
                      htmlFor={`${org.slug}`}
                      className={cn(
                        'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
                        snap.filterOrganizations.includes(org.slug) && 'text-foreground'
                      )}
                    >
                      <Checkbox_Shadcn_
                        name={`${org.slug}`}
                        checked={snap.filterOrganizations.includes(org.slug)}
                      />
                      {org.name}
                    </Label_Shadcn_>
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>

              <CommandSeparator_Shadcn_ />

              <CommandGroup_Shadcn_>
                <DropdownMenuLabel>Projects</DropdownMenuLabel>
                {/* 
                  [Joshen] Adding a separate search input field here for projects as the
                  top level CommandInput doesn't work well with a mix of sync and async data
                */}
                <div className="px-2 mb-2">
                  <Input
                    size="tiny"
                    className="rounded"
                    placeholder="Search for a project"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    actions={
                      search.length > 0 ? (
                        <X
                          size={14}
                          className="cursor-pointer mr-1"
                          onClick={() => setSearch('')}
                        />
                      ) : null
                    }
                  />
                </div>
                {(projects ?? []).map((project) => (
                  <CommandItem_Shadcn_
                    key={project.ref}
                    value={project.ref}
                    className="flex items-center gap-x-2"
                    onSelect={() => {
                      snap.setFilters(project.ref, 'projects')
                    }}
                  >
                    <Label_Shadcn_
                      htmlFor={`${project.ref}`}
                      className={cn(
                        'flex items-center gap-x-2 text-xs text-foreground-light transition-colors',
                        snap.filterProjects.includes(project.ref) && 'text-foreground'
                      )}
                    >
                      <Checkbox_Shadcn_
                        name={`${project.ref}`}
                        checked={snap.filterProjects.includes(project.ref)}
                      />
                      {project.name}
                    </Label_Shadcn_>
                  </CommandItem_Shadcn_>
                ))}
                {projectCount > pageLimit && (
                  <p className="text-foreground-lighter text-xs pt-2 px-2">
                    Not all projects are shown here. Try searching to find a specific project.
                  </p>
                )}
              </CommandGroup_Shadcn_>
            </ScrollArea>

            <CommandSeparator_Shadcn_ />

            <CommandGroup>
              <CommandItem_Shadcn_
                onSelect={() => snap.resetFilters()}
                className="flex gap-x-2 items-center"
              >
                <RotateCcw size={12} />
                Reset filters
              </CommandItem_Shadcn_>
            </CommandGroup>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

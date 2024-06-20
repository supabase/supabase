import { RotateCcw, Settings2Icon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
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
import { CriticalIcon, WarningIcon } from 'ui'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useNotificationsStateSnapshot } from 'state/notifications'

export const NotificationsFilter = ({ activeTab }: { activeTab: 'inbox' | 'archived' }) => {
  const [open, setOpen] = useState(false)
  const snap = useNotificationsStateSnapshot()

  const { data: organizations } = useOrganizationsQuery()
  const { data: projects } = useProjectsQuery()

  return (
    <Popover_Shadcn_ modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={snap.numFiltersApplied > 0 ? 'default' : 'text'}
          icon={<Settings2Icon size={14} strokeWidth={1} />}
          className="px-1 h-[26px]"
        >
          {snap.numFiltersApplied > 0 &&
            `${snap.numFiltersApplied} filter${snap.numFiltersApplied > 1 ? 's' : ''} applied`}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="end">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find filter..." />
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
                  ></Checkbox_Shadcn_>
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
                  ></Checkbox_Shadcn_>
                  <WarningIcon className="w-2 h-2" />
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
                  ></Checkbox_Shadcn_>
                  <CriticalIcon className="w-2 h-2" />
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
                      className=""
                    ></Checkbox_Shadcn_>
                    {org.name}
                  </Label_Shadcn_>
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              {(projects ?? []).map((project) => (
                <CommandItem_Shadcn_
                  key={project.ref}
                  className="flex items-center gap-x-2"
                  onSelect={(event) => {
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
                      className=""
                    ></Checkbox_Shadcn_>
                    {project.name}
                  </Label_Shadcn_>
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </ScrollArea>
          <CommandSeparator_Shadcn_ />
          <CommandGroup>
            <CommandItem_Shadcn_
              onSelect={() => snap.resetFilters()}
              className="flex gap-x-2 items-center"
            >
              <RotateCcw className="text-foreground-muted" size={12} strokeWidth={1} />
              Reset filters
            </CommandItem_Shadcn_>
          </CommandGroup>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

import { Settings2Icon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Separator,
} from 'ui'
import { CriticalIcon, WarningIcon } from './NotificationsPopover.constants'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useNotificationsStateSnapshot } from 'state/notifications'

export const NotificationsFilter = ({ activeTab }: { activeTab: 'inbox' | 'archived' }) => {
  const [open, setOpen] = useState(false)
  const snap = useNotificationsStateSnapshot()

  const { data: organizations } = useOrganizationsQuery()
  const { data: projects } = useProjectsQuery()

  return (
    <Popover_Shadcn_ modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          type={snap.numFiltersApplied > 0 ? 'default' : 'text'}
          icon={<Settings2Icon size={14} />}
          className="px-1"
        >
          {snap.numFiltersApplied > 0 &&
            `${snap.numFiltersApplied} filter${snap.numFiltersApplied > 1 ? 's' : ''} applied`}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="end">
        <div className="p-2">
          <p className="text-xs text-foreground-light">Filter notifications</p>
        </div>
        <Separator />

        <ScrollArea className="h-[240px]">
          <div className="p-2 flex flex-col gap-y-2">
            <p className="text-xs">Status</p>
            <div className="flex items-center gap-x-2">
              <Checkbox_Shadcn_
                disabled={activeTab === 'archived'}
                checked={snap.filterStatuses.includes('unread')}
                onCheckedChange={() => snap.setFilters('unread', 'status')}
              />
              <p className={`text-xs ${activeTab === 'archived' ? 'opacity-50' : ''}`}>Unread</p>
            </div>
          </div>
          <Separator />
          <div className="p-2 flex flex-col gap-y-2">
            <p className="text-xs">Priority</p>
            <div className="flex items-center gap-x-2">
              <Checkbox_Shadcn_
                checked={snap.filterPriorities.includes('Warning')}
                onCheckedChange={() => snap.setFilters('Warning', 'priority')}
              />
              <WarningIcon className="w-2 h-2" />
              <p className="text-xs">Warning</p>
            </div>
            <div className="flex items-center gap-x-2">
              <Checkbox_Shadcn_
                checked={snap.filterPriorities.includes('Critical')}
                onCheckedChange={() => snap.setFilters('Critical', 'priority')}
              />
              <CriticalIcon className="w-2 h-2" />
              <p className="text-xs">Critical</p>
            </div>
          </div>
          <Separator />
          <div className="p-2 flex flex-col gap-y-2">
            <p className="text-xs">Organizations</p>
            {(organizations ?? []).map((org) => (
              <div key={org.slug} className="flex items-center gap-x-2">
                <Checkbox_Shadcn_
                  checked={snap.filterOrganizations.includes(org.slug)}
                  onCheckedChange={() => snap.setFilters(org.slug, 'organizations')}
                />
                <p className="text-xs">{org.name}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="p-2 flex flex-col gap-y-2">
            <p className="text-xs">Projects</p>
            {(projects ?? []).map((project) => (
              <div key={project.ref} className="flex items-center gap-x-2">
                <Checkbox_Shadcn_
                  checked={snap.filterProjects.includes(project.ref)}
                  onCheckedChange={() => snap.setFilters(project.ref, 'projects')}
                />
                <p className="text-xs">{project.name}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />
        <div className="p-2 flex justify-end">
          <Button type="default" onClick={() => snap.resetFilters()}>
            Reset filters
          </Button>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

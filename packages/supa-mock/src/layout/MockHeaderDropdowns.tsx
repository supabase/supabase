import {
  Box,
  Boxes,
  Check,
  ChevronsUpDown,
  GitBranch,
  ListFilter,
  MessageCircle,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import type { MockProject, SupaMockOrganization } from '../types'

// ─── Organization Dropdown ──────────────────────────────────────────────

export function OrgDropdown({
  project,
  organizations,
}: {
  project: MockProject
  organizations: SupaMockOrganization[]
}) {
  const [open, setOpen] = useState(false)
  const hasOrgs = organizations.length > 0

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <button className="flex items-center gap-2 flex-shrink-0 text-sm cursor-pointer">
          <Boxes size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          <span className="text-foreground">{project.organization.name}</span>
          <Badge variant="default">{project.organization.plan}</Badge>
          <ChevronsUpDown size={16} strokeWidth={1.5} className="text-foreground-muted" />
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find organization..." />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              {hasOrgs ? (
                organizations.map((org) => {
                  const isCurrent =
                    org.slug === project.organization.slug ||
                    org.name === project.organization.name
                  return (
                    <CommandItem_Shadcn_
                      key={org.slug}
                      onSelect={() => {
                        window.open(
                          `https://supabase.com/dashboard/org/${org.slug}`,
                          '_blank',
                          'noopener,noreferrer'
                        )
                        setOpen(false)
                      }}
                      className="flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="truncate">{org.name}</span>
                      {isCurrent && (
                        <Check size={14} strokeWidth={2} className="flex-shrink-0" />
                      )}
                    </CommandItem_Shadcn_>
                  )
                })
              ) : (
                <CommandItem_Shadcn_ className="flex items-center justify-between gap-2">
                  <span>{project.organization.name}</span>
                  <Check size={14} strokeWidth={2} className="flex-shrink-0" />
                </CommandItem_Shadcn_>
              )}
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="cursor-pointer">
                All Organizations
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center gap-2 cursor-pointer">
                <Plus size={14} strokeWidth={1.5} />
                <span>New organization</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

// ─── Project Dropdown ───────────────────────────────────────────────────

export function ProjectDropdown({ project }: { project: MockProject }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <button className="flex items-center gap-2 flex-shrink-0 text-sm cursor-pointer">
          <Box size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          <span className="text-foreground">{project.name}</span>
          <ChevronsUpDown size={16} strokeWidth={1.5} className="text-foreground-muted" />
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Find project..." />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center justify-between gap-2">
                <span>{project.name}</span>
                <Check size={14} strokeWidth={2} className="flex-shrink-0" />
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center gap-2 cursor-pointer">
                <Plus size={14} strokeWidth={1.5} />
                <span>New project</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

// ─── Branch Dropdown ────────────────────────────────────────────────────

export function BranchDropdown({ project }: { project: MockProject }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <button className="flex items-center gap-2 flex-shrink-0 text-sm cursor-pointer">
          <span className="text-foreground">{project.branchName}</span>
          <Badge variant="warning" className="mt-[1px]">
            Production
          </Badge>
          <ChevronsUpDown size={16} strokeWidth={1.5} className="text-foreground-muted" />
        </button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="p-0 w-64" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} strokeWidth={1.5} className="text-warning" />
                  <span>{project.branchName}</span>
                </div>
                <Check size={14} strokeWidth={2} className="flex-shrink-0" />
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center gap-2 cursor-pointer">
                <Plus size={14} strokeWidth={1.5} />
                <span>Create branch</span>
              </CommandItem_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center gap-2 cursor-pointer">
                <ListFilter size={14} strokeWidth={1.5} />
                <span>Manage branches</span>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="flex items-center gap-2 cursor-pointer">
                <MessageCircle size={14} strokeWidth={1.5} />
                <div className="flex flex-col">
                  <span>Branching feedback</span>
                  <span className="text-xs text-foreground-lighter">Join GitHub Discussion</span>
                </div>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

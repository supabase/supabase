import { Box, ChevronsUpDown } from 'lucide-react'
import { useId, useState } from 'react'
import {
  Checkbox,
  cn,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from 'ui'

import type { OAuthAppsAuthorizeOrganizationProject } from '@/data/oauth-apps/oauth-apps-authorize-organization-projects-query'

const MAX_SELECTED_PROJECTS = 10
const SHOW_COUNTER_FROM = 8

export interface ProjectMultiSelectProps {
  projects: OAuthAppsAuthorizeOrganizationProject[]
  selectedRefs: string[]
  onChange: (selectedRefs: string[]) => void
  error?: string
}

export const ProjectMultiSelect = ({
  projects,
  selectedRefs,
  onChange,
  error,
}: ProjectMultiSelectProps) => {
  const [open, setOpen] = useState(false)
  const listId = useId()

  const atCap = selectedRefs.length >= MAX_SELECTED_PROJECTS
  const showCounter = selectedRefs.length >= SHOW_COUNTER_FROM

  const toggleProject = (ref: string) => {
    const isSelected = selectedRefs.includes(ref)
    if (!isSelected && atCap) return

    onChange(
      isSelected
        ? selectedRefs.filter((selectedRef) => selectedRef !== ref)
        : [...selectedRefs, ref]
    )
  }

  const triggerLabel =
    selectedRefs.length === 0
      ? 'Select projects...'
      : `${selectedRefs.length} project${selectedRefs.length === 1 ? '' : 's'}`

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-foreground">Projects</p>
        {showCounter && (
          <p className="text-xs text-foreground-lighter">
            {selectedRefs.length}/{MAX_SELECTED_PROJECTS}
          </p>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <button
            type="button"
            role="combobox"
            tabIndex={0}
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen(!open)}
            className="flex h-7 w-full items-center gap-2 rounded-md border border-control px-3 text-sm hover:border-control-hover focus-ring"
          >
            <Box size={16} className="shrink-0 text-foreground-lighter" />
            <span
              className={cn(
                'flex-1 truncate text-left',
                selectedRefs.length === 0 ? 'text-foreground-lighter' : 'text-foreground'
              )}
            >
              {triggerLabel}
            </span>
            <ChevronsUpDown size={16} className="shrink-0 text-foreground-lighter" />
          </button>
        </PopoverAnchor>
        <PopoverContent sameWidthAsTrigger align="start" className="p-0">
          <Command>
            <CommandInput placeholder="Search projects" />
            <CommandList id={listId}>
              <CommandEmpty>No projects found</CommandEmpty>
              {projects.map((project) => {
                const isSelected = selectedRefs.includes(project.ref)
                const isDisabled = atCap && !isSelected

                return (
                  <CommandItem
                    key={project.ref}
                    value={project.name}
                    disabled={isDisabled}
                    onSelect={() => toggleProject(project.ref)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={() => toggleProject(project.ref)}
                    />
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {atCap && (
        <p className="text-xs text-foreground-lighter">
          Maximum reached. Deselect a project to choose a different one.
        </p>
      )}
      {error && <p className="text-xs text-foreground-light">{error}</p>}
    </div>
  )
}

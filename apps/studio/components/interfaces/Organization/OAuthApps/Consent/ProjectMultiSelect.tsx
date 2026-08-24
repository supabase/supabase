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

  const toggleProject = (ref: string) => {
    onChange(
      selectedRefs.includes(ref)
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
      <p className="text-xs text-foreground">Projects</p>
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
              {projects.map((project) => (
                <CommandItem
                  key={project.ref}
                  value={project.name}
                  onSelect={() => toggleProject(project.ref)}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={selectedRefs.includes(project.ref)}
                    onCheckedChange={() => toggleProject(project.ref)}
                  />
                  <span className="truncate">{project.name}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-foreground-light">{error}</p>}
    </div>
  )
}

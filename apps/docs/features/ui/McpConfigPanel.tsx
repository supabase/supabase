'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { McpConfigPanel as McpConfigPanelBase } from 'ui-patterns/McpUrlBuilder'
import { useProjectsQuery } from '~/lib/fetch/projects'

function ProjectSelector({
  className,
  selectedProject,
  onProjectSelect,
}: {
  className?: string
  selectedProject?: { ref: string; name: string } | null
  onProjectSelect?: (project: { ref: string; name: string } | null) => void
}) {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()
  const { data: projects, isLoading, isError } = useProjectsQuery({ enabled: isLoggedIn })

  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn('flex', className)}>
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          Project
        </span>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            size="small"
            type="default"
            className="gap-0 rounded-l-none"
            iconRight={
              <ChevronDown
                strokeWidth={1.5}
                className={cn('transition-transform duration-200', open && 'rotate-180')}
              />
            }
          >
            <div className="flex items-center gap-2">
              {isUserLoading || isLoading
                ? 'Loading projects...'
                : !isLoggedIn
                  ? 'Log in to choose a project'
                  : isError
                    ? 'Error fetching projects'
                    : selectedProject?.name ?? 'Select a project'}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
      </div>
      <PopoverContent_Shadcn_ className="mt-0 p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search..." />
          <CommandList_Shadcn_>
            <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {projects?.map((project) => (
                <CommandItem_Shadcn_
                  key={project.ref}
                  value={project.ref}
                  onSelect={() => {
                    onProjectSelect?.(project)
                    setOpen(false)
                  }}
                  className="flex gap-2 items-center"
                >
                  {project.name}
                  <Check
                    aria-label={project.ref === selectedProject?.ref ? 'selected' : undefined}
                    size={15}
                    className={cn(
                      'ml-auto',
                      project.ref === selectedProject?.ref ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export function McpConfigPanel() {
  const [selectedProject, setSelectedProject] = useState<{ ref: string; name: string } | null>(null)

  return (
    <div className="not-prose">
      <ProjectSelector
        className="mb-3"
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
      />
      <p className="text-xs text-foreground-lighter">
        Scope the MCP server to a project. If no project is selected, all projects will be
        accessible.
      </p>
      <McpConfigPanelBase basePath="/docs" className="mt-6" projectRef={selectedProject?.ref} />
    </div>
  )
}

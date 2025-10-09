'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
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
import { Admonition } from 'ui-patterns'
import { McpConfigPanel as McpConfigPanelBase } from 'ui-patterns/McpUrlBuilder'
import { useProjectsQuery } from '~/lib/fetch/projects'

type PlatformType = (typeof PLATFORMS)[number]['value']

const PLATFORMS = [
  { value: 'hosted', label: 'Hosted' },
  { value: 'local', label: 'CLI' },
] as const satisfies Array<{ value: string; label: string }>

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

        {!isUserLoading && !isLoggedIn ? (
          <Button size="small" type="default" className="gap-0 rounded-l-none" asChild>
            <Link href="https://supabase.com/dashboard" rel="noreferrer noopener" target="_blank">
              <div className="flex items-center gap-2">Log in to choose a project</div>
            </Link>
          </Button>
        ) : (
          <PopoverTrigger_Shadcn_ asChild disabled={isUserLoading || isLoading || isError}>
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
                  : isError
                    ? 'Error fetching projects'
                    : selectedProject?.name ?? 'Select a project'}
              </div>
            </Button>
          </PopoverTrigger_Shadcn_>
        )}
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
                    onProjectSelect?.(project.ref === selectedProject?.ref ? null : project)
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

function PlatformSelector({
  className,
  selectedPlatform,
  onPlatformSelect,
}: {
  className?: string
  selectedPlatform: PlatformType
  onPlatformSelect?: (platform: PlatformType) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn('flex', className)}>
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          Platform
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
              {PLATFORMS.find((p) => p.value === selectedPlatform)?.label}
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
      </div>
      <PopoverContent_Shadcn_ className="mt-0 p-0 max-w-48" side="bottom" align="start">
        <Command_Shadcn_>
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              {PLATFORMS.map((platform) => (
                <CommandItem_Shadcn_
                  key={platform.value}
                  value={platform.value}
                  onSelect={() => {
                    onPlatformSelect?.(platform.value)
                    setOpen(false)
                  }}
                  className="flex gap-2 items-center"
                >
                  {platform.label}
                  <Check
                    aria-label={platform.value === selectedPlatform ? 'selected' : undefined}
                    size={15}
                    className={cn(
                      'ml-auto',
                      platform.value === selectedPlatform ? 'opacity-100' : 'opacity-0'
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
  const [selectedPlatform, setSelectedPlatform] = useState<'hosted' | 'local'>('hosted')
  const { theme } = useTheme()

  const isPlatform = selectedPlatform === 'hosted'
  const project = isPlatform ? selectedProject : null

  return (
    <>
      <div className="not-prose">
        <div className="flex flex-wrap gap-3 mb-3">
          <PlatformSelector
            selectedPlatform={selectedPlatform}
            onPlatformSelect={setSelectedPlatform}
          />
          {isPlatform && (
            <ProjectSelector selectedProject={project} onProjectSelect={setSelectedProject} />
          )}
        </div>
        <p className="text-xs text-foreground-lighter">
          {isPlatform
            ? 'Scope the MCP server to a project. If no project is selected, all projects will be accessible.'
            : 'Project selection is only available for the hosted platform.'}
        </p>
        <McpConfigPanelBase
          basePath="/docs"
          className="mt-6"
          projectRef={project?.ref}
          theme={theme as 'light' | 'dark'}
          isPlatform={isPlatform}
        />
      </div>
      {isPlatform && (
        <Admonition type="note" title="Authentication" className="mt-3">
          <p>
            {
              "Your MCP client will automatically prompt you to login to Supabase during setup. This will open a browser window where you can login to your Supabase account and grant access to the MCP client. Be sure to choose the organization that contains the project you wish to work with. In the future, we'll offer more fine grain control over these permissions."
            }
          </p>
          <p>
            {
              'Previously Supabase MCP required you to generate a personal access token (PAT), but this is no longer required.'
            }
          </p>
        </Admonition>
      )}
    </>
  )
}

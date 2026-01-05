'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Check, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from 'ui'
import { Admonition } from 'ui-patterns'
import {
  createMcpCopyHandler,
  McpConfigPanel as McpConfigPanelBase,
  type McpClient,
} from 'ui-patterns/McpUrlBuilder'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useDebounce } from '~/hooks/useDebounce'
import { useIntersectionObserver } from '~/hooks/useIntersectionObserver'
import { useProjectsInfiniteQuery } from '~/lib/fetch/projects-infinite'
import { useSendTelemetryEvent } from '~/lib/telemetry'

type PlatformType = (typeof PLATFORMS)[number]['value']

const PLATFORMS = [
  { value: 'hosted', label: 'Hosted' },
  { value: 'local', label: 'CLI' },
] as const satisfies Array<{ value: string; label: string }>

// [Joshen] Ideally we consolidate this component with what's in ProjectConfigVariables - they seem to be doing the same thing
function ProjectSelector({
  className,
  selectedProject,
  onProjectSelect,
}: {
  className?: string
  selectedProject?: { ref: string; name: string } | null
  onProjectSelect?: (project: { ref: string; name: string } | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const scrollRootRef = useRef<HTMLDivElement | null>(null)
  const [sentinelRef, entry] = useIntersectionObserver({
    root: scrollRootRef.current,
    threshold: 0,
    rootMargin: '0px',
  })

  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const {
    data: projectsData,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectsInfiniteQuery(
    { search: search.length === 0 ? search : debouncedSearch },
    { enabled: isLoggedIn }
  )
  const projects =
    useMemo(() => projectsData?.pages.flatMap((page) => page.projects), [projectsData?.pages]) || []

  useEffect(() => {
    if (
      !isLoading &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      entry?.isIntersecting &&
      !!fetchNextPage
    ) {
      fetchNextPage()
    }
  }, [isLoading, isFetching, isFetchingNextPage, hasNextPage, entry?.isIntersecting, fetchNextPage])

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(open) => {
        setOpen(open)
        if (!open) setSearch('')
      }}
    >
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
          <PopoverTrigger asChild disabled={isUserLoading || isLoading || isError}>
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
                {selectedProject?.name ??
                  (isUserLoading || isLoading
                    ? 'Loading projects...'
                    : isError
                      ? 'Error fetching projects'
                      : 'Select a project')}
              </div>
            </Button>
          </PopoverTrigger>
        )}
      </div>
      <PopoverContent className="mt-0 p-0 w-56" side="bottom" align="start">
        <Command_Shadcn_ shouldFilter={false}>
          <CommandInput_Shadcn_
            placeholder="Search ..."
            className="h-8"
            showResetIcon
            value={search}
            onValueChange={setSearch}
            handleReset={() => setSearch('')}
          />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_>
              {isLoading ? (
                <div className="px-2 py-1 flex flex-col gap-2">
                  <ShimmeringLoader className="w-full" />
                  <ShimmeringLoader className="w-4/5" />
                </div>
              ) : (
                <>
                  {search.length > 0 && projects.length === 0 && (
                    <p className="text-xs text-center text-foreground-lighter py-3">
                      No projects found based on your search
                    </p>
                  )}
                  <ScrollArea className={projects.length > 7 ? 'h-[210px]' : ''}>
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
                    <div ref={sentinelRef} className="h-1 -mt-1" />
                    {hasNextPage && <ShimmeringLoader className="px-2 py-3" />}
                  </ScrollArea>
                </>
              )}
            </CommandGroup_Shadcn_>
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent>
    </Popover>
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
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn('flex', className)}>
        <span className="flex items-center text-foreground-lighter px-3 rounded-lg rounded-r-none text-xs border border-button border-r-0">
          Platform
        </span>

        <PopoverTrigger asChild>
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
        </PopoverTrigger>
      </div>
      <PopoverContent className="mt-0 p-0 max-w-48" side="bottom" align="start">
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
      </PopoverContent>
    </Popover>
  )
}

export function McpConfigPanel() {
  const [selectedProject, setSelectedProject] = useState<{ ref: string; name: string } | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'hosted' | 'local'>('hosted')
  const [selectedClient, setSelectedClient] = useState<McpClient | null>(null)
  const { resolvedTheme } = useTheme()
  const sendTelemetryEvent = useSendTelemetryEvent()

  const isPlatform = selectedPlatform === 'hosted'
  const project = isPlatform ? selectedProject : null

  const handleCopy = useMemo(
    () =>
      createMcpCopyHandler({
        selectedClient,
        source: 'docs',
        onTrack: (event) => {
          sendTelemetryEvent({
            action: event.action,
            properties: event.properties,
            groups: (event.groups || {}) as any,
          })
        },
        projectRef: project?.ref,
      }),
    [selectedClient, sendTelemetryEvent, project?.ref]
  )

  const handleInstall = () => {
    if (selectedClient?.label) {
      sendTelemetryEvent({
        action: 'mcp_install_button_clicked',
        properties: {
          client: selectedClient.label,
          source: 'docs',
        },
        groups: {
          ...(project?.ref && { project: project.ref }),
        } as any,
      })
    }
  }

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
          theme={resolvedTheme as 'light' | 'dark'}
          isPlatform={isPlatform}
          onCopyCallback={handleCopy}
          onInstallCallback={handleInstall}
          onClientSelect={setSelectedClient}
        />
      </div>
      {isPlatform && (
        <Admonition type="note" title="Authentication" className="mt-3">
          <p>
            {
              "Some MCP clients will automatically prompt you to login during setup, while others may require manual authentication steps. Either authentication method will open a browser window where you can login to your Supabase account and grant organization access to the MCP client. In the future, we'll offer more fine grain control over these permissions."
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

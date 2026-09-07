import { useRouter } from 'next/router'
import { ChevronsUpDown, Database, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  cn,
} from 'ui'
import { useSelfHostedProjects } from '@/hooks/useMultiDatabaseProjects'

function StatusDot({ status }: { status: string }) {
  const isActive = status === 'ACTIVE_HEALTHY' || status === 'running'
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 flex-shrink-0 rounded-full',
        isActive ? 'bg-brand' : 'bg-foreground-muted'
      )}
    />
  )
}

export function SelfHostedProjectSwitcher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = (router.query.ref as string) ?? 'default'
  const { data: projects = [], isLoading } = useSelfHostedProjects()

  const currentProject = projects.find((p) => p.ref === ref) ?? projects[0]
  const hasMultiple = projects.length > 1

  // Single-DB mode — render the plain label same as before
  if (!hasMultiple) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="grid flex-1 text-left text-sm leading-tight text-foreground">
            <span className="truncate">{currentProject?.name ?? 'Default Project'}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  function navigate(targetRef: string) {
    setOpen(false)
    router.push(`/project/${targetRef}`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-overlay-hover"
            >
              <Database size={15} className="flex-shrink-0 text-foreground-light" />
              <div className="min-w-0 flex-1 grid leading-tight">
                <span className="truncate text-sm font-medium text-foreground">
                  {isLoading ? 'Loading…' : (currentProject?.name ?? 'Default Project')}
                </span>
                <span className="truncate text-xs text-foreground-lighter">
                  {currentProject?.ref ?? 'default'}
                </span>
              </div>
              <ChevronsUpDown size={13} className="flex-shrink-0 text-foreground-lighter" />
            </SidebarMenuButton>
          </PopoverTrigger>

          <PopoverContent
            side="right"
            align="start"
            sideOffset={6}
            className="p-0 w-64 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-overlay">
              <p className="text-xs text-foreground-lighter font-medium uppercase tracking-wide">
                Switch database
              </p>
            </div>

            {/* Project list */}
            <div className="py-1 max-h-72 overflow-y-auto">
              {projects.map((project) => {
                const isCurrent = project.ref === ref
                return (
                  <button
                    key={project.ref}
                    onClick={() => navigate(project.ref)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                      'hover:bg-overlay-hover focus-visible:outline-none focus-visible:bg-overlay-hover',
                      isCurrent && 'bg-surface-200'
                    )}
                  >
                    <StatusDot status={project.status} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm truncate',
                        isCurrent ? 'text-foreground font-medium' : 'text-foreground-light'
                      )}>
                        {project.name}
                      </p>
                      <p className="text-xs text-foreground-lighter truncate">{project.ref}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[11px] text-brand font-medium flex-shrink-0">
                        Active
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-overlay py-1">
              <button
                onClick={() => { setOpen(false); router.push('/self-hosted-projects') }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-light',
                  'hover:bg-overlay-hover hover:text-foreground transition-colors',
                  'focus-visible:outline-none focus-visible:bg-overlay-hover'
                )}
              >
                <ExternalLink size={13} className="flex-shrink-0" />
                Manage databases
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

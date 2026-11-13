import { ChevronRightIcon, PlusIcon, RefreshCwIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Input } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import type { AskAgent } from '../common'
import type { Capabilities, Organization, Project } from '../contract'
import { ProjectChecksMenu } from './project-checks-menu'
import { projectStatusBadge } from './project-status'

export interface ProjectListProps {
  projects: Project[]
  organizations: Organization[]
  capabilities: Pick<
    Capabilities,
    'createProject' | 'openResource' | 'readOnly' | 'scopedProjectId'
  >
  isLoading: boolean
  /** A failed load or action, shown above the list. `onRetry` adds a Retry action. */
  error?: { title: string; message: string; onRetry?: () => void }
  /** Short confirmations from the host, e.g. that a check was sent to chat. */
  notices?: string[]
  onOpenProject: (project: Project) => void
  onRefresh?: () => void
  /** Shows Create when the connection can create projects. */
  onCreate?: () => void
  /** Shows Open… for scoped tokens that cannot list the account. */
  onOpenResource?: () => void
  /** Sends a project check to the agent from a row. Omit when the host cannot. */
  onAsk?: AskAgent
  /** True while a check is being sent. */
  isAsking?: boolean
}

function organizationName(organizations: Organization[], project: Project) {
  return (
    organizations.find(
      (org) => org.id === project.organization_id || org.slug === project.organization_slug
    )?.name ??
    project.organization_slug ??
    '—'
  )
}

/** The projects a connection can see, with search and per-project checks for the agent. */
export function ProjectList({
  projects,
  organizations,
  capabilities,
  isLoading,
  error,
  notices = [],
  onOpenProject,
  onRefresh,
  onCreate,
  onOpenResource,
  onAsk,
  isAsking = false,
}: ProjectListProps) {
  const [search, setSearch] = useState('')
  const filtered = projects.filter((p) =>
    `${p.name} ${p.id} ${p.organization_slug ?? ''} ${p.region}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )
  const emptyDescription = search
    ? 'Try a different name, organization, or region.'
    : capabilities.openResource && onOpenResource
      ? 'Using a scoped token? Choose Open… and enter your project reference or organization slug.'
      : 'No projects are available with this connection’s permissions.'

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4 overflow-auto px-6 py-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl text-foreground">Projects</h1>
          <p className="text-sm text-foreground-light">
            Open a project to explore its tables, logs and issues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            size="tiny"
            aria-label="Search projects"
            placeholder="Search projects"
            className="w-56"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {onRefresh && (
            <Button
              variant="text"
              size="tiny"
              aria-label="Refresh projects"
              disabled={isLoading}
              onClick={onRefresh}
              icon={<RefreshCwIcon size={14} />}
            />
          )}
          {capabilities.createProject && onCreate && (
            <Button
              variant="primary"
              size="tiny"
              disabled={isLoading}
              onClick={onCreate}
              icon={<PlusIcon size={14} />}
            >
              Create
            </Button>
          )}
          {capabilities.openResource && onOpenResource && (
            <Button variant="default" size="tiny" disabled={isLoading} onClick={onOpenResource}>
              Open…
            </Button>
          )}
        </div>
      </header>
      {error && (
        <Admonition
          type="warning"
          title={error.title}
          description={`Error: ${error.message}`}
          actions={
            error.onRetry && (
              <Button variant="default" size="tiny" onClick={error.onRetry}>
                Retry
              </Button>
            )
          }
        />
      )}
      {notices.map((notice) => (
        <p
          key={notice}
          role="status"
          className="rounded-md border bg-surface-100 px-3 py-2 text-sm text-foreground-light"
        >
          {notice}
        </p>
      ))}
      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <div
            aria-hidden="true"
            className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem_1rem] gap-3 border-b bg-surface-100 px-4 py-2 text-xs text-foreground-lighter"
          >
            <span>Project</span>
            <span>Organization</span>
            <span>Region</span>
            <span />
            <span />
          </div>
          {filtered.map((project) => (
            // The open button stretches over the row; the checks menu sits above it.
            <div
              key={project.id}
              className="relative grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem_1rem] items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-surface-100"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <button
                  className="truncate text-left text-sm text-foreground after:absolute after:inset-0"
                  onClick={() => onOpenProject(project)}
                >
                  {project.name}
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant={projectStatusBadge(project.status).variant}>
                    {projectStatusBadge(project.status).label}
                  </Badge>
                  <span className="truncate font-mono text-xs text-foreground-lighter">
                    {project.ref ?? project.id}
                  </span>
                </div>
              </div>
              <span className="truncate text-sm text-foreground-light">
                {organizationName(organizations, project)}
              </span>
              <span className="truncate text-sm text-foreground-light">
                {project.region || '—'}
              </span>
              <ProjectChecksMenu
                project={project}
                isBusy={isAsking}
                onRun={onAsk && ((check) => void onAsk({ type: 'project-check', project, check }))}
              />
              <ChevronRightIcon size={16} aria-hidden="true" className="text-foreground-lighter" />
            </div>
          ))}
        </div>
      )}
      {filtered.length === 0 && (
        <EmptyStatePresentational
          icon={SearchIcon}
          title={search ? 'No matching projects' : 'No projects visible'}
          description={emptyDescription}
        />
      )}
      <footer className="text-xs text-foreground-lighter">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        {capabilities.scopedProjectId ? ' · Scoped connection' : ''}
        {capabilities.readOnly ? ' · Read-only connection' : ''}
      </footer>
    </div>
  )
}

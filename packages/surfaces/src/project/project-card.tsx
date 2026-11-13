import { ExternalLinkIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { Project } from '../contract'
import { ButtonTooltip } from '../explorer/button-tooltip'
import { ProjectDetails } from './project-identity'
import { isProjectChanging, projectStatusBadge } from './project-status'

export interface ProjectCardProps {
  project: Project
  /** Shown above the name once known. Slugs are not shown: they rarely read as names. */
  organizationName?: string
  /** Whether the host is following a project that is changing state. Shows a spinner on the badge. */
  isFollowing?: boolean
  /** Whether a status check is in flight. */
  isRefreshing?: boolean
  /** The last status check failed. The card keeps showing the last known status. */
  error?: string
  /** Checks the status now, for hosts that also keep it live. Omit to hide Refresh. */
  onRefresh?: () => void
  /** Opens the project in the Supabase dashboard. Omit to hide the action. */
  onOpenDashboard?: () => void
}

/** Statuses of a new project that is still being set up. */
const SETTING_UP = new Set(['COMING_UP', 'UNKNOWN'])

/** `12s`, `1m 12s`, `1h 3m`. */
export function formatElapsed(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

/** The current time, ticking every second while `isTicking`. */
function useNow(isTicking: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isTicking) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [isTicking])
  return now
}

/**
 * One project and its current status, condensed from Home's header for a
 * conversation: organization, name, status, ref and region. The host updates
 * `project` as the status changes; the badge shows it and screen readers hear each change.
 */
export function ProjectCard({
  project,
  organizationName,
  isFollowing = false,
  isRefreshing = false,
  error,
  onRefresh,
  onOpenDashboard,
}: ProjectCardProps) {
  const status = projectStatusBadge(project.status)
  const isChanging = isProjectChanging(project.status)
  // While a new project sets up, show how long it has been going, from created_at.
  const createdAt = project.created_at ? Date.parse(project.created_at) : NaN
  const isSettingUp = SETTING_UP.has(project.status) && Number.isFinite(createdAt)
  const now = useNow(isSettingUp)
  const details = [
    { label: 'Project ref', value: project.ref ?? project.id },
    { label: 'Region', value: project.region || 'Region unavailable' },
    ...(isSettingUp
      ? [{ label: 'Setup time', value: `Started ${formatElapsed(now - createdAt)} ago` }]
      : []),
  ]

  return (
    <Card className="@container">
      <section aria-labelledby="project-card-title" aria-busy={isRefreshing}>
        <div className="flex flex-col gap-3 p-4 @md:flex-row @md:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {organizationName && (
              <p className="truncate text-xs text-foreground-light">{organizationName}</p>
            )}
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h2 id="project-card-title" className="truncate text-base text-foreground">
                {project.name}
              </h2>
              <Badge variant={status.variant} className="gap-1">
                {isChanging && isFollowing && (
                  <Loader2Icon size={12} aria-hidden="true" className="animate-spin" />
                )}
                {status.label}
              </Badge>
            </div>
            <ProjectDetails details={details} className="text-sm" />
          </div>
          {(onRefresh || onOpenDashboard) && (
            <div className="flex shrink-0 items-center gap-2">
              {onRefresh && (
                <ButtonTooltip
                  variant="default"
                  size="tiny"
                  aria-label="Refresh status"
                  disabled={isRefreshing}
                  icon={<RefreshCwIcon size={14} aria-hidden="true" />}
                  onClick={onRefresh}
                  tooltip={{ content: { side: 'bottom', text: 'Refresh status' } }}
                />
              )}
              {onOpenDashboard && (
                <Button
                  variant="default"
                  size="tiny"
                  icon={<ExternalLinkIcon size={14} aria-hidden="true" />}
                  onClick={onOpenDashboard}
                >
                  Open in dashboard
                </Button>
              )}
            </div>
          )}
        </div>
        {/* The badge is not announced when it changes; this is. Always rendered. */}
        <p role="status" className="sr-only">
          {`Status: ${status.label}`}
        </p>
        {error && (
          <div className="px-4 pb-4">
            <Admonition
              type="warning"
              title="Failed to check project status"
              description={`Error: ${error}`}
              actions={
                onRefresh && (
                  <Button variant="default" size="tiny" disabled={isRefreshing} onClick={onRefresh}>
                    Retry
                  </Button>
                )
              }
            />
          </div>
        )}
      </section>
    </Card>
  )
}

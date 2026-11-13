import { Badge, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { Capabilities, Project, Traffic } from '../contract'
import { compactNumber, fullNumber } from './project-format'
import { projectStatusBadge } from './project-status'

/** The project's identity: organization, name, and where and how this connection reaches it. */
export function ProjectHero({
  project,
  organizationName,
  capabilities,
}: {
  project: Project
  /** Shown above the name. Falls back to the organization slug. */
  organizationName?: string
  capabilities: Capabilities
}) {
  const status = projectStatusBadge(project.status)
  const organization = organizationName ?? project.organization_slug
  const details = [
    { label: 'Project ref', value: project.ref ?? project.id },
    { label: 'Region', value: project.region || 'Region unavailable' },
    { label: 'Access', value: capabilities.readOnly ? 'Read-only' : 'Read and write' },
  ]
  return (
    <header className="flex flex-col gap-1">
      {organization && <p className="text-sm text-foreground-light">{organization}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="break-words text-2xl text-foreground">{project.name}</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <ProjectDetails details={details} className="mt-1 text-sm" />
    </header>
  )
}

/** A dot-separated row of labelled values, such as ref · region. Labels are for screen readers. */
export function ProjectDetails({
  details,
  className,
}: {
  details: { label: string; value: string }[]
  className?: string
}) {
  return (
    <dl
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground-light', className)}
    >
      {details.map((detail, index) => (
        <div key={detail.label} className="flex min-w-0 items-center gap-x-2">
          {index > 0 && (
            <span aria-hidden="true" className="text-foreground-muted">
              ·
            </span>
          )}
          <dt className="sr-only">{detail.label}</dt>
          <dd className="truncate">{detail.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Explains why parts of Home are limited, so missing data is never mistaken for health. */
export function ProjectLimits({
  project,
  capabilities,
}: {
  project: Project
  capabilities: Capabilities
}) {
  const isPaused = project.status === 'INACTIVE'
  const hasNoDatabase = !capabilities.database
  if (!isPaused && !hasNoDatabase) return null
  return (
    <Admonition type="note">
      {isPaused && (
        <p>This project is paused. Activity and issues may be unavailable until it’s restored.</p>
      )}
      {hasNoDatabase && <p>This connection doesn’t include database access.</p>}
    </Admonition>
  )
}

interface ProjectStatsProps {
  traffic: Traffic | undefined
  /** Open issues: one per failing check, as on Studio's Issues page. */
  issues: { count: number; isCapped: boolean } | undefined
  users: number | undefined
  isLoading: boolean
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse items-center justify-center gap-0.5 px-3 py-4 text-center">
      <dt className="text-sm text-foreground-light">{label}</dt>
      <dd className="text-lg tabular-nums text-foreground" title={title}>
        {value}
      </dd>
    </div>
  )
}

export function ProjectStats({ traffic, issues, users, isLoading }: ProjectStatsProps) {
  // A missing reading renders as a dash, never as zero.
  return (
    <dl
      aria-busy={isLoading}
      className="grid grid-cols-2 divide-muted rounded-lg border border-muted @xl:grid-cols-4 @xl:divide-x"
    >
      <Stat
        label="Requests · 24h"
        value={traffic ? compactNumber.format(traffic.requests) : '—'}
        title={traffic ? fullNumber.format(traffic.requests) : undefined}
      />
      <Stat
        label="Error rate"
        value={traffic?.errorRate != null ? `${traffic.errorRate.toFixed(2)}%` : '—'}
      />
      <Stat
        label="Issues"
        value={issues ? `${fullNumber.format(issues.count)}${issues.isCapped ? '+' : ''}` : '—'}
      />
      <Stat
        label="Users"
        value={users !== undefined ? compactNumber.format(users) : '—'}
        title={users !== undefined ? fullNumber.format(users) : undefined}
      />
    </dl>
  )
}

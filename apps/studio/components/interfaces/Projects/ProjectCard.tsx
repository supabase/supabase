import { CalendarDays, Database } from 'lucide-react'
import Link from 'next/link'
import { Badge, Card, cn } from 'ui'

export interface StudioProject {
  id: string
  ref: string
  name: string
  schema_name: string
  status: string
  inserted_at: string
  organization_id: number
  cloud_provider: string
  region: string
}

type StatusVariant = 'success' | 'warning' | 'destructive' | 'default'

function getStatusBadgeVariant(status: string): StatusVariant {
  switch (status) {
    case 'ACTIVE_HEALTHY':
      return 'success'
    case 'COMING_UP':
      return 'warning'
    case 'UNHEALTHY':
      return 'destructive'
    case 'REMOVING':
    default:
      return 'default'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE_HEALTHY':
      return 'Active'
    case 'COMING_UP':
      return 'Provisioning'
    case 'UNHEALTHY':
      return 'Unhealthy'
    case 'REMOVING':
      return 'Removing'
    default:
      return status
  }
}

export interface ProjectCardProps {
  project: StudioProject
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const statusVariant = getStatusBadgeVariant(project.status)
  const statusLabel = getStatusLabel(project.status)
  const createdDate = new Date(project.inserted_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/project/${project.ref}`}>
      <Card
        className={cn(
          'p-4 transition-colors cursor-pointer',
          'bg-surface-100 hover:bg-surface-200',
          'border border-default hover:border-foreground-muted'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium text-foreground truncate max-w-[70%]">
            {project.name}
          </h3>
          <Badge variant={statusVariant} className="flex-shrink-0 text-xs">
            {statusLabel}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-foreground-light">
            <Database size={12} className="flex-shrink-0" />
            <span className="font-mono truncate">{project.schema_name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground-light">
            <CalendarDays size={12} className="flex-shrink-0" />
            <span>{createdDate}</span>
          </div>
          <p className="pt-2 text-xs text-brand">
            Open dashboard shortcuts
          </p>
        </div>
      </Card>
    </Link>
  )
}

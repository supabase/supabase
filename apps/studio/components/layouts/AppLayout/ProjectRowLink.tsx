import { ParsedUrlQuery } from 'querystring'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { Badge, cn } from 'ui'

import { sanitizeRoute } from './ProjectDropdown.utils'

export interface ProjectRowLinkProps {
  project: { ref: string; name: string; status?: string }
  selectedRef: string | undefined
  route: string
  routerQueries: ParsedUrlQuery
}

export function ProjectRowLink({
  project,
  selectedRef,
  route,
  routerQueries,
}: ProjectRowLinkProps) {
  const sanitizedRoute = sanitizeRoute(route, routerQueries)
  const href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
  const isSelected = project.ref === selectedRef
  const isPaused = project.status === 'INACTIVE'

  return (
    <Link
      href={href}
      className="w-full flex items-center justify-between p-0.5 md:p-0 text-sm md:text-xs"
    >
      <span className={cn('truncate', isSelected ? 'md:max-w-60' : 'md:max-w-64')}>
        {project.name}
        {isPaused && <Badge className="ml-2">Paused</Badge>}
      </span>
      {isSelected && <Check size={16} />}
    </Link>
  )
}

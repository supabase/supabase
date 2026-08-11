import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  PERMISSION_MODE_LABEL,
  type PermissionCatalogEntry,
  type PermissionMode,
} from '../AccessToken.permissions'
import { TOKEN_ROLE_LABEL, type EntryAccess, type FailingResource } from '../AccessToken.roles'

const MAX_LISTED_RESOURCES = 5
const MAX_LISTED_PROJECT_ROLES = 3

/**
 * One line per failing resource. Members invited to projects (not the org) get their real
 * per-project role spelled out.
 */
export const failingResourceLine = (resource: FailingResource): string => {
  if (resource.projectScopedRoles !== undefined && resource.projectScopedRoles.length > 0) {
    const listed = resource.projectScopedRoles
      .slice(0, MAX_LISTED_PROJECT_ROLES)
      .map((project) => `${TOKEN_ROLE_LABEL[project.role]} on the project ${project.label}`)
      .join(', ')
    const overflow = resource.projectScopedRoles.length - MAX_LISTED_PROJECT_ROLES
    const roles = overflow > 0 ? `${listed}, and ${overflow} more` : listed
    return `${resource.label} — your role is ${roles}`
  }
  if (resource.role === 'member' || resource.role === 'none') {
    return resource.type === 'organization'
      ? `${resource.label} — you don't have an organization-level role`
      : `${resource.label} — you don't have a role on this project`
  }
  return `${resource.label} — your role is ${TOKEN_ROLE_LABEL[resource.role]}`
}

interface ExceedsRoleBadgeProps {
  entry: PermissionCatalogEntry
  mode: PermissionMode
  access: EntryAccess
}

/**
 * "Exceeds your role" pill with a tooltip naming exactly which resources deny the permission and
 * why.
 */
export const ExceedsRoleBadge = ({ entry, mode, access }: ExceedsRoleBadgeProps) => {
  const failingResources = access.failingResources
  const overflowCount = failingResources.length - MAX_LISTED_RESOURCES

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Badge variant="destructive" className="cursor-help">
            Exceeds your role
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-80 space-y-1.5">
        <p className="text-xs">
          {entry.name} ({PERMISSION_MODE_LABEL[mode]}) requires the{' '}
          {TOKEN_ROLE_LABEL[access.requiredRole]} role or above
          {entry.level === 'organization' && ' at the organization level'}. Requests will be denied
          on:
        </p>
        <ul className="text-xs text-foreground-light space-y-0.5">
          {failingResources.slice(0, MAX_LISTED_RESOURCES).map((resource) => (
            <li key={resource.id}>{failingResourceLine(resource)}</li>
          ))}
          {overflowCount > 0 && <li>and {overflowCount} more</li>}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

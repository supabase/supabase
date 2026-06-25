import dayjs from 'dayjs'

import type {
  PendingInvitationAccessGrant,
  TemporaryAccessInviteExpiry,
  TemporaryAccessPostgresTemplate,
} from './TemporaryAccess.types'
import { getRelativeDatetimeByMode } from './TemporaryAccess.utils'

/** Form-only role id — maps to Read-only org role + pending JIT grant on invite. */
export const EXTERNAL_COLLABORATOR_ROLE_ID = '__external_collaborator__' as const

export const EXTERNAL_COLLABORATOR_ROLE_NAME = 'External collaborator'

export const EXTERNAL_COLLABORATOR_ROLE_DESCRIPTION =
  'Project-scoped guest with minimal Studio access and temporary database connections.'

export const POSTGRES_ACCESS_TEMPLATES: Array<{
  id: TemporaryAccessPostgresTemplate
  label: string
  description: string
  postgresRole: string
}> = [
  {
    id: 'read-only',
    label: 'Read-only',
    description: 'SELECT queries via supabase_read_only_user',
    postgresRole: 'supabase_read_only_user',
  },
  {
    id: 'developer',
    label: 'Developer',
    description: 'Read and write via postgres (bypasses row-level security)',
    postgresRole: 'postgres',
  },
]

export const INVITE_EXPIRY_OPTIONS: Array<{
  value: TemporaryAccessInviteExpiry
  label: string
}> = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
]

export function isExternalCollaboratorRole(roleId: string) {
  return roleId === EXTERNAL_COLLABORATOR_ROLE_ID
}

export function getPostgresRoleForTemplate(template: TemporaryAccessPostgresTemplate) {
  return POSTGRES_ACCESS_TEMPLATES.find((item) => item.id === template)?.postgresRole ?? ''
}

function toUnixSeconds(datetimeIso: string) {
  const timestamp = dayjs(datetimeIso).unix()
  return Number.isFinite(timestamp) ? timestamp : undefined
}

export function buildPendingInvitationAccessGrant({
  projectRef,
  postgresTemplate,
  expiry,
}: {
  projectRef: string
  postgresTemplate: TemporaryAccessPostgresTemplate
  expiry: TemporaryAccessInviteExpiry
}): PendingInvitationAccessGrant {
  const postgresRole = getPostgresRoleForTemplate(postgresTemplate)
  const expiresAt = toUnixSeconds(getRelativeDatetimeByMode(expiry))

  if (!postgresRole || typeof expiresAt !== 'number') {
    throw new Error('Invalid pending invitation access grant')
  }

  return {
    project_ref: projectRef,
    roles: [{ role: postgresRole, expires_at: expiresAt }],
  }
}

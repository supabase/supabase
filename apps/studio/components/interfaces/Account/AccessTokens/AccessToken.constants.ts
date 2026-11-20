import { permissions } from '@supabase/shared-types'
import { components } from 'api-types'
import {
  getAction,
  getResource,
  PERMISSION_CATALOG,
  type FgaAction,
} from 'shared-data/scoped-access-token-permissions'

export type ScopedAccessTokenPermission =
  components['schemas']['CreateScopedAccessTokenBody']['permissions'][number]

export const CUSTOM_EXPIRY_VALUE = 'custom'

/** Shared tail for every "this token can no longer be used" message. */
export const TOKEN_DENIED_REMEDIATION =
  'Requests with this token will be denied. Delete this token and create a new one with the resources and permissions you need.'

/** Warning shown on both entry points that create a classic (account-wide) token. */
export const CLASSIC_TOKEN_WARNING = {
  title: 'Access tokens can be used to control your whole account',
  description: 'Be careful when sharing your tokens',
} as const

export const EXPIRES_AT_OPTIONS = {
  hour: { value: 'hour', label: '1 hour' },
  day: { value: 'day', label: '1 day' },
  week: { value: 'week', label: '7 days' },
  month: { value: 'month', label: '30 days' },
  custom: { value: CUSTOM_EXPIRY_VALUE, label: 'Custom' },
} as const

const FGA = permissions.FgaPermissions

const buildPermissionList = () => {
  const list: Array<{
    scope: string
    resource: string
    action: FgaAction
    id: string
  }> = []

  for (const [scope, scopePerms] of Object.entries(FGA)) {
    for (const [key, perm] of Object.entries(scopePerms)) {
      list.push({
        scope: scope.toLowerCase(),
        resource: getResource(key),
        action: getAction(key),
        id: perm.id,
      })
    }
  }

  return list
}

export const PERMISSION_LIST = buildPermissionList()

/**
 * Resources shown in token permission summaries (e.g. the post-creation banner).
 * Titles come from the shared permission catalog so they match the creation form
 * and the generated docs tables.
 */
export const ACCESS_TOKEN_RESOURCES = PERMISSION_CATALOG.map((entry) => ({
  resource: entry.key,
  title: entry.name,
}))

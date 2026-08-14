import { permissions } from '@supabase/shared-types'
import { components } from 'api-types'

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

const getAction = (key: string): string => {
  if (key.endsWith('_READ')) return 'read'
  if (key.endsWith('_WRITE')) return 'write'
  if (key.endsWith('_CREATE')) return 'create'
  if (key.endsWith('_DELETE')) return 'delete'
  return 'read'
}

const getResource = (key: string): string => {
  return key.replace(/_(READ|WRITE|CREATE|DELETE)$/, '').toLowerCase()
}

const buildPermissionList = () => {
  const list: Array<{
    scope: string
    resource: string
    action: string
    id: string
    title: string
  }> = []

  for (const [scope, scopePerms] of Object.entries(FGA)) {
    for (const [key, perm] of Object.entries(scopePerms)) {
      list.push({
        scope: scope.toLowerCase(),
        resource: getResource(key),
        action: getAction(key),
        id: perm.id,
        title: perm.title,
      })
    }
  }

  return list
}

export const PERMISSION_LIST = buildPermissionList()

export const ACCESS_TOKEN_RESOURCES = (() => {
  const resourceMap = new Map<string, { resource: string; title: string; actions: string[] }>()

  for (const p of PERMISSION_LIST) {
    const key = `${p.scope}:${p.resource}`
    if (!resourceMap.has(key)) {
      const cleanTitle = p.title.replace(/^(Read|Manage|Create|Delete)\s+/i, '')
      resourceMap.set(key, { resource: key, title: cleanTitle, actions: [] })
    }
    const entry = resourceMap.get(key)!
    if (!entry.actions.includes(p.action)) {
      entry.actions.push(p.action)
    }
  }

  return Array.from(resourceMap.values())
})()

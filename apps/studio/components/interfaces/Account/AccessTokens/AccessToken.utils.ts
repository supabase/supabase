import dayjs from 'dayjs'
import {
  AccessTokenSort,
  AccessTokenSortColumn,
  AccessTokenSortOrder,
  BaseToken,
} from './AccessToken.types'
import { PERMISSION_LIST, ScopedAccessTokenPermission } from './AccessToken.constants'

export const handleSortChange = (
  currentSort: AccessTokenSort,
  column: AccessTokenSortColumn,
  setSort: (sort: AccessTokenSort) => void
) => {
  const [currentCol, currentOrder] = currentSort.split(':') as [
    AccessTokenSortColumn,
    AccessTokenSortOrder,
  ]
  if (currentCol === column) {
    if (currentOrder === 'asc') {
      setSort(`${column}:desc` as AccessTokenSort)
    } else {
      setSort('created_at:desc')
    }
  } else {
    setSort(`${column}:asc` as AccessTokenSort)
  }
}

export const filterAndSortTokens = <T extends BaseToken>(
  tokens: T[] | undefined,
  searchString: string,
  sort: AccessTokenSort
): T[] | undefined => {
  const filtered = !searchString
    ? tokens
    : tokens?.filter((token) => token.name.toLowerCase().includes(searchString.toLowerCase()))

  if (!filtered) return filtered

  const [sortCol, sortOrder] = sort.split(':') as [AccessTokenSortColumn, AccessTokenSortOrder]
  const orderMultiplier = sortOrder === 'asc' ? 1 : -1

  return [...filtered].sort((a, b) => {
    if (sortCol === 'created_at') {
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * orderMultiplier
    }
    if (sortCol === 'last_used_at') {
      if (!a.last_used_at && !b.last_used_at) return 0
      if (!a.last_used_at) return 1
      if (!b.last_used_at) return -1
      return (
        (new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()) * orderMultiplier
      )
    }
    if (sortCol === 'expires_at') {
      if (!a.expires_at && !b.expires_at) return 0
      if (!a.expires_at) return 1
      if (!b.expires_at) return -1
      return (new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()) * orderMultiplier
    }
    return 0
  })
}

export const mapPermissionToFGA = (
  resourceKey: string,
  action: string
): ScopedAccessTokenPermission[] => {
  const [scope, resource] = resourceKey.split(':')
  const match = PERMISSION_LIST.find(
    (p) => p.scope === scope && p.resource === resource && p.action === action
  )
  return match ? [match.id as ScopedAccessTokenPermission] : []
}

// [kemal]: Not sure how efficient this will be, but it should get permissions from shared types and transform them whenever @supabase/shared-types updates.
export const getResourcePermissions = (
  resourceKey: string
): Record<string, ScopedAccessTokenPermission[]> => {
  const [scope, resource] = resourceKey.split(':')
  const result: Record<string, ScopedAccessTokenPermission[]> = { 'no access': [] }

  PERMISSION_LIST.filter((p) => p.scope === scope && p.resource === resource).forEach((p) => {
    result[p.action] = [p.id as ScopedAccessTokenPermission]
  })

  if (result['read'] && result['write']) {
    result['read-write'] = [...result['read'], ...result['write']]
  }

  return result
}

export const getRealAccess = (resource: string, tokenPermissions: string[]) => {
  const resourcePermissions = getResourcePermissions(resource)
  const actionTypes = ['read', 'write', 'create', 'delete'] as const
  const grantedActions = actionTypes.filter((action) =>
    resourcePermissions[action]?.some((p) => tokenPermissions.includes(p))
  )

  if (grantedActions.length === 0) {
    return 'no access'
  }

  if (grantedActions.length === 1) {
    return grantedActions[0]
  }

  if (
    grantedActions.length === 2 &&
    grantedActions[0] === 'read' &&
    grantedActions[1] === 'write'
  ) {
    return 'read-write'
  }

  return grantedActions.join('-')
}

export const formatAccessText = (action: string): string => {
  switch (action) {
    case 'no access':
      return 'No access'
    default:
      return action
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('-')
  }
}

export const getExpirationDate = (key: string): string | undefined => {
  switch (key) {
    case 'hour':
      return dayjs().add(1, 'hours').toISOString()
    case 'day':
      return dayjs().add(1, 'day').toISOString()
    case 'week':
      return dayjs().add(7, 'days').toISOString()
    case 'month':
      return dayjs().add(30, 'days').toISOString()
    case 'never':
      return undefined
    default:
      return undefined
  }
}

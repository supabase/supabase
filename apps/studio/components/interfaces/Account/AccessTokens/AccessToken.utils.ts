import { AccessTokenSort, AccessTokenSortColumn, AccessTokenSortOrder, BaseToken } from './AccessToken.types'
import { z } from 'zod'

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

export const PermissionRowSchema = z.object({
  resource: z.string().min(1, 'Please select a resource'),
  action: z.string().min(1, 'Please select an action'),
})

export const TokenSchema = z.object({
  tokenName: z.string().min(1, 'Please enter a name for the token'),
  expiresAt: z.preprocess((val) => (val === 'never' ? undefined : val), z.string().optional()),
  resourceAccess: z.enum(['all-orgs', 'selected-orgs', 'selected-projects']),
  selectedOrganizations: z.array(z.string()).optional(),
  selectedProjects: z.array(z.string()).optional(),
  permissionRows: z.array(PermissionRowSchema).min(1, 'Please configure at least one permission'),
})

export type TokenFormValues = z.infer<typeof TokenSchema>
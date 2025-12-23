'use client'

import { useMemo } from 'react'
import { Users } from 'lucide-react'
import { useParams } from 'common'
import { useUsersInfiniteQuery, type User } from 'data/auth/users-infinite-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getDisplayName } from 'components/interfaces/Auth/Users/Users.utils'
import { UUIDV4_LEFT_PREFIX_REGEX } from 'components/interfaces/Auth/Users/Users.constants'
import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

interface UserSearchResultsProps {
  query: string
}

export function UserSearchResults({ query }: UserSearchResultsProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const hasQueryInput = query.trim().length > 0
  const trimmedQuery = query.trim()

  // Detect if query looks like a UUID and use optimized ID column search
  const searchColumn: OptimizedSearchColumns | undefined = useMemo(() => {
    if (!trimmedQuery) return undefined

    // Check if it matches UUID prefix pattern (for partial UUIDs and full UUIDs)
    // This regex handles both prefixes and full UUIDs - same as UsersV2.tsx
    const isUUIDPattern = UUIDV4_LEFT_PREFIX_REGEX.test(trimmedQuery)

    // If query matches UUID pattern (full or prefix), use optimized ID column search
    // The backend will detect full UUIDs and use exact match: id = '${keywords}'
    if (isUUIDPattern) {
      return 'id'
    }
    // Otherwise use freeform search to search across all columns
    return undefined
  }, [trimmedQuery])

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: trimmedQuery,
      column: searchColumn,
      sort: 'id',
      order: 'asc',
    },
    {
      enabled: hasQueryInput,
    }
  )

  // Transform users to SearchResult format
  const userResults: SearchResult[] = useMemo(() => {
    if (!usersData?.pages) return []
    const users = usersData.pages.flatMap((page) => page.result) ?? []
    return users
      .filter((user: User): user is User & { id: string } => Boolean(user.id)) // Filter out users without IDs
      .slice(0, 10)
      .map((user) => {
        const displayName = getDisplayName(user, '')
        const name = user.email || user.phone || displayName || 'User'
        const description = `User ID: ${user.id.slice(0, 8)}...`
        return {
          id: user.id,
          name,
          description,
        }
      })
  }, [usersData])

  // Show empty state immediately if no query
  if (!query.trim()) {
    return <EmptyState icon={Users} label="Users" query="" />
  }

  if (isLoadingUsers) {
    return <SkeletonResults />
  }

  if (isErrorUsers) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
        <Users className="h-6 w-6" strokeWidth={1.5} />
        <p className="text-sm">Failed to load users</p>
      </div>
    )
  }

  if (userResults.length === 0) {
    return <EmptyState icon={Users} label="Users" query={query} />
  }

  return (
    <ResultsList
      results={userResults}
      icon={Users}
      getRoute={(result) => `/project/${projectRef}/auth/users?show=${result.id}` as `/${string}`}
    />
  )
}

'use client'

import { useMemo } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useUsersInfiniteQuery, type User } from 'data/auth/users-infinite-query'
import { useUsersCountQuery } from 'data/auth/users-count-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getDisplayName } from 'components/interfaces/Auth/Users/Users.utils'
import { UUIDV4_LEFT_PREFIX_REGEX } from 'components/interfaces/Auth/Users/Users.constants'
import { formatEstimatedCount } from 'components/grid/components/footer/pagination/Pagination.utils'
import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'
import Link from 'next/link'

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

  // Fetch user count for footer display - always enabled to show total count
  const {
    data: countData,
    isPending: isLoadingCount,
    isFetching: isFetchingCount,
  } = useUsersCountQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: trimmedQuery || '',
      filter: undefined,
      providers: [],
      forceExactCount: false,
      // Use optimized search when filtering by specific column
      ...(searchColumn !== undefined ? { column: searchColumn } : { column: undefined }),
    },
    {
      placeholderData: keepPreviousData,
    }
  )
  const totalUsers = countData?.count ?? 0
  const isSearchDisabled = totalUsers > 1_000_000

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
      enabled: hasQueryInput && !isSearchDisabled,
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

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoadingCount || isFetchingCount || countData === undefined ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total:{' '}
            {countData?.is_estimate
              ? formatEstimatedCount(totalUsers)
              : totalUsers.toLocaleString()}{' '}
            user{totalUsers !== 1 ? 's' : ''}
            {countData?.is_estimate && ' (estimated)'}
          </span>
        )}
      </div>
    </div>
  )

  // Show disabled message if user count exceeds threshold (1 million users)
  if (isSearchDisabled && countData && !isLoadingCount && !isFetchingCount) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Users className="h-6 w-6" strokeWidth={1.5} />
            <div className="space-y-2 max-w-md">
              <p className="text-sm font-medium text-foreground-light">
                User search is disabled for large datasets
              </p>
              <p className="text-xs">
                Your project has more than 1 million Auth users, and querying through the command
                menu may cause performance issues. Use the{' '}
                <Link href={`/project/${projectRef}/sql/new`} className="underline">
                  SQL Editor
                </Link>{' '}
                for large queries instead.
              </p>
            </div>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (!query.trim()) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={Users} label="Users" query="" />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isLoadingUsers) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <SkeletonResults />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isErrorUsers) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Users className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load users</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (userResults.length === 0) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={Users} label="Users" query={query} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList
          results={userResults}
          icon={Users}
          getRoute={(result) =>
            `/project/${projectRef}/auth/users?show=${result.id}` as `/${string}`
          }
          className="pb-9"
        />
      </div>
      {renderFooter()}
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { useParams } from 'common'
import { useUsersInfiniteQuery, type User } from 'data/auth/users-infinite-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getDisplayName } from 'components/interfaces/Auth/Users/Users.utils'
import {
  ResultItem,
  SkeletonResults,
  EmptyState,
  type SearchResult,
} from './ContextSearchResults.shared'

interface UserSearchResultsProps {
  query: string
}

export function UserSearchResults({ query }: UserSearchResultsProps) {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const hasQueryInput = query.trim().length > 0

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
  } = useUsersInfiniteQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      keywords: query.trim(),
      // Use freeform search (column: undefined) to search across name and email
      column: undefined,
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
    return users.slice(0, 10).map((user: User) => {
      const displayName = getDisplayName(user, '')
      const name = user.email || user.phone || displayName || 'User'
      const description = user.id ? `User ID: ${user.id.slice(0, 8)}...` : undefined
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

  const handleResultClick = (result: SearchResult) => {
    if (projectRef) {
      // Navigate to users page with the selected user
      router.push(`/project/${projectRef}/auth/users?show=${result.id}`)
    }
  }

  return (
    <div className="p-2 space-y-0.5 overflow-y-auto max-h-[300px]">
      {userResults.map((result) => (
        <ResultItem
          key={result.id}
          result={result}
          icon={Users}
          onClick={() => handleResultClick(result)}
        />
      ))}
    </div>
  )
}

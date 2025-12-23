'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { Database, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import type { SearchContextValue } from './ContextSearchCommands'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

// Lazy load user search results component
const UserSearchResults = dynamic(
  () => import('./UserSearchResults').then((mod) => ({ default: mod.UserSearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

// Lazy load table search results component
const TableSearchResults = dynamic(
  () => import('./TableSearchResults').then((mod) => ({ default: mod.TableSearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

// Lazy load policy search results component
const PolicySearchResults = dynamic(
  () => import('./PolicySearchResults').then((mod) => ({ default: mod.PolicySearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

// Lazy load edge function search results component
const EdgeFunctionSearchResults = dynamic(
  () =>
    import('./EdgeFunctionSearchResults').then((mod) => ({
      default: mod.EdgeFunctionSearchResults,
    })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

// Lazy load storage search results component
const StorageSearchResults = dynamic(
  () => import('./StorageSearchResults').then((mod) => ({ default: mod.StorageSearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

interface ContextSearchResultsProps {
  context: SearchContextValue
  query: string
}

const CONTEXT_CONFIG: Record<
  SearchContextValue,
  {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    label: string
    /** If true, requires user input before showing results */
    requiresInput?: boolean
  }
> = {
  users: {
    icon: Users,
    label: 'Users',
    requiresInput: true,
  },
  'database-tables': {
    icon: Database,
    label: 'Database Tables',
    requiresInput: false,
  },
  'auth-policies': {
    icon: Auth,
    label: 'RLS Policies',
    requiresInput: false,
  },
  'edge-functions': {
    icon: EdgeFunctions,
    label: 'Edge Functions',
    requiresInput: false,
  },
  storage: {
    icon: Storage,
    label: 'Storage',
    requiresInput: false,
  },
}

// Mock data for different contexts
const MOCK_RESULTS: Record<SearchContextValue, SearchResult[]> = {
  users: [
    { id: '1', name: 'john@example.com', description: 'User ID: abc-123' },
    { id: '2', name: 'jane@example.com', description: 'User ID: def-456' },
    { id: '3', name: 'admin@example.com', description: 'User ID: ghi-789' },
  ],
  'database-tables': [],
  'auth-policies': [],
  'edge-functions': [],
  storage: [],
}

export function ContextSearchResults({ context, query }: ContextSearchResultsProps) {
  const config = CONTEXT_CONFIG[context]
  const requiresInput = config?.requiresInput ?? false

  // Mock data for other contexts - always compute, even if we return early
  const mockResults = useMemo(() => {
    if (
      context === 'users' ||
      context === 'database-tables' ||
      context === 'auth-policies' ||
      context === 'edge-functions' ||
      context === 'storage'
    )
      return []
    const mockData = MOCK_RESULTS[context] || []
    return query.trim()
      ? mockData.filter(
          (item) =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        )
      : mockData
  }, [context, query])

  // Delegate to UserSearchResults for users context
  if (context === 'users') {
    return <UserSearchResults query={query} />
  }

  // Delegate to TableSearchResults for database-tables context
  if (context === 'database-tables') {
    return <TableSearchResults query={query} />
  }

  // Delegate to PolicySearchResults for auth-policies context
  if (context === 'auth-policies') {
    return <PolicySearchResults query={query} />
  }

  // Delegate to EdgeFunctionSearchResults for edge-functions context
  if (context === 'edge-functions') {
    return <EdgeFunctionSearchResults query={query} />
  }

  // Delegate to StorageSearchResults for storage context
  if (context === 'storage') {
    return <StorageSearchResults query={query} />
  }

  // Show empty state immediately if no query and context requires input
  if (!query.trim() && requiresInput) {
    return <EmptyState icon={config.icon} label={config.label} query="" />
  }

  if (mockResults.length === 0) {
    return <EmptyState icon={config.icon} label={config.label} query={query} />
  }

  return <ResultsList results={mockResults} icon={config.icon} />
}

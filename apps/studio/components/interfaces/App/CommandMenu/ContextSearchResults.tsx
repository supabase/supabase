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
  },
  storage: {
    icon: Storage,
    label: 'Storage',
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
  'edge-functions': [
    { id: '1', name: 'send-email', description: 'Last deployed: 2 days ago' },
    { id: '2', name: 'process-webhook', description: 'Last deployed: 1 week ago' },
    { id: '3', name: 'generate-report', description: 'Last deployed: 3 days ago' },
  ],
  storage: [
    { id: '1', name: 'avatars', description: 'Public bucket • 234 files' },
    { id: '2', name: 'documents', description: 'Private bucket • 567 files' },
    { id: '3', name: 'uploads', description: 'Public bucket • 890 files' },
  ],
}

export function ContextSearchResults({ context, query }: ContextSearchResultsProps) {
  const config = CONTEXT_CONFIG[context]
  const requiresInput = config?.requiresInput ?? false

  // Mock data for other contexts - always compute, even if we return early
  const mockResults = useMemo(() => {
    if (context === 'users' || context === 'database-tables' || context === 'auth-policies')
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

  // Show empty state immediately if no query and context requires input
  if (!query.trim() && requiresInput) {
    return <EmptyState icon={config.icon} label={config.label} query="" />
  }

  if (mockResults.length === 0) {
    return <EmptyState icon={config.icon} label={config.label} query={query} />
  }

  return <ResultsList results={mockResults} icon={config.icon} />
}

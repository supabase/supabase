'use client'

import dynamic from 'next/dynamic'
import { Database, Users } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import type { SearchContextValue } from './ContextSearchCommands'
import { SkeletonResults, EmptyState } from './ContextSearchResults.shared'

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

export function ContextSearchResults({ context, query }: ContextSearchResultsProps) {
  const config = CONTEXT_CONFIG[context]

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

  // Fallback: show empty state for any unhandled contexts
  return <EmptyState icon={config.icon} label={config.label} query={query} />
}

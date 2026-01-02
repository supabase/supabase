'use client'

import dynamic from 'next/dynamic'
import { Database } from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import type { SearchContextValue } from './SearchContext.types'
import { SkeletonResults, EmptyState } from './ContextSearchResults.shared'

const TableSearchResults = dynamic(
  () => import('./TableSearchResults').then((mod) => ({ default: mod.TableSearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

const PolicySearchResults = dynamic(
  () => import('./PolicySearchResults').then((mod) => ({ default: mod.PolicySearchResults })),
  {
    loading: () => <SkeletonResults />,
    ssr: false,
  }
)

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
    requiresInput?: boolean // requires user input before showing results
  }
> = {
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

  if (context === 'database-tables') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <TableSearchResults query={query} />
      </div>
    )
  }

  if (context === 'auth-policies') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <PolicySearchResults query={query} />
      </div>
    )
  }

  if (context === 'edge-functions') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <EdgeFunctionSearchResults query={query} />
      </div>
    )
  }

  if (context === 'storage') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <StorageSearchResults query={query} />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <EmptyState icon={config.icon} label={config.label} query={query} />
    </div>
  )
}

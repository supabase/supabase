'use client'

import { Auth, EdgeFunctions, Storage } from 'icons'
import { DatabaseIcon } from 'lucide-react'
import { lazy, Suspense } from 'react'

import { EmptyState, SkeletonResults } from './ContextSearchResults.shared'
import type { SearchContextValue } from './SearchContext.types'

const TableSearchResults = lazy(() =>
  import('./TableSearchResults').then((mod) => ({ default: mod.TableSearchResults }))
)

const PolicySearchResults = lazy(() =>
  import('./PolicySearchResults').then((mod) => ({ default: mod.PolicySearchResults }))
)

const EdgeFunctionSearchResults = lazy(() =>
  import('./EdgeFunctionSearchResults').then((mod) => ({
    default: mod.EdgeFunctionSearchResults,
  }))
)

const StorageSearchResults = lazy(() =>
  import('./StorageSearchResults').then((mod) => ({ default: mod.StorageSearchResults }))
)

interface ContextSearchResultsProps {
  context: SearchContextValue
  query: string
  debouncedFilterString: string
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
    icon: DatabaseIcon,
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

export function ContextSearchResults({
  context,
  query,
  debouncedFilterString,
}: ContextSearchResultsProps) {
  const config = CONTEXT_CONFIG[context]

  if (context === 'database-tables') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<SkeletonResults />}>
          <TableSearchResults debouncedFilterString={debouncedFilterString} />
        </Suspense>
      </div>
    )
  }

  if (context === 'auth-policies') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<SkeletonResults />}>
          <PolicySearchResults query={query} />
        </Suspense>
      </div>
    )
  }

  if (context === 'edge-functions') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<SkeletonResults />}>
          <EdgeFunctionSearchResults query={query} />
        </Suspense>
      </div>
    )
  }

  if (context === 'storage') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<SkeletonResults />}>
          <StorageSearchResults query={query} />
        </Suspense>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <EmptyState icon={config.icon} label={config.label} query={query} />
    </div>
  )
}

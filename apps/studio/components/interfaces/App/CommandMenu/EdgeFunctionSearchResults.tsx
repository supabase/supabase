'use client'

import { useMemo } from 'react'
import { EdgeFunctions } from 'icons'
import { Loader2 } from 'lucide-react'
import { useParams } from 'common'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

interface EdgeFunctionSearchResultsProps {
  query: string
}

export function EdgeFunctionSearchResults({ query }: EdgeFunctionSearchResultsProps) {
  const { ref: projectRef } = useParams()

  const trimmedQuery = query.trim()

  const {
    data: functions,
    isLoading: isLoadingFunctions,
    isError: isErrorFunctions,
  } = useEdgeFunctionsQuery(
    {
      projectRef,
    },
    {
      enabled: !!projectRef,
    }
  )

  const functionResults: SearchResult[] = useMemo(() => {
    if (!functions) return []

    const filtered = trimmedQuery
      ? functions.filter((func) => {
          const searchLower = trimmedQuery.toLowerCase()
          const functionName = func.name?.toLowerCase() || ''
          const functionSlug = func.slug?.toLowerCase() || ''

          return functionName.includes(searchLower) || functionSlug.includes(searchLower)
        })
      : functions

    // Limit results for performance
    return filtered.slice(0, 20).map((func) => {
      const displayName = func.name || func.slug || 'Untitled Function'
      const description = func.version ? `Version ${func.version}` : undefined

      return {
        id: String(func.id),
        name: displayName,
        description,
      }
    })
  }, [functions, trimmedQuery])

  const totalFunctions = functions?.length ?? 0

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoadingFunctions ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total: {totalFunctions.toLocaleString()} function{totalFunctions !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )

  if (isLoadingFunctions) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <SkeletonResults />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isErrorFunctions) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <EdgeFunctions className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load edge functions</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (functionResults.length === 0) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={EdgeFunctions} label="Edge Functions" query={query} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList
          results={functionResults}
          icon={EdgeFunctions}
          getRoute={(result) => {
            const func = functions?.find((f) => String(f.id) === result.id)
            if (!func || !projectRef) return `/project/${projectRef}/functions` as `/${string}`

            return `/project/${projectRef}/functions/${func.slug}` as `/${string}`
          }}
          className="pb-9"
        />
      </div>
      {renderFooter()}
    </div>
  )
}

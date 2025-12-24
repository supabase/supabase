'use client'

import { useMemo } from 'react'
import { EdgeFunctions } from 'icons'
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

  // Filter functions based on query
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

  if (isLoadingFunctions) {
    return <SkeletonResults />
  }

  if (isErrorFunctions) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
        <EdgeFunctions className="h-6 w-6" strokeWidth={1.5} />
        <p className="text-sm">Failed to load edge functions</p>
      </div>
    )
  }

  if (functionResults.length === 0) {
    return <EmptyState icon={EdgeFunctions} label="Edge Functions" query={query} />
  }

  return (
    <ResultsList
      results={functionResults}
      icon={EdgeFunctions}
      getRoute={(result) => {
        const func = functions?.find((f) => String(f.id) === result.id)
        if (!func || !projectRef) return `/project/${projectRef}/functions` as `/${string}`

        return `/project/${projectRef}/functions/${func.slug}` as `/${string}`
      }}
    />
  )
}

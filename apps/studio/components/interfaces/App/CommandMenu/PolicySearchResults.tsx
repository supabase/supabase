'use client'

import { useMemo } from 'react'
import { Auth } from 'icons'
import { Loader2 } from 'lucide-react'
import { useParams } from 'common'
import { useDatabasePoliciesQuery } from 'data/database-policies/database-policies-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

interface PolicySearchResultsProps {
  query: string
}

export function PolicySearchResults({ query }: PolicySearchResultsProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const trimmedQuery = query.trim()

  const {
    data: policies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = useDatabasePoliciesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      enabled: !!project?.ref,
    }
  )

  const policyResults: SearchResult[] = useMemo(() => {
    if (!policies) return []

    const filtered = trimmedQuery
      ? policies.filter((policy) => {
          const searchLower = trimmedQuery.toLowerCase()
          const policyName = policy.name?.toLowerCase() || ''
          const tableName = policy.table?.toLowerCase() || ''
          const schemaName = policy.schema?.toLowerCase() || ''
          const fullTableName = `${schemaName}.${tableName}`
          const command = policy.command?.toLowerCase() || ''

          return (
            policyName.includes(searchLower) ||
            tableName.includes(searchLower) ||
            schemaName.includes(searchLower) ||
            fullTableName.includes(searchLower) ||
            command.includes(searchLower)
          )
        })
      : policies

    // Limit results for performance
    return filtered.slice(0, 20).map((policy) => {
      const displayName = policy.name || 'Untitled Policy'
      const tableDisplay =
        policy.schema && policy.schema !== 'public'
          ? `${policy.schema}.${policy.table}`
          : policy.table || 'unknown table'
      const commandDisplay = policy.command || 'ALL'
      const description = `${commandDisplay} on ${tableDisplay}`

      return {
        id: String(policy.id),
        name: displayName,
        description,
      }
    })
  }, [policies, trimmedQuery])

  const totalPolicies = policies?.length ?? 0

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoadingPolicies ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total: {totalPolicies.toLocaleString()} polic{totalPolicies !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>
    </div>
  )

  if (isLoadingPolicies) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <SkeletonResults />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isErrorPolicies) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Auth className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load policies</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (policyResults.length === 0) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={Auth} label="RLS Policies" query={query} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList
          results={policyResults}
          icon={Auth}
          getRoute={(result) => {
            const policy = policies?.find((p) => String(p.id) === result.id)
            if (!policy || !projectRef)
              return `/project/${projectRef}/auth/policies` as `/${string}`

            const params = new URLSearchParams()
            params.set('edit', String(policy.id))
            if (policy.schema) {
              params.set('schema', policy.schema)
            }
            return `/project/${projectRef}/auth/policies?${params.toString()}` as `/${string}`
          }}
          className="pb-9"
        />
      </div>
      {renderFooter()}
    </div>
  )
}

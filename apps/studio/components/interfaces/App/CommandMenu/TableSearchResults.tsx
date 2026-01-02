'use client'

import { useMemo } from 'react'
import { Database, Loader2 } from 'lucide-react'
import { useParams } from 'common'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  SkeletonResults,
  EmptyState,
  ResultsList,
  type SearchResult,
} from './ContextSearchResults.shared'

interface TableSearchResultsProps {
  query: string
}

export function TableSearchResults({ query }: TableSearchResultsProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const trimmedQuery = query.trim()

  const {
    data: tables,
    isLoading: isLoadingTables,
    isError: isErrorTables,
  } = useTablesQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      includeColumns: false,
      sortByProperty: 'name',
    },
    {
      enabled: !!project?.ref,
    }
  )

  const tableResults: SearchResult[] = useMemo(() => {
    if (!tables) return []

    const filtered = trimmedQuery
      ? tables.filter((table) => {
          const searchLower = trimmedQuery.toLowerCase()
          const tableName = table.name?.toLowerCase() || ''
          const schemaName = table.schema?.toLowerCase() || ''
          const fullName = `${schemaName}.${tableName}`

          return (
            tableName.includes(searchLower) ||
            schemaName.includes(searchLower) ||
            fullName.includes(searchLower)
          )
        })
      : tables

    // Limit results for performance
    return filtered.slice(0, 20).map((table) => {
      const displayName =
        table.schema && table.schema !== 'public'
          ? `${table.schema}.${table.name}`
          : table.name || 'Untitled Table'

      const description = table.comment
        ? table.comment.length > 50
          ? `${table.comment.slice(0, 50)}...`
          : table.comment
        : undefined

      return {
        id: String(table.id),
        name: displayName,
        description,
      }
    })
  }, [tables, trimmedQuery])

  const totalTables = tables?.length ?? 0

  const renderFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
      <div className="flex items-center gap-x-2">
        {isLoadingTables ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading...
          </span>
        ) : (
          <span>
            Total: {totalTables.toLocaleString()} table{totalTables !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )

  if (isLoadingTables) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <SkeletonResults />
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (isErrorTables) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Database className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load tables</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    )
  }

  if (tableResults.length === 0) {
    return (
      <div className="relative h-full flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <EmptyState icon={Database} label="Database Tables" query={query} />
        </div>
        {renderFooter()}
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResultsList
          results={tableResults}
          icon={Database}
          getRoute={(result) => {
            const table = tables?.find((t) => String(t.id) === result.id)
            if (!table || !projectRef) return `/project/${projectRef}/editor` as `/${string}`

            const schemaParam = table.schema ? `?schema=${table.schema}` : ''
            return `/project/${projectRef}/editor/${table.id}${schemaParam}` as `/${string}`
          }}
          className="pb-9"
        />
      </div>
      {renderFooter()}
    </div>
  )
}

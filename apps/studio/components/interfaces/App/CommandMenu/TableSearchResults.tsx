'use client'

import { useMemo } from 'react'
import { Database } from 'lucide-react'
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

  // Filter tables based on query
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

  if (isLoadingTables) {
    return <SkeletonResults />
  }

  if (isErrorTables) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
        <Database className="h-6 w-6" strokeWidth={1.5} />
        <p className="text-sm">Failed to load tables</p>
      </div>
    )
  }

  if (tableResults.length === 0) {
    return <EmptyState icon={Database} label="Database Tables" query={query} />
  }

  return (
    <ResultsList
      results={tableResults}
      icon={Database}
      getRoute={(result) => {
        const table = tables?.find((t) => String(t.id) === result.id)
        if (!table || !projectRef) return `/project/${projectRef}/editor` as `/${string}`

        // Build relative path similar to buildTableEditorUrl but without full URL
        const schemaParam = table.schema ? `?schema=${table.schema}` : ''
        return `/project/${projectRef}/editor/${table.id}${schemaParam}` as `/${string}`
      }}
    />
  )
}

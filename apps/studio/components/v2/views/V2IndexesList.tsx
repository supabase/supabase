'use client'

import { useIndexesQuery } from 'data/database-indexes/indexes-query'
import type { DatabaseIndex } from 'data/database-indexes/indexes-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'

const INDEXES_COLUMNS: DataTableColumn<DatabaseIndex>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 240,
    minWidth: 140,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'schema',
    name: 'Schema',
    width: 120,
    renderCell: (_v, row) => <span className="text-foreground-lighter">{row.schema}</span>,
  },
  {
    id: 'table',
    name: 'Table',
    width: 180,
    renderCell: (_v, row) => <span className="font-mono text-xs">{row.table}</span>,
  },
  {
    id: 'columns',
    name: 'Columns',
    width: 200,
    renderCell: (_v, row) => (
      <span className="font-mono text-xs text-foreground-lighter truncate">{row.columns}</span>
    ),
  },
  {
    id: 'definition',
    name: 'Definition',
    minWidth: 240,
    type: 'code',
  },
]

export function V2IndexesList() {
  const { projectRef } = useV2Params()
  const schema = 'public'

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const {
    data: indexes,
    isPending: isIndexesPending,
    isError,
    error,
  } = useIndexesQuery(
    { projectRef, connectionString: project?.connectionString, schema },
    { enabled: shouldFetch }
  )

  return (
    <DataTableRenderer<DatabaseIndex>
      columns={INDEXES_COLUMNS}
      rows={(indexes as DatabaseIndex[]) ?? []}
      rowKey="name"
      isLoading={isProjectPending || (shouldFetch && isIndexesPending)}
      error={isError ? (error as Error) : null}
      filters={[{ id: 'search', label: 'Search', type: 'search', placeholder: 'Filter indexes…' }]}
      emptyState={{ title: 'No indexes found', description: 'Indexes will appear here.' }}
    />
  )
}

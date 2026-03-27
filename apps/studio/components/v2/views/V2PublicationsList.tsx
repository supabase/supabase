'use client'

import { useDatabasePublicationsQuery } from 'data/database-publications/database-publications-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'

type Publication = {
  id: number
  name: string
  publish_insert: boolean
  publish_update: boolean
  publish_delete: boolean
  publish_truncate: boolean
  tables: { id: number; name: string; schema: string }[] | null
}

const PUBLICATIONS_COLUMNS: DataTableColumn<Publication>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 200,
    minWidth: 120,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'publish_insert',
    name: 'Insert',
    width: 90,
    type: 'boolean',
  },
  {
    id: 'publish_update',
    name: 'Update',
    width: 90,
    type: 'boolean',
  },
  {
    id: 'publish_delete',
    name: 'Delete',
    width: 90,
    type: 'boolean',
  },
  {
    id: 'publish_truncate',
    name: 'Truncate',
    width: 100,
    type: 'boolean',
  },
  {
    id: 'tables',
    name: 'Tables',
    minWidth: 160,
    renderCell: (_v, row) => {
      const tables = row.tables
      if (!tables) return <span className="text-foreground-lighter italic">All tables</span>
      if (tables.length === 0) return <span className="text-foreground-lighter italic">None</span>
      return (
        <span className="truncate text-xs text-foreground-lighter">
          {tables.map((t) => `${t.schema}.${t.name}`).join(', ')}
        </span>
      )
    },
  },
]

export function V2PublicationsList() {
  const { projectRef } = useV2Params()

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const {
    data: publications,
    isPending: isPublicationsPending,
    isError,
    error,
  } = useDatabasePublicationsQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  return (
    <DataTableRenderer<Publication>
      columns={PUBLICATIONS_COLUMNS}
      rows={(publications as Publication[]) ?? []}
      rowKey="id"
      isLoading={isProjectPending || (shouldFetch && isPublicationsPending)}
      error={isError ? (error as Error) : null}
      compact
      emptyState={{ title: 'No publications found' }}
    />
  )
}

'use client'

import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import type { DatabaseExtension } from 'data/database-extensions/database-extensions-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'

const EXTENSIONS_COLUMNS: DataTableColumn<DatabaseExtension>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 200,
    minWidth: 120,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'schema',
    name: 'Schema',
    width: 140,
    renderCell: (_v, row) => <span className="text-foreground-lighter">{row.schema ?? '—'}</span>,
  },
  {
    id: 'installed_version',
    name: 'Installed',
    width: 120,
    type: 'badge',
    renderCell: (_v, row) =>
      row.installed_version ? (
        <span className="inline-flex items-center rounded-sm border border-brand-500 bg-brand-300 px-1.5 py-0.5 leading-3 text-[11px] text-brand">
          {row.installed_version}
        </span>
      ) : (
        <span className="text-foreground-lighter italic">Not installed</span>
      ),
  },
  {
    id: 'default_version',
    name: 'Latest',
    width: 120,
    renderCell: (_v, row) => (
      <span className="font-mono text-xs text-foreground-lighter">{row.default_version}</span>
    ),
  },
  {
    id: 'comment',
    name: 'Description',
    minWidth: 200,
    renderCell: (_v, row) => (
      <span className="truncate text-foreground-lighter">{row.comment ?? '—'}</span>
    ),
  },
]

export function V2ExtensionsList() {
  const { projectRef } = useV2Params()

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const {
    data: extensions,
    isPending: isExtensionsPending,
    isError,
    error,
  } = useDatabaseExtensionsQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  return (
    <DataTableRenderer<DatabaseExtension>
      columns={EXTENSIONS_COLUMNS}
      rows={(extensions as DatabaseExtension[]) ?? []}
      rowKey="name"
      isLoading={isProjectPending || (shouldFetch && isExtensionsPending)}
      error={isError ? (error as Error) : null}
      filters={[
        { id: 'search', label: 'Search', type: 'search', placeholder: 'Filter extensions…' },
      ]}
      emptyState={{ title: 'No extensions found' }}
    />
  )
}

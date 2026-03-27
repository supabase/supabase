'use client'

import type { PostgresTable } from '@supabase/postgres-meta'
import { useSchemasQuery } from 'data/database/schemas-query'
import { isValidConnString } from 'data/fetchers'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useTablesQuery } from 'data/tables/tables-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo } from 'react'
import {
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'
import { useV2DashboardStore } from '@/stores/v2-dashboard'

/** Ensures migrations schema is selectable even if omitted from catalog listings. */
const MIGRATIONS_SCHEMA = 'supabase_migrations'

export function V2TablesList() {
  const router = useRouter()
  const { projectRef } = useV2Params()
  const openDataTab = useV2DashboardStore((s) => s.openDataTab)
  const [schemaQuery, setSchemaQuery] = useQueryState(
    'schema',
    parseAsString.withOptions({ history: 'replace', clearOnDefault: true })
  )

  const { data: project, isPending: isProjectPending } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )

  const shouldFetch = Boolean(projectRef) && isValidConnString(project?.connectionString)

  const {
    data: schemas,
    isSuccess: isSchemasSuccess,
  } = useSchemasQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: shouldFetch }
  )

  /** Catalog names plus migrations schema (API often omits internal schemas). */
  const schemaNames = useMemo(() => {
    const fromApi = (schemas ?? []).map((s) => s.name)
    const set = new Set(fromApi)
    set.add(MIGRATIONS_SCHEMA)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [schemas])

  const schemasCatalogReady = shouldFetch && isSchemasSuccess

  /**
   * Until the schema catalog has loaded, keep the URL param so deep links like ?schema=auth are
   * not cleared when `schemaNames` is still only the bootstrap set (e.g. supabase_migrations).
   */
  const schema = useMemo(() => {
    if (!schemaQuery) return 'public'
    if (!shouldFetch) return 'public'
    if (!schemasCatalogReady) return schemaQuery
    return schemaNames.includes(schemaQuery) ? schemaQuery : 'public'
  }, [schemaQuery, shouldFetch, schemasCatalogReady, schemaNames])

  useEffect(() => {
    if (!schemaQuery || !schemasCatalogReady) return
    if (!schemaNames.includes(schemaQuery)) {
      void setSchemaQuery(null)
    }
  }, [schemaQuery, schemasCatalogReady, schemaNames, setSchemaQuery])

  /** Include current URL schema in the dropdown before/while catalog loads, or Radix Select breaks. */
  const schemaSelectOptions = useMemo(() => {
    if (schemaQuery && !schemaNames.includes(schemaQuery)) {
      return [...schemaNames, schemaQuery].sort((a, b) => a.localeCompare(b))
    }
    return schemaNames
  }, [schemaNames, schemaQuery])
  const {
    data: tables,
    isLoading: isTablesLoading,
    isError: isTablesError,
    error: tablesError,
  } = useTablesQuery(
    {
      projectRef,
      connectionString: project?.connectionString,
      schema,
      includeColumns: false,
    },
    { enabled: shouldFetch }
  )

  const base = projectRef ? `/v2/project/${projectRef}` : ''

  const openTable = useCallback(
    (table: PostgresTable) => {
      const path = `${base}/data/tables/${table.id}/data`
      openDataTab({
        id: `tables-${table.id}`,
        label: table.name,
        type: 'detail',
        category: 'tables',
        domain: 'db',
        path,
      })
      router.push(path)
    },
    [base, openDataTab, router]
  )

  const columns = useMemo<DataTableColumn<PostgresTable>[]>(
    () => [
      {
        id: 'name',
        name: 'Name',
        width: 280,
        minWidth: 160,
        frozen: true,
        renderCell: (_value, row) => (
          <Link
            href={`${base}/data/tables/${row.id}/data`}
            onClick={() => openTable(row)}
            className="truncate font-mono text-xs text-foreground hover:underline"
          >
            {row.name}
          </Link>
        ),
      },
      {
        id: 'schema',
        name: 'Schema',
        width: 160,
        minWidth: 100,
        type: 'text',
        renderCell: (_value, row) => (
          <span className="truncate text-foreground-lighter">{row.schema ?? schema}</span>
        ),
      },
      {
        id: 'rls_enabled',
        name: 'RLS',
        width: 80,
        type: 'badge',
        badgeMap: {
          true: { label: 'On', variant: 'success' },
          false: { label: 'Off', variant: 'warning' },
        },
      },
    ],
    [base, schema, openTable]
  )

  const schemaSelector = (
    <Select_Shadcn_
      value={schema}
      onValueChange={(v) => {
        void setSchemaQuery(v === 'public' ? null : v)
      }}
    >
      <SelectTrigger_Shadcn_ className="h-8 min-w-[140px] max-w-[200px] w-[min(100%,200px)] text-xs">
        <SelectValue_Shadcn_ />
      </SelectTrigger_Shadcn_>
      <SelectContent_Shadcn_>
        {schemaSelectOptions.map((name) => (
          <SelectItem_Shadcn_ key={name} value={name}>
            {name}
          </SelectItem_Shadcn_>
        ))}
      </SelectContent_Shadcn_>
    </Select_Shadcn_>
  )

  const tableCount = Array.isArray(tables) ? tables.length : 0

  return (
    <DataTableRenderer<PostgresTable>
      columns={columns}
      rows={Array.isArray(tables) ? tables : []}
      rowKey="id"
      isLoading={isProjectPending || isTablesLoading}
      error={isTablesError ? (tablesError as Error) : null}
      filters={[
        {
          id: 'search',
          label: 'Search',
          type: 'search',
          placeholder: 'Filter tables…',
        },
      ]}
      toolbarLeft={schemaSelector}
      toolbarRight={
        <span className="text-xs text-foreground-lighter shrink-0">
          {tableCount} {tableCount === 1 ? 'table' : 'tables'}
        </span>
      }
      onRowDoubleClick={openTable}
      emptyState={{
        title: 'No tables found',
        description: 'Create your first table to get started.',
      }}
    />
  )
}

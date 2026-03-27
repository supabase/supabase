'use client'

import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import type { EdgeFunctionsResponse } from 'data/edge-functions/edge-functions-query'
import { useRouter } from 'next/navigation'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'
import { useV2DashboardStore } from '@/stores/v2-dashboard'

const EDGE_FUNCTIONS_COLUMNS: DataTableColumn<EdgeFunctionsResponse>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 220,
    minWidth: 140,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'slug',
    name: 'Slug',
    width: 200,
    type: 'code',
    copyable: true,
  },
  {
    id: 'status',
    name: 'Status',
    width: 120,
    type: 'badge',
    badgeMap: {
      ACTIVE: { label: 'Active', variant: 'success' },
      INACTIVE: { label: 'Inactive', variant: 'default' },
      THROTTLED: { label: 'Throttled', variant: 'warning' },
    },
  },
  {
    id: 'version',
    name: 'Version',
    width: 100,
    type: 'number',
  },
  {
    id: 'created_at',
    name: 'Created',
    width: 140,
    type: 'datetime',
  },
  {
    id: 'updated_at',
    name: 'Updated',
    width: 140,
    type: 'datetime',
  },
]

export function V2EdgeFunctionsList() {
  const router = useRouter()
  const { projectRef } = useV2Params()
  const openDataTab = useV2DashboardStore((s) => s.openDataTab)

  const {
    data: functions,
    isLoading,
    isError,
    error,
  } = useEdgeFunctionsQuery({ projectRef }, { enabled: Boolean(projectRef) })

  return (
    <DataTableRenderer<EdgeFunctionsResponse>
      columns={EDGE_FUNCTIONS_COLUMNS}
      rows={(functions as EdgeFunctionsResponse[]) ?? []}
      rowKey="id"
      isLoading={isLoading}
      error={isError ? (error as Error) : null}
      filters={[
        { id: 'search', label: 'Search', type: 'search', placeholder: 'Filter edge functions…' },
      ]}
      onRowClick={(row) => {
        if (!projectRef) return
        const path = `/v2/project/${projectRef}/data/edge-functions/${row.slug}`
        openDataTab({
          id: `edge-function:${row.slug}`,
          label: row.name || row.slug,
          type: 'detail',
          category: 'edge-functions',
          domain: 'fn',
          path,
        })
        router.push(path)
      }}
      emptyState={{
        title: 'No edge functions yet',
        description: 'Deploy your first edge function to get started.',
      }}
    />
  )
}

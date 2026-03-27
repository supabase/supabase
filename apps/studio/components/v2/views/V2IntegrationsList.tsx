'use client'

import { useInstalledIntegrations } from 'components/interfaces/Integrations/Landing/useInstalledIntegrations'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'
import { useV2DashboardStore } from '@/stores/v2-dashboard'

type InstalledIntegrationRow = {
  id: string
  name: string
  type: string
  status?: 'alpha' | 'beta'
  description: string | null
}

const INTEGRATION_COLUMNS: DataTableColumn<InstalledIntegrationRow>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 220,
    minWidth: 140,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'type',
    name: 'Type',
    width: 160,
    renderCell: (_v, row) => (
      <span className="text-foreground-lighter">
        {row.type === 'wrapper' ? 'Wrapper' : 'Postgres module'}
      </span>
    ),
  },
  {
    id: 'status',
    name: 'Status',
    width: 120,
    renderCell: (_v, row) =>
      row.status ? (
        <span className="inline-flex items-center rounded-sm border border-brand-500 bg-brand-300 px-1.5 py-0.5 leading-3 text-[11px] text-brand">
          {row.status}
        </span>
      ) : (
        <span className="text-foreground-lighter italic">Stable</span>
      ),
  },
  {
    id: 'description',
    name: 'Description',
    minWidth: 260,
    renderCell: (_v, row) => (
      <span className="truncate text-foreground-lighter">{row.description ?? '—'}</span>
    ),
  },
]

export function V2IntegrationsList() {
  const router = useRouter()
  const { projectRef } = useV2Params()
  const openDataTab = useV2DashboardStore((s) => s.openDataTab)
  const { installedIntegrations, isLoading, isError, error } = useInstalledIntegrations()

  const rows: InstalledIntegrationRow[] = installedIntegrations.map((integration) => ({
    id: integration.id,
    name: integration.name,
    type: integration.type,
    status: integration.status,
    description: integration.description,
  }))

  return (
    <DataTableRenderer<InstalledIntegrationRow>
      columns={INTEGRATION_COLUMNS}
      rows={rows}
      rowKey="id"
      isLoading={isLoading}
      error={isError ? (error as Error) : null}
      filters={[
        { id: 'search', label: 'Search', type: 'search', placeholder: 'Filter integrations…' },
      ]}
      toolbarRight={
        <Button
          type="primary"
          size="tiny"
          icon={<Plus size={12} />}
          onClick={() => {
            if (!projectRef) return
            router.push(`/v2/project/${projectRef}/data/integrations/add`)
          }}
        >
          Add integration
        </Button>
      }
      onRowClick={(row) => {
        if (!projectRef) return
        const path = `/v2/project/${projectRef}/data/integrations/${row.id}/overview`
        openDataTab({
          id: `integration:${row.id}`,
          label: row.name,
          type: 'detail',
          category: 'integrations',
          domain: 'db',
          path: `/v2/project/${projectRef}/data/integrations/${row.id}`,
        })
        router.push(path)
      }}
      emptyState={{
        title: 'No integrations installed',
        description: 'Use Add integration to browse and install wrappers/modules.',
      }}
    />
  )
}

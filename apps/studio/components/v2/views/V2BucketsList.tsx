'use client'

import { usePaginatedBucketsQuery } from 'data/storage/buckets-query'
import type { Bucket } from 'data/storage/buckets-query'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { DataTableRenderer } from '@/components/v2/DataTableRenderer'
import type { DataTableColumn } from '@/components/v2/DataTableRenderer'

const BUCKETS_COLUMNS: DataTableColumn<Bucket>[] = [
  {
    id: 'name',
    name: 'Name',
    width: 220,
    minWidth: 140,
    renderCell: (_v, row) => <span className="font-mono text-xs text-foreground">{row.name}</span>,
  },
  {
    id: 'public',
    name: 'Access',
    width: 120,
    type: 'badge',
    renderCell: (_v, row) =>
      row.public ? (
        <span className="inline-flex items-center rounded border border-warning-500 bg-warning-300 px-1.5 py-0.5 leading-none text-[11px] text-warning">
          Public
        </span>
      ) : (
        <span className="inline-flex items-center rounded border border-border bg-surface-300 px-1.5 py-0.5 text-[11px] leading-none text-foreground-light">
          Private
        </span>
      ),
  },
  {
    id: 'type',
    name: 'Type',
    width: 120,
    type: 'badge',
    badgeMap: {
      DEFAULT: { label: 'Default', variant: 'default' },
      OBJECT_TABLE: { label: 'Object table', variant: 'secondary' },
    },
  },
  {
    id: 'file_size_limit',
    name: 'Size limit',
    width: 120,
    renderCell: (_v, row) => {
      if (!row.file_size_limit) return <span className="text-foreground-lighter italic">None</span>
      const mb = Math.round(row.file_size_limit / 1024 / 1024)
      return <span>{mb} MB</span>
    },
  },
  {
    id: 'created_at',
    name: 'Created',
    width: 140,
    type: 'datetime',
  },
]

export function V2BucketsList() {
  const { projectRef } = useV2Params()

  const {
    data: bucketsData,
    isLoading,
    isError,
    error,
  } = usePaginatedBucketsQuery({ projectRef }, { enabled: Boolean(projectRef) })

  const buckets = bucketsData?.pages.flatMap((p) => p) ?? []

  return (
    <DataTableRenderer<Bucket>
      columns={BUCKETS_COLUMNS}
      rows={buckets}
      rowKey="id"
      isLoading={isLoading}
      error={isError ? (error as Error) : null}
      filters={[{ id: 'search', label: 'Search', type: 'search', placeholder: 'Filter buckets…' }]}
      emptyState={{
        title: 'No buckets yet',
        description: 'Create your first storage bucket to get started.',
      }}
    />
  )
}

import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import type { MutableRefObject } from 'react'
import { Checkbox } from 'ui'
import { TanStackTableHeadSort } from 'ui-patterns/Table'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    cellClassName?: string
    headerClassName?: string
  }
}

interface AuditLogColumnsOptions {
  projects: { ref?: string; name: string }[]
  organizations: { slug?: string; name: string }[]
  lastSelectedRowId: MutableRefObject<string | null>
}

export function getAuditLogColumns({
  projects,
  organizations,
  lastSelectedRowId,
}: AuditLogColumnsOptions): ColumnDef<AuditLog>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected() ||
            (table.getIsSomeRowsSelected() ? 'indeterminate' : false)
          }
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row, table }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onClick={(e) => {
            e.stopPropagation()

            const nextSelected = !row.getIsSelected()
            const rows = table.getRowModel().rows
            const lastIndex = lastSelectedRowId.current
              ? rows.findIndex((r) => r.id === lastSelectedRowId.current)
              : -1
            const currentIndex = rows.findIndex((r) => r.id === row.id)
            const canSelectRange = e.shiftKey && lastIndex !== -1 && currentIndex !== -1

            if (canSelectRange) {
              const [start, end] =
                lastIndex < currentIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex]
              table.setRowSelection((prev) => {
                const next = { ...prev }
                for (let i = start; i <= end; i++) {
                  if (nextSelected) {
                    next[rows[i].id] = true
                  } else {
                    delete next[rows[i].id]
                  }
                }
                return next
              })
            } else {
              row.toggleSelected(nextSelected)
            }

            lastSelectedRowId.current = row.id
          }}
        />
      ),
      enableSorting: false,
      size: 30,
      minSize: 30,
      maxSize: 30,
      meta: {
        cellClassName: 'w-[30px] min-w-[30px]',
        headerClassName: 'w-[30px] min-w-[30px]',
      },
    },
    {
      id: 'date',
      accessorFn: (log) => log.timestamp,
      header: ({ column }) => <TanStackTableHeadSort column={column}>Date</TanStackTableHeadSort>,
      cell: ({ row }) => (
        <TimestampInfo
          className="text-xs font-mono"
          utcTimestamp={dayjs(row.original.timestamp / TIMESTAMP_MICROS_PER_MS).toISOString()}
        />
      ),
      size: 155,
      minSize: 155,
      maxSize: 155,
      meta: {
        cellClassName: 'w-[155px] min-w-[155px] font-mono tracking-tight pl-3',
        headerClassName: 'w-[155px] min-w-[155px] pl-3',
      },
    },
    {
      id: 'status',
      header: '',
      accessorFn: (log) => log.action.status,
      cell: ({ row }) => (
        <DataTableColumnStatusCode
          value={row.original.action.status}
          level={getStatusLevel(row.original.action.status)}
          className="text-xs"
        />
      ),
      size: 40,
      minSize: 40,
      maxSize: 40,
      meta: {
        cellClassName: 'w-[40px] min-w-[40px]',
        headerClassName: 'w-[40px] min-w-[40px]',
      },
    },
    {
      id: 'method',
      header: 'Method',
      accessorFn: (log) => log.action.method,
      cell: ({ row }) => (
        <span className="text-foreground-light text-xs font-mono">
          {row.original.action.method}
        </span>
      ),
      size: 60,
      minSize: 60,
      maxSize: 60,
      meta: {
        cellClassName: 'w-[60px] min-w-[60px]',
        headerClassName: 'w-[60px] min-w-[60px]',
      },
    },
    {
      id: 'action',
      accessorFn: (log) => log.action.name,
      header: 'Event',
      meta: {
        cellClassName: 'min-w-[240px]',
        headerClassName: 'min-w-[240px]',
      },
      cell: ({ row }) => {
        const log = row.original
        const project = projects.find((p) => p.ref === log.project_ref)
        const organization = organizations.find((org) => org.slug === log.organization_slug)
        const name = project?.name ?? organization?.name
        const ref = log.project_ref ?? log.organization_slug

        let targetScope: 'Project' | 'Organization' | null = null
        if (project?.name) targetScope = 'Project'
        else if (organization?.name) targetScope = 'Organization'

        const target = name ? `${name} (${ref})` : ref

        return (
          <p
            className="truncate text-foreground-light font-mono tracking-tighter group-hover:text-foreground"
            title={row.original.action.name}
          >
            {row.original.action.name} {targetScope ? `| ${targetScope}: ${target}` : ''}
          </p>
        )
      },
    },
  ]
}

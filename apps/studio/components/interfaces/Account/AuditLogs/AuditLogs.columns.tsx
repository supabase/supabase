import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Box, Boxes } from 'lucide-react'
import type { MutableRefObject } from 'react'
import { Checkbox, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TanStackTableHeadSort } from 'ui-patterns/Table'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

interface AuditLogColumnsOptions {
  projects: { ref?: string; name: string }[]
  organizations: { slug?: string; name: string }[]
  lastSelectedRowId: MutableRefObject<string | null>
  isLoadingProjects: boolean
  isLoadingOrganizations: boolean
}

export function getAuditLogColumns({
  projects,
  organizations,
  lastSelectedRowId,
  isLoadingProjects,
  isLoadingOrganizations,
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
      id: 'target_type',
      header: '',
      accessorFn: (log) => log.action.status,
      cell: ({ row }) => {
        const log = row.original

        if (log.project_ref || log.organization_slug) {
          return (
            <Tooltip>
              <TooltipTrigger className="flex items-center">
                {log.project_ref ? (
                  <Box size={12} className="text-foreground-light" />
                ) : (
                  <Boxes size={12} className="text-foreground-light" />
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {log.project_ref ? 'Project' : 'Organization'}
              </TooltipContent>
            </Tooltip>
          )
        } else {
          return null
        }
      },
      size: 20,
      minSize: 20,
      maxSize: 20,
      meta: {
        cellClassName: 'w-[20px] min-w-[20px] px-0',
        headerClassName: 'w-[20px] min-w-[20px] px-0',
      },
    },
    {
      id: 'target',
      header: 'Target',
      accessorFn: (log) => log.project_ref ?? log.organization_slug,
      cell: ({ row }) => {
        const log = row.original

        if (log.project_ref && isLoadingProjects)
          return <ShimmeringLoader className="w-20 h-4 py-0" />
        if (log.organization_slug && isLoadingOrganizations) {
          return <ShimmeringLoader className="w-20 h-4 py-0" />
        }

        let target: string | undefined
        if (log.project_ref) {
          target = projects.find((p) => p.ref === log.project_ref)?.name ?? log.project_ref
        } else if (log.organization_slug) {
          target =
            organizations.find((org) => org.slug === log.organization_slug)?.name ??
            log.organization_slug
        }

        if (!target) return <span className="text-foreground-light text-xs">-</span>

        return (
          <p className="truncate text-foreground-light" title={target}>
            {target}
          </p>
        )
      },
      size: 120,
      minSize: 120,
      maxSize: 120,
      meta: {
        cellClassName: 'w-[120px] min-w-[120px]',
        headerClassName: 'w-[120px] min-w-[120px]',
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
        return (
          <p
            className="truncate text-foreground-light font-mono tracking-tighter group-hover:text-foreground"
            title={row.original.action.name}
          >
            {row.original.action.name}
          </p>
        )
      },
    },
  ]
}

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { ExportDialog } from './ExportDialog'
import type { Filter, Sort, SupaTable } from '@/components/grid/types'
import {
  useExportAllRowsAsCsv,
  useExportAllRowsAsSql,
} from '@/components/layouts/TableEditorLayout/ExportAllRows'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface AllRowsCopyExportActionsProps {
  table: SupaTable
  filters: Filter[]
  sorts: Sort[]
  totalRows: number
  project: { ref: string; connectionString: string | null } | undefined
}

export const AllRowsCopyExportActions = ({
  table,
  filters,
  sorts,
  totalRows,
  project,
}: AllRowsCopyExportActionsProps) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const exportParams = project
    ? ({
        enabled: true as const,
        projectRef: project.ref,
        connectionString: project.connectionString,
        entity: table,
        totalRows,
        type: 'fetch_all' as const,
        filters,
        sorts,
      } as const)
    : ({ enabled: false } as const)

  const { exportCsv, confirmationModal: csvModal } = useExportAllRowsAsCsv(exportParams)
  const { exportSql, confirmationModal: sqlModal } = useExportAllRowsAsSql(exportParams)

  const runExport = async (exporter: () => Promise<void>) => {
    if (!project) return toast.error('Project is required')

    try {
      setIsExporting(true)
      await exporter()
    } catch (error) {
      toast.error('Failed to export rows due to error. Please try again later')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <ButtonTooltip
        disabled
        type="default"
        tooltip={{
          content: {
            side: 'bottom',
            className: 'w-64 text-center',
            text: 'Copy to clipboard is not supported while all rows in the table are selected',
          },
        }}
      >
        Copy
      </ButtonTooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" size="tiny" iconRight={<ChevronDown />} loading={isExporting}>
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuItem onClick={() => runExport(exportCsv)}>Export as CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={() => runExport(exportSql)}>Export as SQL</DropdownMenuItem>
          <DropdownMenuItem className="group" onClick={() => setShowExportModal(true)}>
            <div>
              <p className="group-hover:text-foreground">Export via CLI</p>
              <p className="text-foreground-lighter">Recommended for large tables</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        table={table}
        filters={filters}
        sorts={sorts}
        open={showExportModal}
        onOpenChange={() => setShowExportModal(false)}
      />

      {csvModal}
      {sqlModal}
    </>
  )
}

import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import { formatRowsForCopy, hasTruncatedCellValues } from './Header.utils'
import type { SupaRow, SupaTable } from '@/components/grid/types'
import {
  useExportAllRowsAsCsv,
  useExportAllRowsAsJson,
  useExportAllRowsAsSql,
} from '@/components/layouts/TableEditorLayout/ExportAllRows'

interface CopyExportRowsActionsProps {
  rows: SupaRow[]
  table: SupaTable | undefined
  project: { ref: string; connectionString: string | null } | undefined
}

export const CopyExportRowsActions = ({ rows, table, project }: CopyExportRowsActionsProps) => {
  const exportParams =
    table && project && rows.length > 0
      ? ({
          enabled: true as const,
          projectRef: project.ref,
          connectionString: project.connectionString,
          entity: { id: table.id, name: table.name, type: table.type },
          type: 'provided_rows' as const,
          table,
          rows,
        } as const)
      : ({ enabled: false } as const)

  const { exportCsv, confirmationModal: csvModal } = useExportAllRowsAsCsv(exportParams)
  const { exportSql, confirmationModal: sqlModal } = useExportAllRowsAsSql(exportParams)
  const { exportJson, confirmationModal: jsonModal } = useExportAllRowsAsJson(exportParams)

  const disabled = !table || !project || rows.length === 0

  const onCopyRows = (format: 'csv' | 'json' | 'sql') => {
    if (!project || !table) return

    if (hasTruncatedCellValues(rows) && (!table.primaryKey || table.primaryKey.length === 0)) {
      return toast(
        <div>
          <p>Unable to copy rows</p>
          <p className="text-foreground-light text-sm">
            A row has a column value that needs to be fetched on demand due to its size, but the
            table has no primary key.
          </p>
        </div>,
        { duration: 8000 }
      )
    }

    const formatted = formatRowsForCopy({
      rows,
      table,
      format,
      projectRef: project.ref,
      connectionString: project.connectionString,
    })

    copyToClipboard(formatted, () => toast.success('Copied rows to clipboard'))
  }

  const onExportRows = async (exporter: () => Promise<void>) => {
    await exporter()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" size="tiny" iconRight={<ChevronDown />} disabled={disabled}>
            Copy
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-40"
          onFocusOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DropdownMenuItem onClick={() => onCopyRows('csv')}>Copy as CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopyRows('sql')}>Copy as SQL</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopyRows('json')}>Copy as JSON</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" size="tiny" iconRight={<ChevronDown />} disabled={disabled}>
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-40"
          onFocusOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DropdownMenuItem onClick={() => onExportRows(exportCsv)}>Export as CSV</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportRows(exportSql)}>Export as SQL</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportRows(exportJson)}>
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {csvModal}
      {sqlModal}
      {jsonModal}
    </>
  )
}

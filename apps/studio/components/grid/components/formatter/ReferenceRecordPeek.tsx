import { PostgresTable } from '@supabase/postgres-meta'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { COLUMN_MIN_WIDTH } from 'components/grid/constants'
import type { SupaColumn, SupaRow } from 'components/grid/types'
import {
  ESTIMATED_CHARACTER_PIXEL_WIDTH,
  getColumnDefaultWidth,
} from 'components/grid/utils/gridColumns'
import { isArrayColumn, isBinaryColumn, isJsonColumn } from 'components/grid/utils/types'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Copy, Key } from 'lucide-react'
import { useCallback, useMemo, useRef } from 'react'
import DataGrid, { CalculatedColumn, Column } from 'react-data-grid'
import { toast } from 'sonner'
import {
  Button,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  copyToClipboard,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { formatClipboardValue } from '../../utils/common'
import { BinaryFormatter } from './BinaryFormatter'
import { DefaultFormatter } from './DefaultFormatter'
import { JsonFormatter } from './JsonFormatter'

interface ReferenceRecordPeekProps {
  table: PostgresTable
  column: string
  value: string | number | Record<string, unknown>
}

export const ReferenceRecordPeek = ({ table, column, value }: ReferenceRecordPeekProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    data,
    error,
    isSuccess,
    isError,
    isPending: isLoading,
  } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      tableId: table.id,
      filters: [{ column, operator: '=', value }],
      page: 1,
      limit: 10,
    },
    { placeholderData: keepPreviousData }
  )

  const rows = useMemo(() => data?.rows ?? [], [data?.rows])
  const selectedCellRef = useRef<{ idx: number; rowIdx: number } | null>(null)

  const primaryKeys = useMemo(() => table.primary_keys.map((x) => x.name), [table.primary_keys])

  const columns = useMemo(() => {
    return (table?.columns ?? []).map((column) => {
      const columnDefaultWidth = getColumnDefaultWidth({
        dataType: column.data_type,
        format: column.format,
      } as Pick<SupaColumn, 'dataType' | 'format'> as SupaColumn)
      const columnWidthBasedOnName =
        (column.name.length + column.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
      const columnWidth =
        columnDefaultWidth < columnWidthBasedOnName ? columnWidthBasedOnName : columnDefaultWidth
      const isPrimaryKey = primaryKeys.includes(column.name)

      const res: Column<SupaRow> = {
        key: column.name,
        name: column.name,
        resizable: false,
        draggable: false,
        sortable: false,
        width: columnWidth,
        minWidth: COLUMN_MIN_WIDTH,
        headerCellClass: 'outline-none !shadow-none',
        renderHeaderCell: () => (
          <div className="flex h-full items-center justify-center gap-x-2">
            {isPrimaryKey && (
              <Tooltip>
                <TooltipTrigger>
                  <Key size={14} strokeWidth={2} className="text-brand rotate-45" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Primary key</TooltipContent>
              </Tooltip>
            )}
            <span className="text-xs truncate">{column.name}</span>
            <span className="text-xs text-foreground-light font-normal">{column.format}</span>
          </div>
        ),
        renderCell: isBinaryColumn(column.data_type)
          ? BinaryFormatter
          : isJsonColumn(column.data_type) && !isArrayColumn(column.data_type)
            ? JsonFormatter
            : DefaultFormatter,
      }
      return res
    })
  }, [table?.columns, primaryKeys])

  const onCopyCellContent = useCallback(() => {
    if (selectedCellRef.current === null) return

    const { idx, rowIdx } = selectedCellRef.current
    const row = rows[rowIdx]
    const columnKey = columns[idx]?.key
    if (!row || !columnKey) return

    const cellValue = row[columnKey]
    const text = formatClipboardValue(cellValue)

    copyToClipboard(text)
    toast.success('Copied cell value to clipboard')
  }, [rows, columns])

  return (
    <>
      <p className="px-2 py-2 text-xs text-foreground-light border-b">
        Referencing record from{' '}
        <span className="text-foreground">
          {table.schema}.{table.name}
        </span>
        :
      </p>
      <ContextMenu_Shadcn_>
        <ContextMenuTrigger_Shadcn_ asChild>
          <div>
            <DataGrid
              className="h-32 rounded-b border-0"
              columns={columns}
              rows={rows}
              onSelectedCellChange={(args: {
                column: CalculatedColumn<SupaRow, unknown>
                rowIdx: number
                row: SupaRow
              }) => {
                selectedCellRef.current = { idx: args.column.idx, rowIdx: args.rowIdx }
              }}
              onCellDoubleClick={(_, e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              renderers={{
                noRowsFallback: (
                  <div className="w-96 px-2">
                    {isLoading && (
                      <div className="py-2">
                        <ShimmeringLoader />
                      </div>
                    )}
                    {isError && (
                      <p className="text-foreground-light">
                        Failed to find referencing row: {error.message}
                      </p>
                    )}
                    {isSuccess && <p className="text-foreground-light">No results were returned</p>}
                  </div>
                ),
              }}
            />
          </div>
        </ContextMenuTrigger_Shadcn_>
        <ContextMenuContent_Shadcn_ className="min-w-36">
          <ContextMenuItem_Shadcn_ className="gap-x-2" onSelect={onCopyCellContent}>
            <Copy size={12} />
            <span className="text-xs">Copy cell</span>
          </ContextMenuItem_Shadcn_>
        </ContextMenuContent_Shadcn_>
      </ContextMenu_Shadcn_>
      <div className="flex items-center justify-end px-2 py-1">
        <EditorTablePageLink
          href={`/project/${ref}/editor/${table.id}?schema=${table.schema}&filter=${column}%3Aeq%3A${value}`}
          projectRef={ref}
          id={String(table.id)}
          filters={[{ column, operator: '=', value: String(value) }]}
        >
          <Button type="default">Open table</Button>
        </EditorTablePageLink>
      </div>
    </>
  )
}

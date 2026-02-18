import { PostgresTable } from '@supabase/postgres-meta'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { COLUMN_MIN_WIDTH } from 'components/grid/constants'
import {
  ESTIMATED_CHARACTER_PIXEL_WIDTH,
  getColumnDefaultWidth,
} from 'components/grid/utils/gridColumns'
import { isArrayColumn, isBinaryColumn, isJsonColumn } from 'components/grid/utils/types'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Key } from 'lucide-react'
import { useMemo } from 'react'
import DataGrid, { Column } from 'react-data-grid'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { BinaryFormatter } from './BinaryFormatter'
import { DefaultFormatter } from './DefaultFormatter'
import { JsonFormatter } from './JsonFormatter'

interface ReferenceRecordPeekProps {
  table: PostgresTable
  column: string
  value: any
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
      connectionString: project?.connectionString,
      tableId: table.id,
      filters: [{ column, operator: '=', value }],
      page: 1,
      limit: 10,
    },
    { placeholderData: keepPreviousData }
  )

  const primaryKeys = useMemo(() => table.primary_keys.map((x) => x.name), [table.primary_keys])

  const columns = useMemo(() => {
    return (table?.columns ?? []).map((column) => {
      const columnDefaultWidth = getColumnDefaultWidth({
        dataType: column.data_type,
        format: column.format,
      } as any)
      const columnWidthBasedOnName =
        (column.name.length + column.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
      const columnWidth =
        columnDefaultWidth < columnWidthBasedOnName ? columnWidthBasedOnName : columnDefaultWidth
      const isPrimaryKey = primaryKeys.includes(column.name)

      const res: Column<any> = {
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

  return (
    <>
      <p className="px-2 py-2 text-xs text-foreground-light border-b">
        Referencing record from{' '}
        <span className="text-foreground">
          {table.schema}.{table.name}
        </span>
        :
      </p>
      <DataGrid
        className="h-32 rounded-b border-0"
        columns={columns}
        rows={data?.rows ?? []}
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

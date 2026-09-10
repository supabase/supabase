import type { PGTable } from '@supabase/pg-meta'
import { ArrowRight } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'
import { Popover, PopoverContent, PopoverTrigger } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { SupaRow } from '../../types'
import { isColumnMasked } from '../../utils/sensitive-data'
import { NullValue } from '../common/NullValue'
import {
  findColumnForeignKeyConstraint,
  getReferencingRecordFilters,
} from './ForeignKeyFormatter.utils'
import { ReferenceRecordPeek } from './ReferenceRecordPeek'
import { convertByteaToHex } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useForeignKeyConstraintsQuery } from '@/data/database/foreign-key-constraints-query'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { isTableLike } from '@/data/table-editor/table-editor-types'
import { useTableQuery } from '@/data/tables/table-retrieve-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

interface Props extends PropsWithChildren<RenderCellProps<SupaRow, unknown>> {
  tableId?: number
}

export const ForeignKeyFormatter = (props: Props) => {
  const { tableId, row, column } = props
  const snap = useTableEditorTableStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const isMasked = isColumnMasked(
    column.key as string,
    snap.sensitiveDataColumns,
    snap.temporarilyRevealedColumns
  )

  const { data, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: tableId,
  })
  const foreignKeyColumn = data?.columns.find((x) => x.name === column.key)
  const selectedTable = isTableLike(data) ? data : undefined

  // The constraints query returns source/target columns as ordinally paired
  // arrays, which is what a composite foreign key needs to filter correctly.
  const { data: foreignKeys, isPending: isLoadingForeignKeys } = useForeignKeyConstraintsQuery({
    projectRef: project?.ref,
    schema: selectedTable?.schema,
  })

  const foreignKey =
    selectedTable !== undefined
      ? findColumnForeignKeyConstraint({
          foreignKeys: foreignKeys ?? [],
          schema: selectedTable.schema,
          table: selectedTable.name,
          columnName: column.key,
        })
      : undefined

  const { data: targetTable, isPending: isLoadingTargetTable } = useTableQuery<PGTable>(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: foreignKey?.target_schema ?? '',
      name: foreignKey?.target_table ?? '',
    },
    { enabled: !!project?.ref && foreignKey !== undefined }
  )

  const value = row[column.key]
  const formattedValue =
    foreignKeyColumn?.format === 'bytea' && !!value ? convertByteaToHex(value) : value

  const filters =
    foreignKey !== undefined
      ? getReferencingRecordFilters({ foreignKey, row, columns: data?.columns ?? [] })
      : []
  const hasReferencingRecord = filters.length > 0
  const isLoadingMetadata = isLoading || (selectedTable !== undefined && isLoadingForeignKeys)

  return (
    <div className="flex w-full items-center justify-between flex justify-between">
      <span className="m-0 grow overflow-hidden text-ellipsis">
        {formattedValue === null ? <NullValue /> : isMasked ? '••••••••' : formattedValue}
      </span>
      {isLoadingMetadata && formattedValue !== null && (
        <div className="w-6 h-6 flex items-center justify-center">
          <ShimmeringLoader className="w-4 h-4" />
        </div>
      )}
      {!isLoadingMetadata && hasReferencingRecord && (
        <>
          {isLoadingTargetTable && (
            <div className="w-6 h-6 flex items-center justify-center">
              <ShimmeringLoader className="w-4 h-4" />
            </div>
          )}
          {!isLoadingTargetTable && targetTable !== undefined && (
            <Popover>
              <PopoverTrigger asChild>
                <ButtonTooltip
                  variant="default"
                  className="w-6 h-6"
                  aria-label="View referencing record"
                  icon={<ArrowRight />}
                  onClick={(e) => e.stopPropagation()}
                  tooltip={{ content: { side: 'bottom', text: 'View referencing record' } }}
                />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                collisionPadding={8}
                className="p-0 w-96"
                onDoubleClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onContextMenu={(e) => {
                  e.stopPropagation()
                }}
              >
                <ReferenceRecordPeek table={targetTable} filters={filters} />
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
    </div>
  )
}

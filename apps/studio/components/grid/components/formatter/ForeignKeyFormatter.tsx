import type { PostgresTable } from '@supabase/postgres-meta'
import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useTableQuery } from 'data/tables/table-retrieve-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ArrowRight } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { SupaRow } from '../../types'
import { NullValue } from '../common/NullValue'
import { ReferenceRecordPeek } from './ReferenceRecordPeek'

interface Props extends PropsWithChildren<RenderCellProps<SupaRow, unknown>> {
  tableId?: number
}

export const ForeignKeyFormatter = (props: Props) => {
  const { tableId, row, column } = props
  const { data: project } = useSelectedProjectQuery()

  const { data, isPending: isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: tableId,
  })
  const foreignKeyColumn = data?.columns.find((x) => x.name === column.key)
  const selectedTable = isTableLike(data) ? data : undefined

  const relationship = (selectedTable?.relationships ?? []).find(
    (r) =>
      r.source_schema === selectedTable?.schema &&
      r.source_table_name === selectedTable?.name &&
      r.source_column_name === column.name
  )

  const { data: targetTable, isPending: isLoadingTargetTable } = useTableQuery<PostgresTable>(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      schema: relationship?.target_table_schema ?? '',
      name: relationship?.target_table_name ?? '',
    },
    {
      enabled:
        !!project?.ref && !!relationship?.target_table_schema && !!relationship?.target_table_name,
    }
  )

  const value = row[column.key]
  const formattedValue =
    foreignKeyColumn?.format === 'bytea' && !!value ? convertByteaToHex(value) : value

  return (
    <div className="sb-grid-foreign-key-formatter flex justify-between">
      <span className="sb-grid-foreign-key-formatter__text">
        {formattedValue === null ? <NullValue /> : formattedValue}
      </span>
      {isLoading && formattedValue !== null && (
        <div className="w-6 h-6 flex items-center justify-center">
          <ShimmeringLoader className="w-4 h-4" />
        </div>
      )}
      {!isLoading && relationship !== undefined && formattedValue !== null && (
        <>
          {isLoadingTargetTable && (
            <div className="w-6 h-6 flex items-center justify-center">
              <ShimmeringLoader className="w-4 h-4" />
            </div>
          )}
          {!isLoadingTargetTable && targetTable !== undefined && (
            <Popover_Shadcn_>
              <PopoverTrigger_Shadcn_ asChild>
                <ButtonTooltip
                  type="default"
                  className="w-6 h-6"
                  icon={<ArrowRight />}
                  onClick={(e) => e.stopPropagation()}
                  tooltip={{ content: { side: 'bottom', text: 'View referencing record' } }}
                />
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                align="end"
                className="p-0 w-96"
                onDoubleClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <ReferenceRecordPeek
                  table={targetTable}
                  column={relationship.target_column_name}
                  value={formattedValue}
                />
              </PopoverContent_Shadcn_>
            </Popover_Shadcn_>
          )}
        </>
      )}
    </div>
  )
}

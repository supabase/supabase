import { ArrowRight } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { convertByteaToHex } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useTablesQuery } from 'data/tables/tables-query'
import { Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'
import type { SupaRow } from '../../types'
import { NullValue } from '../common/NullValue'
import { ReferenceRecordPeek } from './ReferenceRecordPeek'

interface Props extends PropsWithChildren<RenderCellProps<SupaRow, unknown>> {
  tableId?: string
}

export const ForeignKeyFormatter = (props: Props) => {
  const { project } = useProjectContext()

  const { tableId, row, column } = props
  const id = tableId ? Number(tableId) : undefined

  const { data } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const foreignKeyColumn = data?.columns.find((x) => x.name === column.key)
  const selectedTable = isTableLike(data) ? data : undefined

  const relationship = (selectedTable?.relationships ?? []).find(
    (r) =>
      r.source_schema === selectedTable?.schema &&
      r.source_table_name === selectedTable?.name &&
      r.source_column_name === column.name
  )
  const { data: tables } = useTablesQuery({
    projectRef: project?.ref,
    includeColumns: true,
    connectionString: project?.connectionString,
    schema: relationship?.target_table_schema,
  })
  const targetTable = tables?.find(
    (table) =>
      table.schema === relationship?.target_table_schema &&
      table.name === relationship.target_table_name
  )

  const value = row[column.key]
  const formattedValue =
    foreignKeyColumn?.format === 'bytea' && !!value ? convertByteaToHex(value) : value

  return (
    <div className="sb-grid-foreign-key-formatter flex justify-between">
      <span className="sb-grid-foreign-key-formatter__text">
        {formattedValue === null ? <NullValue /> : formattedValue}
      </span>
      {relationship !== undefined && targetTable !== undefined && formattedValue !== null && (
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
          <PopoverContent_Shadcn_ portal align="end" className="p-0 w-96">
            <ReferenceRecordPeek
              table={targetTable}
              column={relationship.target_column_name}
              value={formattedValue}
            />
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )}
    </div>
  )
}

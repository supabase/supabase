import { ArrowRight } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useTablesQuery } from 'data/tables/tables-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { Button, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import type { SupaRow } from '../../types'
import { NullValue } from '../common/NullValue'

interface Props extends PropsWithChildren<RenderCellProps<SupaRow, unknown>> {
  projectRef?: string
  tableId?: string
}

export const ForeignKeyFormatter = (props: Props) => {
  const { project } = useProjectContext()
  const { selectedSchema } = useQuerySchemaState()

  const { projectRef, tableId, row, column } = props
  const id = tableId ? Number(tableId) : undefined

  const { data } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const selectedTable = isTableLike(data) ? data : undefined

  const relationship = (selectedTable?.relationships ?? []).find(
    (r) =>
      r.source_schema === selectedTable?.schema &&
      r.source_table_name === selectedTable?.name &&
      r.source_column_name === column.name
  )
  const { data: tables } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: relationship?.target_table_schema,
  })
  const targetTable = tables?.find(
    (table) =>
      table.schema === relationship?.target_table_schema &&
      table.name === relationship.target_table_name
  )

  const value = row[column.key]

  return (
    <div className="sb-grid-foreign-key-formatter flex justify-between">
      <span className="sb-grid-foreign-key-formatter__text">
        {value === null ? <NullValue /> : value}
      </span>
      {relationship !== undefined && targetTable !== undefined && value !== null && (
        <Tooltip_Shadcn_ delayDuration={0}>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              asChild
              type="default"
              size="tiny"
              className="translate-y-[2px]"
              style={{ padding: '3px' }}
            >
              <EditorTablePageLink
                href={`/project/${projectRef}/editor/${targetTable?.id}?schema=${selectedSchema}&filter=${relationship?.target_column_name}%3Aeq%3A${value}`}
                projectRef={projectRef}
                id={targetTable && String(targetTable?.id)}
                filters={[
                  {
                    column: relationship.target_column_name,
                    operator: '=',
                    value: String(value),
                  },
                ]}
              >
                <ArrowRight size={14} />
              </EditorTablePageLink>
            </Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">View referencing record</TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      )}
    </div>
  )
}

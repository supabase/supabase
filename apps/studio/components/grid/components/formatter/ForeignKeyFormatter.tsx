import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import type { RenderCellProps } from 'react-data-grid'
import { Button, IconArrowRight } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableQuery } from 'data/tables/table-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import type { SupaRow } from '../../types'
import { NullValue } from '../common/NullValue'

interface Props extends PropsWithChildren<RenderCellProps<SupaRow, unknown>> {
  projectRef?: string
  tableId?: string
}

export const ForeignKeyFormatter = (props: Props) => {
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const { projectRef, tableId, row, column } = props
  const id = tableId ? Number(tableId) : undefined

  const { data: selectedTable } = useTableQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
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
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              type="default"
              size="tiny"
              className="translate-y-[2px]"
              onClick={() => {}}
              style={{ padding: '3px' }}
              asChild
            >
              <Link
                href={`/project/${projectRef}/editor/${targetTable?.id}?filter=${relationship?.target_column_name}%3Aeq%3A${value}`}
                onClick={() => snap.setSelectedSchemaName(relationship.target_table_schema)}
              >
                <IconArrowRight size="tiny" />
              </Link>
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">View referencing record</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </div>
  )
}

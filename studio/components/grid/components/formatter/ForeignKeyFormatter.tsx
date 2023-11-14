import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { RenderCellProps } from 'react-data-grid'
import { Button, IconArrowRight } from 'ui'

import { useParams } from 'common/hooks'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableQuery } from 'data/tables/table-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { SupaRow } from '../../types'
import { NullValue } from '../common'

export const ForeignKeyFormatter = (
  props: PropsWithChildren<RenderCellProps<SupaRow, unknown>>
) => {
  const { project } = useProjectContext()
  const { ref: projectRef, id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { row, column } = props

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
          <Tooltip.Trigger>
            <Link
              href={`/project/${projectRef}/editor/${targetTable?.id}?filter=${relationship?.target_column_name}%3Aeq%3A${value}`}
            >
              <Button
                type="default"
                size="tiny"
                className="translate-y-[2px]"
                onClick={() => {}}
                icon={<IconArrowRight size="tiny" />}
                style={{ padding: '3px' }}
              />
            </Link>
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

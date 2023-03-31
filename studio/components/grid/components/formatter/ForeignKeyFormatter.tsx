import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { FormatterProps } from '@supabase/react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconArrowRight } from 'ui'
import { useStore } from 'hooks'
import { useParams } from 'common/hooks'

export const ForeignKeyFormatter = (props: PropsWithChildren<FormatterProps<SupaRow, unknown>>) => {
  const { ref, id } = useParams()
  const { meta } = useStore()

  const { row, column } = props
  const selectedTable = meta.tables.byId(id as string)
  const relationship = (selectedTable?.relationships ?? []).find(
    (r) =>
      r.source_schema === selectedTable?.schema &&
      r.source_table_name === selectedTable?.name &&
      r.source_column_name === column.name
  )
  const targetTable = meta.tables
    .list()
    .find(
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
              href={`/project/${ref}/editor/${targetTable?.id}?filter=${relationship?.target_column_name}%3Aeq%3A${value}`}
            >
              <a>
                <Button
                  type="default"
                  size="tiny"
                  className="translate-y-[2px]"
                  onClick={() => {}}
                  icon={<IconArrowRight size="tiny" />}
                  style={{ padding: '3px' }}
                />
              </a>
            </Link>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">View referencing record</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </div>
  )
}

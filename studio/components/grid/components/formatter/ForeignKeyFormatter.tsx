import Link from 'next/link'
import { PropsWithChildren } from 'react'
import { FormatterProps } from '@supabase/react-data-grid'
import { SupaRow } from '../../types'
import { NullValue } from '../common'
import { ForeignTableModal } from '../common/ForeignTableModal'
import { useDispatch, useTrackedState } from '../../store'
import { deepClone } from '../../utils'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconArrowRight } from 'ui'
import { useParams } from 'hooks'

export const ForeignKeyFormatter = (p: PropsWithChildren<FormatterProps<SupaRow, unknown>>) => {
  const { ref, id } = useParams()
  const value = p.row[p.column.key]

  return (
    <div className="sb-grid-foreign-key-formatter flex justify-between">
      <span className="sb-grid-foreign-key-formatter__text">
        {value === null ? <NullValue /> : value}
      </span>
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Link href={`/project/${ref}/editor/${id}?filter={primary_key}%3Aeq%3A${value}`}>
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
      </Tooltip.Root>
      {/* <ForeignTableModal columnName={p.column.key} defaultValue={value} onChange={onChange} /> */}
    </div>
  )
}

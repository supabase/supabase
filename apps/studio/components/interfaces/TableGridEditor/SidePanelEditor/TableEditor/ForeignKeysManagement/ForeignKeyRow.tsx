import clsx from 'clsx'
import { useParams } from 'common'
import Link from 'next/link'
import SVG from 'react-inlinesvg'
import { Badge, Button, cn } from 'ui'
import { ArrowRight } from 'lucide-react'

import { BASE_PATH } from 'lib/constants'
import type { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'

interface ForeignKeyProps {
  foreignKey: ForeignKey
  disabled?: boolean
  status?: 'ADD' | 'UPDATE' | 'REMOVE'
  layout?: 'vertical' | 'horizontal'
  closePanel: () => void
  onSelectEdit: () => void
  onSelectRemove: () => void
  onSelectUndoRemove: () => void
}

export const ForeignKeyRow = ({
  foreignKey,
  disabled = false,
  status,
  layout = 'horizontal',
  closePanel,
  onSelectEdit,
  onSelectRemove,
  onSelectUndoRemove,
}: ForeignKeyProps) => {
  const { ref } = useParams()

  return (
    <div
      className={clsx(
        layout === 'horizontal' ? 'items-center justify-between gap-x-2' : 'flex-col gap-y-3',
        'flex border border-strong px-4 py-4',
        'border-b-0 last:border-b first:rounded-t-md last:rounded-b-md'
      )}
    >
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-col gap-y-1">
          {foreignKey.name && (
            <p title={foreignKey.name} className="text-xs text-foreground font-mono">
              {foreignKey.name}
            </p>
          )}
          <div className="flex items-center gap-x-2">
            {status !== undefined && (
              <Badge
                variant={
                  status === 'ADD' ? 'brand' : status === 'UPDATE' ? 'warning' : 'destructive'
                }
              >
                {status}
              </Badge>
            )}
            <p className="text-sm text-foreground-light">
              {foreignKey.columns.length > 1 ? 'Composite foreign' : 'Foreign'} key relation to:
            </p>
            <Button
              asChild
              type="default"
              title={`${foreignKey.schema}.${foreignKey.table}`}
              className="py-0.5 px-1.5 font-mono"
              icon={
                <SVG
                  className="table-icon"
                  src={`${BASE_PATH}/img/icons/table-icon.svg`}
                  style={{ width: `16px`, height: `16px`, strokeWidth: '1px' }}
                  preProcessor={(code: any) =>
                    code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                  }
                  loader={<span className="block w-4 h-4 bg-[#133929] rounded-sm" />}
                  cacheRequests={true}
                />
              }
            >
              <Link
                href={`/project/${ref}/editor/${foreignKey.tableId}`}
                onClick={() => closePanel()}
              >
                {foreignKey.schema}.{foreignKey.table}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          {foreignKey.columns.map((x, idx) => (
            <div key={`relation-${idx}}`} className="flex items-center gap-x-2">
              <code
                className={cn('text-xs', (x?.source ?? '').length === 0 && 'text-foreground-light')}
              >
                {x.source || '[column_name]'}
              </code>
              <ArrowRight size={16} />
              <code className="text-xs">
                {foreignKey.schema}.{foreignKey.table}.{x.target}
              </code>
            </div>
          ))}
        </div>
      </div>
      {!disabled && (
        <div className="flex items-center gap-x-2">
          <Button type="default" onClick={onSelectEdit}>
            Edit
          </Button>
          {foreignKey.toRemove ? (
            <Button type="default" onClick={onSelectUndoRemove}>
              Cancel remove
            </Button>
          ) : (
            <Button type="default" onClick={onSelectRemove}>
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

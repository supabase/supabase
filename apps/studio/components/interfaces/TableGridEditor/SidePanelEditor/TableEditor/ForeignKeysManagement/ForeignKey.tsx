import { useParams } from 'common'
import Link from 'next/link'
import SVG from 'react-inlinesvg'
import { Button, IconArrowRight } from 'ui'

import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { BASE_PATH } from 'lib/constants'
import clsx from 'clsx'

interface ForeignKeyProps {
  foreignKey: ForeignKeyConstraint
  closePanel: () => void
  onSelectEdit: () => void
  onSelectRemove: () => void
}

export const ForeignKey = ({
  foreignKey,
  closePanel,
  onSelectEdit,
  onSelectRemove,
}: ForeignKeyProps) => {
  const { ref } = useParams()

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-x-2 border border-strong px-4 py-4',
        'first:border-b-0 first:rounded-t-md last:rounded-b-md'
      )}
    >
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          <p className="text-sm text-foreground-light">
            {foreignKey.source_columns.length > 1 ? 'Composite foreign' : 'Foreign'} key relation to
          </p>
          <Button
            asChild
            type="default"
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
              href={`/project/${ref}/editor/${foreignKey.target_id}`}
              onClick={() => closePanel()}
            >
              {foreignKey.target_schema}.{foreignKey.target_table}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-y-1">
          {foreignKey.source_columns.map((x, idx) => (
            <div key={x} className="flex items-center gap-x-2">
              <code className="text-xs">{x}</code>
              <IconArrowRight />
              <code className="text-xs">
                {foreignKey.target_schema}.{foreignKey.target_table}.
                {foreignKey.target_columns[idx]}
              </code>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <Button type="default" onClick={onSelectEdit}>
          Edit
        </Button>
        <Button type="default" onClick={onSelectRemove}>
          Remove
        </Button>
      </div>
    </div>
  )
}

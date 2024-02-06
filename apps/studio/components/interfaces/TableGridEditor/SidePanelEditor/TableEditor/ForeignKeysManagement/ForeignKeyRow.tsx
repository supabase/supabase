import clsx from 'clsx'
import { useParams } from 'common'
import Link from 'next/link'
import SVG from 'react-inlinesvg'
import { Button, IconArrowRight } from 'ui'

import { BASE_PATH } from 'lib/constants'
import { ForeignKey } from '../../ForeignKeySelectorV2/ForeignKeySelector.types'

interface ForeignKeyProps {
  foreignKey: ForeignKey
  status: string
  closePanel: () => void
  onSelectEdit: () => void
  onSelectRemove: () => void
}

export const ForeignKeyRow = ({
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
        'border-b-0 last:border-b first:rounded-t-md last:rounded-b-md'
      )}
    >
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          <p className="text-sm text-foreground-light">
            {foreignKey.columns.length > 1 ? 'Composite foreign' : 'Foreign'} key relation to
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
            {/* [Joshen TODO] Fix this */}
            <Link href={`/project/${ref}/editor/${0}`} onClick={() => closePanel()}>
              {foreignKey.schema}.{foreignKey.table}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-y-1">
          {foreignKey.columns.map((x, idx) => (
            <div key={`relation-${idx}}`} className="flex items-center gap-x-2">
              <code className="text-xs">{x.source}</code>
              <IconArrowRight />
              <code className="text-xs">
                {foreignKey.schema}.{foreignKey.table}.{x.target}
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

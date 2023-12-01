import { DiamondIcon, Fingerprint, Hash, Key, Table2 } from 'lucide-react'
import { Handle, NodeProps } from 'reactflow'
import { cn } from 'ui'
import { NODE_WIDTH } from './SchemaFlow.constants'

export type TableNodeData = {
  name: string
  isForeign: boolean
  columns: {
    id: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isIdentity: boolean
    name: string
    format: string
  }[]
}

const TableNode = ({ data, targetPosition, sourcePosition }: NodeProps<TableNodeData>) => {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'

  const itemHeight = 'h-[22px]'

  return (
    <>
      {data.isForeign ? (
        <div className="rounded-lg">
          <header className="text-[0.5rem] leading-5 font-bold px-2 text-center bg-brand text-gray-300">
            {data.name}
            {targetPosition && (
              <Handle
                type="target"
                id={data.name}
                position={targetPosition}
                className={cn(hiddenNodeConnector, '!left-0')}
              />
            )}
          </header>
        </div>
      ) : (
        <div
          className="border border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
          style={{ width: NODE_WIDTH / 2 }}
        >
          <header
            className={cn(
              'text-[0.55rem] px-2 bg-alternative text-default flex gap-1 items-center',
              itemHeight
            )}
          >
            <Table2 strokeWidth={1} size={12} className="text-light" />
            {data.name}
          </header>

          {data.columns.map((column) => (
            <div
              className={cn(
                'text-[8px] leading-5 relative flex flex-row justify-items-start',
                'bg-surface-100',
                'border-t',
                'border-t-[0.5px]',
                // 'odd:bg-scale-300',
                // 'even:bg-scale-400',
                'hover:bg-scale-500 transition cursor-default',
                itemHeight
              )}
              key={column.id}
            >
              <div className="gap-[0.24rem] flex mx-2 align-middle basis-1/5 items-center justify-start">
                {column.isPrimary && (
                  <Key
                    size={8}
                    strokeWidth={1}
                    className={cn(
                      // 'sb-grid-column-header__inner__primary-key'
                      'flex-shrink-0',
                      'text-light'
                    )}
                  />
                )}
                {column.isNullable && (
                  <DiamondIcon size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
                {!column.isNullable && (
                  <DiamondIcon
                    size={8}
                    strokeWidth={1}
                    fill="currentColor"
                    className="flex-shrink-0 text-light"
                  />
                )}
                {column.isUnique && (
                  <Fingerprint size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
                {column.isIdentity && (
                  <Hash size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                )}
              </div>
              <div className="flex w-full justify-between">
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {column.name}
                </span>
                <span className="px-2 inline-flex justify-end font-mono text-lighter text-[0.4rem]">
                  {column.format}
                </span>
              </div>
              {targetPosition && (
                <Handle
                  type="target"
                  id={column.id}
                  position={targetPosition}
                  className={cn(hiddenNodeConnector, '!left-0')}
                />
              )}
              {sourcePosition && (
                <Handle
                  type="source"
                  id={column.id}
                  position={sourcePosition}
                  className={cn(hiddenNodeConnector, '!right-0')}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default TableNode

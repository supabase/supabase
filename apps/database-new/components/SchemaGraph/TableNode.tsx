import { Diamond, Fingerprint } from 'lucide-react'
import { IconHash, IconKey, cn } from 'ui'
import { Handle, NodeProps } from 'reactflow'
import { NODE_WIDTH } from './SchemaGraph.constants'

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

  return (
    <>
      {data.isForeign ? (
        <div className="rounded-lg overflow-hidden">
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
        <div className="rounded-lg overflow-hidden" style={{ width: NODE_WIDTH / 2 }}>
          <header className="text-[0.5rem] leading-5 font-bold px-2 text-center bg-brand text-gray-300">
            {data.name}
          </header>

          {data.columns.map((column) => (
            <div
              className="text-[8px] leading-5 relative flex flex-row justify-items-start odd:bg-scale-300 even:bg-scale-400"
              key={column.id}
            >
              <div className="gap-[0.24rem] flex mx-2 align-middle basis-1/5 items-center justify-start">
                {column.isPrimary && (
                  <IconKey
                    size={8}
                    strokeWidth={2}
                    className="sb-grid-column-header__inner__primary-key flex-shrink-0"
                  />
                )}
                {column.isNullable && (
                  <Diamond size={8} strokeWidth={2} className="flex-shrink-0" />
                )}
                {!column.isNullable && (
                  <Diamond size={8} strokeWidth={2} fill="currentColor" className="flex-shrink-0" />
                )}
                {column.isUnique && (
                  <Fingerprint size={8} strokeWidth={2} className="flex-shrink-0" />
                )}
                {column.isIdentity && (
                  <IconHash size={8} strokeWidth={2} className="flex-shrink-0" />
                )}
              </div>
              <div className="flex w-full justify-between">
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                  {column.name}
                </span>
                <span
                  className={cn(
                    column.isPrimary && 'pl-[6px]',
                    'absolute top-0 left-0 right-0 pl-2 bg-scale-500 text-ellipsis overflow-hidden whitespace-nowrap opacity-0 hover:opacity-100'
                  )}
                >
                  {column.name}
                </span>
                <span className="px-2 inline-flex justify-end">{column.format}</span>
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

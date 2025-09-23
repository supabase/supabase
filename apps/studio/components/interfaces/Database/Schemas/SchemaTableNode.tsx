import { DiamondIcon, ExternalLink, Fingerprint, Hash, Key, Table2 } from 'lucide-react'
import Link from 'next/link'
import { Handle, NodeProps } from 'reactflow'

import { Button, cn } from 'ui'

// ReactFlow is scaling everything by the factor of 2
const TABLE_NODE_WIDTH = 320
const TABLE_NODE_ROW_HEIGHT = 40

export type TableNodeData = {
  id?: number
  name: string
  ref: string
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

const TableNode = ({
  data,
  targetPosition,
  sourcePosition,
  placeholder,
}: NodeProps<TableNodeData> & { placeholder?: boolean }) => {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'

  const itemHeight = 'h-[22px]'

  return (
    <>
      {data.isForeign ? (
        <header className="text-[0.55rem] px-2 py-1 border-[0.5px] rounded-[4px] bg-alternative flex gap-1 items-center">
          {data.name}
          {targetPosition && (
            <Handle
              type="target"
              id={data.name}
              position={targetPosition}
              className={cn(hiddenNodeConnector)}
            />
          )}
        </header>
      ) : (
        <div
          className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
          style={{ width: TABLE_NODE_WIDTH / 2 }}
        >
          <header
            className={cn(
              'text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center justify-between',
              itemHeight
            )}
          >
            <div className="flex gap-x-1 items-center">
              <Table2 strokeWidth={1} size={12} className="text-light" />
              {data.name}
            </div>
            {data.id && !placeholder && (
              <Button asChild type="text" className="px-0 w-[16px] h-[16px] rounded">
                <Link href={`/project/${data.ref}/editor/${data.id}`}>
                  <ExternalLink size={10} className="text-foreground-light" />
                </Link>
              </Button>
            )}
          </header>

          {data.columns.map((column) => (
            <div
              className={cn(
                'text-[8px] leading-5 relative flex flex-row justify-items-start',
                'bg-surface-100',
                'border-t',
                'border-t-[0.5px]',
                'hover:bg-scale-500 transition cursor-default',
                itemHeight
              )}
              key={column.id}
            >
              <div
                className={cn(
                  'gap-[0.24rem] flex mx-2 align-middle items-center justify-start',
                  column.isPrimary && 'basis-1/5'
                )}
              >
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
                <span className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[85px]">
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

export { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH, TableNode }

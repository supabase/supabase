import { buildTableEditorUrl } from 'components/grid/SupabaseGrid.utils'
import {
  DiamondIcon,
  Edit,
  ExternalLink,
  Fingerprint,
  Hash,
  InfoIcon,
  Key,
  Table2,
} from 'lucide-react'
import Link from 'next/link'
import { Handle, NodeProps } from 'reactflow'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useColumnEditionContext } from './ColumnEditionContext'

// ReactFlow is scaling everything by the factor of 2
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40

export type TableNodeData = {
  id: number
  schema: string
  name: string
  ref?: string
  isForeign: boolean
  description: string
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

export const TableNode = ({
  data,
  targetPosition,
  sourcePosition,
  placeholder,
}: NodeProps<TableNodeData> & { placeholder?: boolean }) => {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'
  const columnEditionContext = useColumnEditionContext()

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
            <div className="flex items-center gap-2">
              {data.description && (
                <Tooltip>
                  <TooltipTrigger asChild className="cursor-default ">
                    <InfoIcon size={10} className="text-light" />
                  </TooltipTrigger>
                  <TooltipContent side="top">{data.description}</TooltipContent>
                </Tooltip>
              )}

              {!placeholder && (
                <Button asChild type="text" className="px-0 w-[16px] h-[16px] rounded">
                  <Link
                    href={buildTableEditorUrl({
                      projectRef: data.ref,
                      tableId: data.id,
                      schema: data.schema,
                    })}
                  >
                    <ExternalLink size={10} className="text-foreground-light" />
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {data.columns.map((column) => (
            <div
              className={cn(
                'text-[8px] leading-5 relative flex flex-row justify-items-start',
                'bg-surface-100',
                'border-t',
                'border-t-[0.5px]',
                'hover:bg-scale-500 transition cursor-default',
                'group',
                'pr-1',
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
                <span className="pl-2 pr-1 inline-flex justify-end font-mono text-lighter text-[0.4rem] group-hover:hidden">
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="text"
                    className="hidden group-hover:inline-block absolute right-0 px-0 mr-1 w-[16px] h-[16px] rounded"
                    onClick={() => {
                      columnEditionContext.onEditColumn(data.id, column.id)
                    }}
                  >
                    <Edit size={10} className="text-foreground-light" />
                    <span className="sr-only">
                      Edit {data.name} {column.name} column
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit column</TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

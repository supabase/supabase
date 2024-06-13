import { AnimatePresence, m } from 'framer-motion'
import { DiamondIcon, Fingerprint, Hash, Key, Table2 } from 'lucide-react'
import { useState } from 'react'
import {
  EdgeProps,
  Handle,
  NodeProps,
  Position,
  getSmoothStepPath,
  useUpdateNodeInternals,
} from 'reactflow'
import { cn } from 'ui'

// ReactFlow is scaling everything by the factor of 2
export const TABLE_NODE_WIDTH = 320
export const TABLE_NODE_ROW_HEIGHT = 40

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

const inOutTop = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  show: {
    opacity: 1,
    y: 0,
  },
}

/**
 * Custom node to display database tables.
 */
export const TableNode = ({
  id,
  data,
  targetPosition,
  sourcePosition,
}: NodeProps<TableNodeData>) => {
  const updateNodeInternals = useUpdateNodeInternals()
  const [showHandles, setShowHandles] = useState(false)

  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'

  const itemHeight = 'h-[22px]'

  if (data.isForeign) {
    return (
      <header className="text-[0.55rem] px-2 py-1 border-[0.5px] rounded-[4px] bg-alternative text-default flex gap-1 items-center">
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
    )
  }

  return (
    <m.div
      className="overflow-hidden rounded-[4px] shadow-md bg-scale-400"
      style={{ width: TABLE_NODE_WIDTH / 2 }}
      variants={{
        hidden: {
          scale: 0,
        },
        show: {
          scale: 1,
        },
      }}
      initial="hidden"
      animate="show"
      onAnimationComplete={() => {
        setShowHandles(true)
        updateNodeInternals(id)
      }}
    >
      <header
        className={cn(
          'text-[0.55rem] px-2 bg-brand-600 text-white flex gap-1 items-center',
          itemHeight
        )}
      >
        <Table2 strokeWidth={1} size={12} className="" />

        {/* Animate the old title out and new title in */}
        <AnimatePresence mode="popLayout">
          <m.span
            key={data.name}
            className="font-medium"
            variants={inOutTop}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {data.name}
          </m.span>
        </AnimatePresence>
      </header>

      {data.columns.map((column) => (
        <m.div
          key={column.id}
          className={cn(
            'text-[8px] leading-5 relative flex flex-row justify-items-start',
            'bg-neutral-300',
            'border-t border-neutral-200',
            'border-t-[0.5px]',
            'overflow-hidden',
            itemHeight
          )}
          variants={{
            hidden: {
              opacity: 0,
            },
            show: {
              opacity: 1,
            },
          }}
          initial="hidden"
          animate="show"
          exit="hidden"
          transition={{ staggerChildren: 0.05 }}
        >
          <div
            className={cn(
              'gap-[0.24rem] flex mx-2 align-middle items-center justify-start',
              column.isPrimary && 'basis-1/5'
            )}
          >
            {/* Animate the icon in and out */}
            <AnimatePresence mode="popLayout">
              {column.isPrimary && (
                <m.div
                  key={String(column.isPrimary)}
                  variants={inOutTop}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <Key size={8} strokeWidth={1} className={cn('flex-shrink-0', 'text-light')} />
                </m.div>
              )}
            </AnimatePresence>

            {/* Animate the old icon out and new icon in */}
            <AnimatePresence mode="popLayout">
              {column.isNullable ? (
                <m.div
                  key={String(column.isNullable)}
                  variants={inOutTop}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <DiamondIcon size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                </m.div>
              ) : (
                <m.div
                  key={String(column.isNullable)}
                  variants={inOutTop}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <DiamondIcon
                    size={8}
                    strokeWidth={1}
                    fill="currentColor"
                    className="flex-shrink-0 text-light"
                  />
                </m.div>
              )}
            </AnimatePresence>

            {/* Animate the icon in and out */}
            <AnimatePresence mode="popLayout">
              {column.isUnique && (
                <m.div
                  key={String(column.isUnique)}
                  variants={inOutTop}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <Fingerprint size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                </m.div>
              )}
            </AnimatePresence>

            {/* Animate the icon in and out */}
            <AnimatePresence mode="popLayout">
              {column.isIdentity && (
                <m.div
                  key={String(column.isIdentity)}
                  variants={inOutTop}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                >
                  <Hash size={8} strokeWidth={1} className="flex-shrink-0 text-light" />
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex w-full justify-between">
            {/* Animate the old name out and new name in */}
            <AnimatePresence mode="popLayout">
              <m.span
                key={column.name}
                className="text-ellipsis overflow-hidden whitespace-nowrap max-w-[85px]"
                variants={inOutTop}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                {column.name}
              </m.span>
            </AnimatePresence>

            {/* Animate the old type out and new type in */}
            <AnimatePresence mode="popLayout">
              <m.span
                key={column.format}
                className="px-2 inline-flex justify-end font-mono text-lighter text-[0.4rem]"
                variants={inOutTop}
                initial="hidden"
                animate="show"
                exit="hidden"
              >
                {column.format}
              </m.span>
            </AnimatePresence>
          </div>

          {showHandles && targetPosition && (
            <Handle
              type="target"
              id={column.id}
              position={targetPosition}
              className={cn(hiddenNodeConnector, '!left-0')}
            />
          )}

          {showHandles && sourcePosition && (
            <Handle
              type="source"
              id={column.id}
              position={sourcePosition}
              className={cn(hiddenNodeConnector, '!right-0')}
            />
          )}
        </m.div>
      ))}
    </m.div>
  )
}

/**
 * Custom edge that animates its path length.
 */
export function TableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  markerEnd,
  markerStart,
  pathOptions,
}: EdgeProps) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: pathOptions?.borderRadius,
    offset: pathOptions?.offset,
  })

  return (
    <>
      <defs>
        {/* Create a mask with the same shape that animates its path length */}
        <mask id={`mask-${id}`}>
          <m.path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth={10}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25 }}
          />
        </mask>
      </defs>
      <path
        id={id}
        d={path}
        style={style}
        className={cn(['react-flow__edge-path'])}
        fill="none"
        mask={`url(#mask-${id})`}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
    </>
  )
}

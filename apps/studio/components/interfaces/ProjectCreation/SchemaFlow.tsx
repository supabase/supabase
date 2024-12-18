import {
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Position,
  useStore,
  Edge,
  Node,
  applyNodeChanges,
  MiniMap,
  NodeProps,
} from 'reactflow'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { TableNode, TableNodeData } from '../Database/Schemas/SchemaTableNode'

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface SchemaFlowProps {
  nodes: Node[]
  edges: Edge[]
}

export function SchemaFlow({ nodes: initialNodes, edges: initialEdges }: SchemaFlowProps) {
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  const nodeTypes = useMemo(
    () => ({ table: (props: NodeProps<TableNodeData>) => <TableNode {...props} placeholder /> }),
    []
  )
  const reactFlowInstance = useReactFlow<TableNodeData>()

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  useEffect(() => {
    reactFlowInstance.fitView()
  }, [reactFlowInstance, nodes, edges])

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  return (
    <div
      style={{ maskImage: 'linear-gradient(to right, transparent 2%, black 13%)' }}
      className="absolute inset-0"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          deletable: false,
          style: {
            stroke: 'hsl(var(--border-stronger))',
            strokeWidth: 0.5,
          },
        }}
        fitView
        minZoom={0.8}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        panOnScrollSpeed={1}
      >
        <Background
          gap={16}
          className="[&>*]:stroke-foreground-muted opacity-[25%]"
          variant={BackgroundVariant.Dots}
          color={'inherit'}
        />
      </ReactFlow>
    </div>
  )
}

function useOnResize(fn: () => void, debounce = 200) {
  const reactFlowInstance = useReactFlow()

  const width = useStore(({ width }) => width)
  const height = useStore(({ height }) => height)

  const debouncedWidth = useDebounce(width, debounce)
  const debouncedHeight = useDebounce(height, debounce)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, [reactFlowInstance, debouncedWidth, debouncedHeight])
}

type ResizeHandlerProps = {
  onResize: () => void
  debounce?: number
}

/**
 * Component to detect React Flow container resizes.
 * Calls `onResize` when `width` or `height` changes.
 *
 * Debounces at 200ms by default.
 *
 * It's better to use this child component instead of the
 * `useOnResize` hook directly in order to prevent a large
 * amount of re-renders on the main component.
 */
function ResizeHandler({ onResize, debounce = 200 }: ResizeHandlerProps) {
  useOnResize(onResize, debounce)

  return null
}

export function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { Table2 } from 'lucide-react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  Position,
  Handle,
  type Node,
  type Edge,
} from 'reactflow'
import dagre from '@dagrejs/dagre'
import 'reactflow/dist/style.css'

import { cn } from 'ui'

type ExplainPlanFlowProps = {
  json: string
}

type RawPlan = {
  ['Node Type']?: string
  ['Parallel Aware']?: boolean
  ['Async Capable']?: boolean
  ['Relation Name']?: string
  Alias?: string
  ['Startup Cost']?: number
  ['Total Cost']?: number
  ['Plan Rows']?: number
  ['Plan Width']?: number
  Filter?: string
  ['Parent Relationship']?: string
  ['Scan Direction']?: string
  ['Index Name']?: string
  ['Order By']?: string
  Plans?: RawPlan[]
}

type PlanRoot = { Plan: RawPlan }

const NODE_TYPE = 'plan'
const DEFAULT_NODE_WIDTH = 180
const DEFAULT_NODE_HEIGHT = 40

const getLayoutedElementsViaDagre = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 25,
    ranksep: 50,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    node.position = {
      x: nodeWithPosition.x - DEFAULT_NODE_WIDTH / 2,
      y: nodeWithPosition.y - DEFAULT_NODE_HEIGHT / 2,
    }
  })

  return { nodes, edges }
}

type PlanNodeData = {
  label: string
  startupCost?: number
  totalCost?: number
  planRows?: number
  planWidth?: number
  relationName?: string
  alias?: string
  filter?: string
  parallelAware?: boolean
  asyncCapable?: boolean
  parentRelationship?: string
  scanDirection?: string
  indexName?: string
  orderBy?: string
}

const buildGraphFromPlan = (
  planJson: PlanRoot[]
): { nodes: Node<PlanNodeData>[]; edges: Edge[] } => {
  const nodes: Node<PlanNodeData>[] = []
  const edges: Edge[] = []

  const addPlan = (plan: RawPlan, parentId?: string, index: number = 0) => {
    const id = parentId ? `${parentId}-${index}` : 'root'
    const label = plan['Node Type'] ?? 'Node'
    const data: PlanNodeData = {
      label,
      startupCost: plan['Startup Cost'],
      totalCost: plan['Total Cost'],
      planRows: plan['Plan Rows'],
      planWidth: plan['Plan Width'],
      relationName: plan['Relation Name'],
      alias: plan['Alias'] ?? plan.Alias,
      filter: plan['Filter'],
      parallelAware: plan['Parallel Aware'],
      asyncCapable: plan['Async Capable'],
      parentRelationship: plan['Parent Relationship'],
      scanDirection: plan['Scan Direction'],
      indexName: plan['Index Name'],
      orderBy: plan['Order By'],
    }
    nodes.push({
      id,
      type: NODE_TYPE,
      data,
      position: { x: 0, y: 0 },
    })
    if (parentId)
      edges.push({ id: `${parentId}->${id}`, source: parentId, target: id, animated: true })
    const children: RawPlan[] = plan['Plans'] ?? []
    children.forEach((child, i) => addPlan(child, id, i))
  }

  if (Array.isArray(planJson) && planJson.length > 0 && planJson[0].Plan) {
    addPlan(planJson[0].Plan)
  }

  return getLayoutedElementsViaDagre(nodes, edges)
}

/**
 * @see: https://github.com/wbkd/react-flow/discussions/2698
 */
const hiddenNodeConnector = 'opacity-0'
const PlanNode = ({ data }: { data: PlanNodeData }) => {
  const itemHeight = 'h-[22px]'

  return (
    <div
      className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
      style={{ width: DEFAULT_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className={hiddenNodeConnector} />
      <header
        className={cn(
          'text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center justify-between',
          itemHeight
        )}
      >
        <div className="flex gap-x-1 items-center">
          <Table2 strokeWidth={1} size={12} className="text-light" />
          {data.label}
        </div>
      </header>

      <ul>
        {data.startupCost !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>cost</span>
              <span>{data.startupCost}</span>
            </div>
          </li>
        )}
        {data.totalCost !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>cost</span>
              <span>{data.totalCost}</span>
            </div>
          </li>
        )}
        {data.planRows !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>rows</span>
              <span>{data.planRows}</span>
            </div>
          </li>
        )}
        {data.planWidth !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>width</span>
              <span>{data.planWidth}</span>
            </div>
          </li>
        )}
      </ul>
      <Handle type="source" position={Position.Bottom} className={hiddenNodeConnector} />
    </div>
  )
}

export const ExplainPlanFlow = ({ json }: ExplainPlanFlowProps) => {
  const { nodes, edges } = useMemo((): { nodes: Node[]; edges: Edge[] } => {
    try {
      const parsed = JSON.parse(json)
      return buildGraphFromPlan(parsed)
    } catch (e) {
      return { nodes: [], edges: [] }
    }
  }, [json])

  const { resolvedTheme } = useTheme()
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  return (
    <div className="w-full h-full border border-green-500">
      <ReactFlow
        defaultNodes={[]}
        defaultEdges={[]}
        nodesConnectable={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          deletable: false,
          style: {
            stroke: 'hsl(var(--border-stronger))',
            strokeWidth: 1,
          },
        }}
        fitView
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        minZoom={0.8}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          if (nodes.length > 0) {
            setTimeout(() => instance.fitView({}))
          }
        }}
      >
        <Background
          gap={16}
          className="[&>*]:stroke-foreground-muted opacity-[25%]"
          variant={BackgroundVariant.Dots}
          color={'inherit'}
        />
        <MiniMap
          pannable
          zoomable
          nodeColor="#111318"
          maskColor={miniMapMaskColor}
          className="border rounded-md shadow-sm"
        />
      </ReactFlow>
    </div>
  )
}

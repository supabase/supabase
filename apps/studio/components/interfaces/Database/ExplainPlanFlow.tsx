import { useMemo } from 'react'
import ReactFlow, { Background, BackgroundVariant, Edge, MiniMap, Node } from 'reactflow'
import 'reactflow/dist/style.css'

type ExplainPlanFlowProps = {
  json: string
}

type RawPlan = {
  ['Node Type']?: string
  Plans?: RawPlan[]
}

type PlanRoot = { Plan: RawPlan }

const DEFAULT_NODE_TYPE = 'default'

const X_STEP = 280
const Y_STEP = 120

const buildGraphFromPlan = (planJson: PlanRoot[]): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const levelCounts: Record<number, number> = {}

  const addPlan = (plan: RawPlan, parentId?: string, index: number = 0, depth: number = 0) => {
    const id = parentId ? `${parentId}-${index}` : 'root'
    const label = plan['Node Type'] ?? 'Node'
    const yIndex = levelCounts[depth] ?? 0
    levelCounts[depth] = yIndex + 1
    nodes.push({
      id,
      type: DEFAULT_NODE_TYPE,
      data: { label },
      position: { x: depth * X_STEP, y: yIndex * Y_STEP },
    })
    if (parentId)
      edges.push({ id: `${parentId}->${id}`, source: parentId, target: id, animated: true })
    const children: RawPlan[] = plan['Plans'] ?? []
    children.forEach((child, i) => addPlan(child, id, i, depth + 1))
  }

  if (Array.isArray(planJson) && planJson.length > 0 && planJson[0].Plan) {
    addPlan(planJson[0].Plan)
  }
  return { nodes, edges }
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

  return (
    <div className="w-full h-full border border-green-500">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        defaultEdgeOptions={{ type: 'smoothstep', animated: true, deletable: false }}
        minZoom={0.8}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          if (nodes.length > 0) {
            setTimeout(() => instance.fitView({}))
          }
        }}
        fitView
      >
        <Background
          gap={16}
          className="[&>*]:stroke-foreground-muted opacity-[25%]"
          variant={BackgroundVariant.Dots}
          color={'inherit'}
        />
        <MiniMap pannable zoomable className="border rounded-md shadow-sm" />
      </ReactFlow>
    </div>
  )
}

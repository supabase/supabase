import { ArrowRight, ArrowUpRight, Circle, Database, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo } from 'react'
import ReactFlow, { Background, Handle, Position, ReactFlowProvider } from 'reactflow'

import 'reactflow/dist/style.css'

import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import { Button, Card, CardContent } from 'ui'

import { NODE_WIDTH } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'

const STATIC_NODES = [
  {
    id: '1',
    type: 'primary',
    data: {
      label: 'Primary Database',
      region: 'East US (Ohio)',
      provider: 'AWS',
      regionIcon: 'us-east-1',
    },
    position: { x: 825, y: 0 },
  },
  {
    id: '2',
    type: 'replica',
    data: {
      label: 'Iceberg',
      details: '3 tables',
      regionIcon: 'us-west-1',
    },
    position: { x: 875, y: 110 },
  },
  {
    id: '3',
    type: 'replica',
    data: {
      label: 'BigQuery',
      details: '5 tables',
      regionIcon: 'us-west-1',
    },
    position: { x: 875, y: 200 },
  },
  {
    id: '4',
    type: 'blank',
    position: { x: 875, y: 290 },
    data: {},
  },
  {
    id: '5',
    type: 'cta',
    position: { x: 125, y: 20 },
    data: {},
  },
]

const STATIC_EDGES = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
  { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: true },
  { id: 'e1-4', source: '1', target: '4', type: 'smoothstep', animated: true },
]

export const ReplicationComingSoon = () => {
  return (
    <ReactFlowProvider>
      <ReplicationStaticMockup />
    </ReactFlowProvider>
  )
}

const ReplicationStaticMockup = () => {
  const { ref: projectRef = '_' } = useParams()
  const nodes = useMemo(() => STATIC_NODES, [])
  const edges = useMemo(() => STATIC_EDGES, [])

  const { resolvedTheme } = useTheme()

  const backgroundPatternColor =
    resolvedTheme === 'dark' && projectRef !== '_'
      ? 'rgba(255, 255, 255, 0.3)'
      : 'rgba(0, 0, 0, 0.4)'

  const nodeTypes = useMemo(
    () => ({
      primary: PrimaryNode,
      replica: ReplicaNode,
      blank: BlankNode,
      cta: () => CTANode({ projectRef }),
    }),
    [projectRef]
  )

  return (
    <div className="relative border-t h-full w-full">
      <ReactFlow
        fitView
        fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
        className="instance-configuration"
        zoomOnPinch={false}
        zoomOnScroll={false}
        nodesDraggable={true}
        nodesConnectable={false}
        zoomOnDoubleClick={false}
        edgesFocusable={false}
        edgesUpdatable={false}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={backgroundPatternColor} />
      </ReactFlow>
    </div>
  )
}

const PrimaryNode = ({
  data,
}: {
  data: { label: string; region: string; provider: string; regionIcon: string }
}) => {
  return (
    <div className="flex flex-col rounded bg-surface-100 border border-default">
      <div className="flex items-start justify-between p-3" style={{ width: NODE_WIDTH / 2 + 55 }}>
        <div className="flex gap-x-3">
          <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
            <Database size={16} />
          </div>
          <div className="flex flex-col gap-y-0.5">
            <p className="text-sm">{data.label}</p>
            <p className="flex items-center gap-x-1">
              <span className="text-sm text-foreground-light">{data.region}</span>
            </p>
            <p className="flex items-center gap-x-1">
              <span className="text-sm text-foreground-light">{data.provider}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img
            alt="region icon"
            className="w-6 rounded-sm mt-0.5"
            src={`${BASE_PATH}/img/regions/${data.regionIcon}.svg`}
          />
          <Circle size={10} className="bg-brand-500 stroke-none rounded-full" />
        </div>
      </div>
      <Handle type="source" position={Position.Left} className="opacity-25" />
    </div>
  )
}
const ReplicaNode = ({
  data,
}: {
  data: { label: string; details: string; regionIcon: string }
}) => {
  return (
    <div className="flex flex-col rounded bg-surface-100 border border-default px-2">
      <div className="flex items-start justify-between p-3" style={{ width: NODE_WIDTH / 2 - 10 }}>
        <div className="flex gap-x-3">
          <div className="flex flex-col gap-y-0.5">
            <p>{data.label}</p>
            <p className="flex items-center gap-x-1">
              <span className="text-sm text-foreground-light">{data.details}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <img
            alt="region icon"
            className="w-6 rounded-sm mt-0.5"
            src={`${BASE_PATH}/img/regions/${data.regionIcon}.svg`}
          />
          <Circle size={10} className="bg-brand-500 stroke-none rounded-full" />
        </div>
      </div>

      <Handle type="target" position={Position.Left} className="opacity-25" />
    </div>
  )
}

const BlankNode = () => {
  return (
    <div className="flex flex-col rounded bg-surface-100 border border-default px-1">
      <div className="flex items-start justify-between p-3" style={{ width: NODE_WIDTH / 2 }}>
        <div className="flex gap-x-3">
          <div className="flex items-center gap-1">
            <Plus size={16} />
            <span className="text-sm">Add new</span>
          </div>
        </div>
        <Handle type="target" position={Position.Left} className="opacity-25" />
      </div>
    </div>
  )
}

const CTANode = ({ projectRef }: { projectRef: string }) => {
  return (
    <Card className="w-[570px] p-6">
      <CardContent>
        <h2 className="text-lg mb-2">Stream database changes to external destinations</h2>
        <p className="text-foreground-light mb-2">
          Automatically replicate your data to external data warehouses and analytics platforms in
          real-time. No manual exports, no lag.
        </p>
        <p className="text-foreground-light">
          We are currently in <span className="text-foreground">private alpha</span> and slowly
          onboarding new customers to ensure stable data pipelines. Request access below to join the
          waitlist. Read replicas are available now.
        </p>
        <div className="flex items-center gap-x-2 mt-6">
          <Button asChild type="secondary" iconRight={<ArrowUpRight size={16} strokeWidth={1.5} />}>
            <Link href="https://forms.supabase.com/pg_replicate" target="_blank" rel="noreferrer">
              Request alpha access
            </Link>
          </Button>
          <Button asChild type="default" iconRight={<ArrowRight size={16} strokeWidth={1.5} />}>
            <Link href={`/project/${projectRef}/settings/infrastructure?createReplica=true`}>
              Create a read replica
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

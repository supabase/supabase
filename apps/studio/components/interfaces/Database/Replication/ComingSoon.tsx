import { motion } from 'framer-motion'
import { ArrowUpRight, Circle, Database, MoreVertical, Plus, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo } from 'react'
import ReactFlow, { Background, Handle, Position, ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { BASE_PATH } from 'lib/constants'
import { Button, Input_Shadcn_ } from 'ui'
import { NODE_WIDTH } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'

const STATIC_NODES = [
  {
    id: '1',
    type: 'primary',
    data: {
      label: 'Primary Database',
      region: 'East US (Ohio)',
      provider: 'AWS',
      regionIcon: 'EAST_US',
    },
    position: { x: 825, y: 0 },
  },
  {
    id: '2',
    type: 'replica',
    data: {
      label: 'Iceberg',
      details: '3 tables',
      regionIcon: 'WEST_US',
    },
    position: { x: 875, y: 110 },
  },
  {
    id: '3',
    type: 'replica',
    data: {
      label: 'BigQuery',
      details: '5 tables',
      regionIcon: 'WEST_US',
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
  const nodes = useMemo(() => STATIC_NODES, [])
  const edges = useMemo(() => STATIC_EDGES, [])

  const { resolvedTheme } = useTheme()

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const nodeTypes = useMemo(
    () => ({
      primary: PrimaryNode,
      replica: ReplicaNode,
      blank: BlankNode,
      cta: CTANode,
    }),
    []
  )

  return (
    <div className="relative border-t">
      <div className="h-[500px] w-full relative">
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
      <StaticDestinations />
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
            <p className="">{data.label}</p>
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

const CTANode = () => {
  return (
    <motion.div
      className="bg-surface-100 rounded-lg p-8 shadow-lg"
      style={{
        border: '1px solid',
        borderColor: 'hsl(var(--foreground-default) / var(--border-opacity, 0.6))',
      }}
      animate={{
        '--border-opacity': [0.6, 0.4, 0.2, 0.1, 0.2, 0.4, 0.6],
      }}
      transition={{
        duration: 4,
        ease: 'linear',
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      <div className="grid gap-4  w-[425px] relative">
        <span className="text-xs uppercase text-foreground-light">Early Access</span>
        <h2 className="text-lg">Replicate Your Data in Real Time</h2>
        <p>
          Stream changes from your Postgres database into your data warehouse—no manual exports, no
          lag.
        </p>
        <p>
          We're rolling this out to a limited group of early adopters. Sign up to get early access.
        </p>
        <p>
          <Button asChild type="secondary">
            <Link href="https://forms.supabase.com/pg_replicate" target="_blank" rel="noreferrer">
              <span className="flex items-center gap-x-1">
                Request Early Access
                <ArrowUpRight size={16} />
              </span>
            </Link>
          </Button>
        </p>
      </div>
    </motion.div>
  )
}

const StaticDestinations = () => {
  const mockRows = [
    { name: 'BigQuery', tables: 4, lag: '55ms', status: 'Enabled' },
    { name: 'Iceberg', tables: 4, lag: '85ms', status: 'Enabled' },
    { name: 'US East', tables: 4, lag: '125ms', status: 'Enabled' },
  ]

  return (
    <>
      <div className="flex flex-col bg-surface-100 px-6 py-6 border-t relative ">
        <div className="z-10 bg-surface-300 w-full h-full absolute top-0 left-0 opacity-30" />

        <ScaffoldContainer>
          <ScaffoldSection className="!py-0">
            <div className="col-span-12">
              <div className="flex items-center justify-between">
                <div className="relative w-52">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-lighter"
                  />
                  <Input_Shadcn_
                    className="pl-9 bg-transparent h-8 pointer-events-none"
                    placeholder="Search..."
                  />
                </div>
                <Button
                  disabled
                  type="primary"
                  icon={<Plus size={16} />}
                  className="flex items-center pointer-events-none"
                >
                  New destination
                </Button>
              </div>
              <Table
                head={[
                  <Table.th key="name">Name</Table.th>,
                  <Table.th key="publication">Publication</Table.th>,
                  <Table.th key="lag">Lag</Table.th>,
                  <Table.th key="status">Status</Table.th>,
                  <Table.th key="actions"></Table.th>,
                ]}
                className="mt-4"
                body={mockRows.map((row, i) => (
                  <Table.tr key={i}>
                    <Table.td>{row.name}</Table.td>
                    <Table.td>
                      <span className="flex items-center gap-2">
                        <span className="font-bold">All</span>
                        <span className="text-sm text-foreground-lighter">{row.tables} tables</span>
                      </span>
                    </Table.td>
                    <Table.td>{row.lag}</Table.td>
                    <Table.td>
                      <span className="flex items-center gap-3">
                        <Circle size={10} className="bg-brand-500 stroke-none rounded-full" />
                        {row.status}
                      </span>
                    </Table.td>
                    <Table.td className="text-right">
                      <button className="p-1">
                        <MoreVertical size={18} />
                      </button>
                    </Table.td>
                  </Table.tr>
                ))}
              />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      </div>
    </>
  )
}

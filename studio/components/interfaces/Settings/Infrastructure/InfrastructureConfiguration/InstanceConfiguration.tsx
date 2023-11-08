import { partition } from 'lodash'
import { Globe2, Network } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import ReactFlow, { Background, Edge, Node, ReactFlowProvider, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'
import { Button, Modal } from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import DeployNewReplicaPanel from './DeployNewReplicaPanel'
import { DatabaseConfiguration, MOCK_DATABASES } from './InstanceConfiguration.constants'
import { getGraphLayout } from './InstanceConfiguration.utils'
import { PrimaryNode, ReplicaNode } from './InstanceNode'
import MapView from './MapView'

// [Joshen] Just FYI, UI assumes single provider for primary + replicas
// [Joshen] Idea to visualize grouping based on region: https://reactflow.dev/examples/layout/sub-flows
// [Joshen] Show flags for regions

const InstanceChart = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const [view, setView] = useState<'flow' | 'map'>('map')

  const [showNewReplicaPanel, setShowNewReplicaPanel] = useState(false)
  const [selectedReplicaToResize, setSelectedReplicaToResize] = useState<DatabaseConfiguration>()
  const [selectedReplicaToDrop, setSelectedReplicaToDrop] = useState<DatabaseConfiguration>()

  const position = { x: 0, y: 0 }
  const edgeType = 'smoothstep'
  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const [[primary], replicas] = partition(MOCK_DATABASES, (database) => database.type === 'PRIMARY')

  const nodes: Node[] = MOCK_DATABASES.sort((a, b) => (a.region > b.region ? 1 : -1)).map(
    (database) => {
      return {
        id: database.id.toString(),
        type: database.type,
        data: {
          label: database.type === 'PRIMARY' ? 'Primary Database' : 'Read Replica',
          provider: database.cloud_provider,
          region: database.region,
          inserted_at: database.inserted_at,
          ...(database.type === 'READ_REPLICA'
            ? {
                onSelectResizeReplica: () => console.log('resize'),
                onSelectDropReplica: () => setSelectedReplicaToDrop(database),
              }
            : {}),
        },
        position,
      }
    }
  )
  const edges: Edge[] = replicas.map((database) => {
    return {
      id: `${primary.id}-${database.id}`,
      source: primary.id.toString(),
      target: database.id.toString(),
      type: edgeType,
      animated: true,
    }
  })

  const nodeTypes = useMemo(() => ({ PRIMARY: PrimaryNode, READ_REPLICA: ReplicaNode }), [])

  return (
    <>
      <div className="h-[500px] w-full relative">
        <div className="z-10 absolute top-4 right-4 flex items-center justify-center gap-x-2">
          <Button type="default" onClick={() => setShowNewReplicaPanel(true)}>
            Deploy a new replica
          </Button>
          <div className="flex items-center justify-center">
            <Button
              type="default"
              icon={<Network size={15} />}
              className="rounded-r-none"
              onClick={() => setView('flow')}
            />
            <Button
              type="default"
              icon={<Globe2 size={15} />}
              className="rounded-l-none"
              onClick={() => setView('map')}
            />
          </div>
        </div>
        {view === 'flow' ? (
          <ReactFlow
            fitView
            fitViewOptions={{ maxZoom: 1 }}
            className="instance-configuration"
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnDoubleClick={false}
            defaultNodes={[]}
            defaultEdges={[]}
            nodeTypes={nodeTypes}
            onInit={() => {
              const graph = getGraphLayout(nodes, edges)
              reactFlow.setNodes(graph.nodes)
              reactFlow.setEdges(graph.edges)
              setTimeout(() => reactFlow.fitView({ maxZoom: 1 }))
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={backgroundPatternColor} />
          </ReactFlow>
        ) : (
          <MapView
            onSelectDeployNewReplica={(region) => {
              console.log(region)
              setShowNewReplicaPanel(true)
            }}
            onSelectResizeReplica={() => console.log('resize')}
            onSelectDropReplica={setSelectedReplicaToDrop}
          />
        )}
      </div>

      <ConfirmationModal
        danger
        size="medium"
        visible={selectedReplicaToDrop !== undefined}
        header="Confirm to drop selected replica?"
        buttonLabel="Drop replica"
        buttonLoadingLabel="Dropping replica"
        onSelectCancel={() => setSelectedReplicaToDrop(undefined)}
        onSelectConfirm={() => console.log('DROP')}
      >
        <Modal.Content className="py-3">
          <p className="text-sm">Add some more content here</p>
          <p className="text-sm">This action cannot be undone</p>
        </Modal.Content>
      </ConfirmationModal>

      <DeployNewReplicaPanel
        visible={showNewReplicaPanel}
        onClose={() => setShowNewReplicaPanel(false)}
      />
    </>
  )
}

const InstanceConfiguration = () => {
  return (
    <ReactFlowProvider>
      <InstanceChart />
    </ReactFlowProvider>
  )
}

export default InstanceConfiguration

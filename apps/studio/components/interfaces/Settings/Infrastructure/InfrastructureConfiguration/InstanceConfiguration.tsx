import { useParams } from 'common'
import { partition } from 'lodash'
import { Globe2, Network } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import ReactFlow, { Background, Edge, ReactFlowProvider, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  Modal,
} from 'ui'

import ConfirmationModal from 'components/ui/ConfirmationModal'
import { AWS_REGIONS_KEYS } from 'lib/constants'
import DeployNewReplicaPanel from './DeployNewReplicaPanel'
import { DatabaseConfiguration, MOCK_DATABASES } from './InstanceConfiguration.constants'
import { addRegionNodes, generateNodes, getDagreGraphLayout } from './InstanceConfiguration.utils'
import { PrimaryNode, RegionNode, ReplicaNode } from './InstanceNode'
import MapView from './MapView'
import ResizeReplicaPanel from './ResizeReplicaPanel'

// [Joshen] Just FYI, UI assumes single provider for primary + replicas
// [Joshen] Idea to visualize grouping based on region: https://reactflow.dev/examples/layout/sub-flows
// [Joshen] Show flags for regions

const InstanceConfigurationUI = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()

  const [view, setView] = useState<'flow' | 'map'>('flow')
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useState(false)
  const [newReplicaRegion, setNewReplicaRegion] = useState<AWS_REGIONS_KEYS>()
  const [selectedReplicaToResize, setSelectedReplicaToResize] = useState<DatabaseConfiguration>()
  const [selectedReplicaToDrop, setSelectedReplicaToDrop] = useState<DatabaseConfiguration>()
  const [selectedReplicaToRestart, setSelectedReplicaToRestart] = useState<DatabaseConfiguration>()

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const [[primary], replicas] = partition(MOCK_DATABASES, (database) => database.type === 'PRIMARY')

  const nodes = generateNodes(MOCK_DATABASES, {
    onSelectRestartReplica: setSelectedReplicaToRestart,
    onSelectResizeReplica: setSelectedReplicaToResize,
    onSelectDropReplica: setSelectedReplicaToDrop,
  })

  const edges: Edge[] = replicas.map((database) => {
    return {
      id: `${primary.id}-${database.id}`,
      source: `database-${primary.id}`,
      target: `database-${database.id}`,
      type: 'smoothstep',
      animated: true,
    }
  })

  const nodeTypes = useMemo(
    () => ({ PRIMARY: PrimaryNode, READ_REPLICA: ReplicaNode, REGION: RegionNode }),
    []
  )

  const onConfirmDropReplica = () => {
    console.log('Drop replica', selectedReplicaToDrop)
  }

  const onConfirmRestartReplica = () => {
    console.log('Restart replica', selectedReplicaToRestart)
  }

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
              className={`rounded-r-none transition ${
                view === 'flow' ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() => setView('flow')}
            />
            <Button
              type="default"
              icon={<Globe2 size={15} />}
              className={`rounded-l-none transition ${
                view === 'map' ? 'opacity-100' : 'opacity-50'
              }`}
              onClick={() => setView('map')}
            />
          </div>
        </div>
        {view === 'flow' ? (
          <ReactFlow
            fitView
            fitViewOptions={{ minZoom: 0.9, maxZoom: 1 }}
            className="instance-configuration"
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnDoubleClick={false}
            edgesFocusable={false}
            edgesUpdatable={false}
            defaultNodes={[]}
            defaultEdges={[]}
            nodeTypes={nodeTypes}
            onInit={() => {
              const graph = getDagreGraphLayout(nodes, edges)
              const xxx = addRegionNodes(graph.nodes, graph.edges)
              reactFlow.setNodes(xxx.nodes)
              reactFlow.setEdges(graph.edges)
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={backgroundPatternColor} />
          </ReactFlow>
        ) : (
          <MapView
            onSelectDeployNewReplica={(region) => {
              setNewReplicaRegion(region)
              setShowNewReplicaPanel(true)
            }}
            onSelectRestartReplica={setSelectedReplicaToRestart}
            onSelectResizeReplica={setSelectedReplicaToResize}
            onSelectDropReplica={setSelectedReplicaToDrop}
          />
        )}
      </div>

      <DeployNewReplicaPanel
        visible={showNewReplicaPanel}
        selectedDefaultRegion={newReplicaRegion}
        onClose={() => {
          setNewReplicaRegion(undefined)
          setShowNewReplicaPanel(false)
        }}
      />

      <ResizeReplicaPanel
        visible={selectedReplicaToResize !== undefined}
        selectedReplica={selectedReplicaToResize}
        onClose={() => setSelectedReplicaToResize(undefined)}
      />

      <ConfirmationModal
        danger
        size="medium"
        visible={selectedReplicaToDrop !== undefined}
        header="Confirm to drop selected replica?"
        buttonLabel="Drop replica"
        buttonLoadingLabel="Dropping replica"
        onSelectCancel={() => setSelectedReplicaToDrop(undefined)}
        onSelectConfirm={() => onConfirmDropReplica()}
      >
        <Modal.Content className="py-3">
          <Alert_Shadcn_ variant="warning">
            <IconAlertTriangle strokeWidth={2} />
            <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              You may still deploy a new replica in this region thereafter
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
          <div className="text-sm px-1 pt-4">
            <p>Before deleting this replica, consider:</p>
            <ul className="text-foreground-light py-1 list-disc mx-4 space-y-1">
              <li>
                Network traffic from this region may slow down, especially if you have no other
                replicas in this region
              </li>
            </ul>
          </div>
        </Modal.Content>
      </ConfirmationModal>

      <ConfirmationModal
        size="medium"
        visible={selectedReplicaToRestart !== undefined}
        header="Confirm to restart selected replica?"
        buttonLabel="Restart replica"
        buttonLoadingLabel="Restarting replica"
        onSelectCancel={() => setSelectedReplicaToRestart(undefined)}
        onSelectConfirm={() => onConfirmRestartReplica()}
      >
        <Modal.Content className="py-3">
          <p className="text-sm">Before restarting the replica, consider:</p>
          <ul className="text-sm text-foreground-light py-1 list-disc mx-4 space-y-1">
            <li>
              Network traffic from this region may slow down while the replica is restarting,
              especially if you have no other replicas in this region
            </li>
          </ul>
          <p className="text-sm mt-2">
            Are you sure you want to restart this replica (ID: {selectedReplicaToRestart?.id}) now?{' '}
          </p>
        </Modal.Content>
      </ConfirmationModal>
    </>
  )
}

const InstanceConfiguration = () => {
  return (
    <ReactFlowProvider>
      <InstanceConfigurationUI />
    </ReactFlowProvider>
  )
}

export default InstanceConfiguration

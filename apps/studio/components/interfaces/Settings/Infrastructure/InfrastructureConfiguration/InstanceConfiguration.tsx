import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { ChevronDown, Globe2, Loader2, Network } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import 'reactflow/dist/style.css'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from 'data/read-replicas/replicas-status-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { type AWS_REGIONS_KEYS } from 'shared-data'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import DeployNewReplicaPanel from './DeployNewReplicaPanel'
import DropAllReplicasConfirmationModal from './DropAllReplicasConfirmationModal'
import DropReplicaConfirmationModal from './DropReplicaConfirmationModal'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'
import MapView from './MapView'
import { RestartReplicaConfirmationModal } from './RestartReplicaConfirmationModal'
import InstanceDiagram from './InstanceDiagram'

const InstanceConfigurationUI = () => {
  const isOrioleDb = useIsOrioleDb()
  const { ref: projectRef } = useParams()
  const numTransition = useRef<number>()
  const { project, isLoading: isLoadingProject } = useProjectContext()

  const [view, setView] = useState<'flow' | 'map'>('flow')
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useState(false)
  const [refetchInterval, setRefetchInterval] = useState<number | boolean>(10000)
  const [newReplicaRegion, setNewReplicaRegion] = useState<AWS_REGIONS_KEYS>()
  const [selectedReplicaToDrop, setSelectedReplicaToDrop] = useState<Database>()
  const [selectedReplicaToRestart, setSelectedReplicaToRestart] = useState<Database>()

  const canManageReplicas = useCheckPermissions(PermissionAction.CREATE, 'projects')

  const {
    data: loadBalancers,
    refetch: refetchLoadBalancers,
    isSuccess: isSuccessLoadBalancers,
  } = useLoadBalancersQuery({
    projectRef,
  })
  const {
    data,
    error,
    refetch: refetchReplicas,
    isLoading,
    isError,
    isSuccess: isSuccessReplicas,
  } = useReadReplicasQuery({
    projectRef,
  })
  const [[primary], replicas] = useMemo(
    () => partition(data ?? [], (db) => db.identifier === projectRef),
    [data, projectRef]
  )

  useReadReplicasStatusesQuery(
    { projectRef },
    {
      refetchInterval: refetchInterval as any,
      refetchOnWindowFocus: false,
      onSuccess: async (res) => {
        const fixedStatues = [
          REPLICA_STATUS.ACTIVE_HEALTHY,
          REPLICA_STATUS.ACTIVE_UNHEALTHY,
          REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
        ]
        const replicasInTransition = res.filter((db) => {
          const { status } = db.replicaInitializationStatus || {}
          return (
            !fixedStatues.includes(db.status) || status === ReplicaInitializationStatus.InProgress
          )
        })
        const hasTransientStatus = replicasInTransition.length > 0

        // If any replica's status has changed, refetch databases
        if (
          numTransition.current !== replicasInTransition.length ||
          res.length !== (data ?? []).length
        ) {
          numTransition.current = replicasInTransition.length
          await refetchReplicas()
          setTimeout(() => refetchLoadBalancers(), 2000)
        }

        // If all replicas are active healthy, stop fetching statuses
        if (!hasTransientStatus) {
          setRefetchInterval(false)
        }
      },
    }
  )

  return (
    <div className="nowheel border-y">
      <div
        className={`h-[500px] w-full relative ${
          isSuccessReplicas && !isLoadingProject ? '' : 'flex items-center justify-center px-28'
        }`}
      >
        {(isLoading || isLoadingProject) && (
          <Loader2 className="animate-spin text-foreground-light" />
        )}
        {isError && <AlertError error={error} subject="Failed to retrieve replicas" />}
        {isSuccessReplicas && !isLoadingProject && primary && (
          <>
            <div className="z-10 absolute top-4 right-4 flex items-center justify-center gap-x-2">
              <div className="flex items-center justify-center">
                <ButtonTooltip
                  type="default"
                  disabled={!canManageReplicas || isOrioleDb}
                  className={cn(replicas.length > 0 ? 'rounded-r-none' : '')}
                  onClick={() => setShowNewReplicaPanel(true)}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !canManageReplicas
                        ? 'You need additional permissions to deploy replicas'
                        : isOrioleDb
                          ? 'Read replicas are not supported with OrioleDB'
                          : undefined,
                    },
                  }}
                >
                  Deploy a new replica
                </ButtonTooltip>
                {replicas.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="default"
                        icon={<ChevronDown size={16} />}
                        className="px-1 rounded-l-none border-l-0"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 *:space-x-2">
                      <DropdownMenuItem asChild>
                        <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                          Resize databases
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowDeleteAllModal(true)}>
                        <div>Remove all replicas</div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {project?.cloud_provider === 'AWS' && (
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
              )}
            </div>
            {view === 'flow' ? (
              <InstanceDiagram />
            ) : (
              <MapView
                onSelectDeployNewReplica={(region) => {
                  setNewReplicaRegion(region)
                  setShowNewReplicaPanel(true)
                }}
                onSelectRestartReplica={setSelectedReplicaToRestart}
                onSelectDropReplica={setSelectedReplicaToDrop}
              />
            )}
          </>
        )}
      </div>

      <DeployNewReplicaPanel
        visible={showNewReplicaPanel}
        selectedDefaultRegion={newReplicaRegion}
        onSuccess={() => setRefetchInterval(5000)}
        onClose={() => {
          setNewReplicaRegion(undefined)
          setShowNewReplicaPanel(false)
        }}
      />

      <DropReplicaConfirmationModal
        selectedReplica={selectedReplicaToDrop}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setSelectedReplicaToDrop(undefined)}
      />

      <DropAllReplicasConfirmationModal
        visible={showDeleteAllModal}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setShowDeleteAllModal(false)}
      />

      <RestartReplicaConfirmationModal
        selectedReplica={selectedReplicaToRestart}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setSelectedReplicaToRestart(undefined)}
      />
    </div>
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

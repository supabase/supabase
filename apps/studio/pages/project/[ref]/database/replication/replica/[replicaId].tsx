import { Loader2, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { ReadReplicaDetails } from '@/components/interfaces/Database/Replication/ReadReplicas/ReadReplicaDetails'
import {
  getIsInTransition,
  getStatusLabel,
} from '@/components/interfaces/Database/Replication/ReadReplicas/ReadReplicas.utils'
import { DropReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/DropReplicaConfirmationModal'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { RestartReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/RestartReplicaConfirmationModal'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import { ScaffoldDescription, ScaffoldTitle } from '@/components/layouts/Scaffold'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from '@/data/read-replicas/replicas-status-query'
import { useParams } from 'common'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { Database } from 'icons'
import { AWS_REGIONS } from 'shared-data'
import type { NextPageWithLayout } from 'types'
import { Badge, Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

const DatabaseReadReplicaPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, replicaId } = useParams()

  const [showConfirmRestart, setShowConfirmRestart] = useState(false)
  const [showConfirmDrop, setShowConfirmDrop] = useState(false)
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)

  const {
    data: databases = [],
    isPending: isLoadingDatabases,
    isSuccess: isSuccessDatabases,
  } = useReadReplicasQuery({ projectRef: ref })
  const replica = databases.find((x) => x.identifier === replicaId)
  const { identifier, region, status: baseStatus } = replica ?? {}

  const { data: statuses = [], isSuccess: isSuccessReplicasStatuses } =
    useReadReplicasStatusesQuery({ projectRef: ref }, { refetchInterval: statusRefetchInterval })
  const replicaStatus = statuses.find((x) => x.identifier === identifier)
  const status = replicaStatus?.status ?? baseStatus
  const initStatus = replicaStatus?.replicaInitializationStatus?.status

  const regionLabel = Object.values(AWS_REGIONS).find((x) => x.code === region)?.displayName
  const statusLabel = useMemo(() => getStatusLabel({ initStatus, status }), [initStatus, status])
  const isInTransition = useMemo(
    () => getIsInTransition({ initStatus, status }),
    [initStatus, status]
  )

  useEffect(() => {
    if (!isSuccessReplicasStatuses) return

    const pollReplicas = async () => {
      const fixedStatuses = [
        REPLICA_STATUS.ACTIVE_HEALTHY,
        REPLICA_STATUS.ACTIVE_UNHEALTHY,
        REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
      ]
      const replicasInTransition = statuses.filter((db) => {
        const { status } = db.replicaInitializationStatus || {}
        return (
          !fixedStatuses.includes(db.status) || status === ReplicaInitializationStatus.InProgress
        )
      })
      const hasTransientStatus = replicasInTransition.length > 0

      // If all replicas are active healthy, stop fetching statuses
      if (!hasTransientStatus && statuses.length === databases.length) {
        setStatusRefetchInterval(false)
      }
    }

    pollReplicas()
  }, [databases.length, isSuccessReplicasStatuses, statuses])

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-x-3">
          <ScaffoldTitle>Read Replica</ScaffoldTitle>
          {isSuccessDatabases && (
            <>
              <Badge
                variant={
                  statusLabel === 'Healthy'
                    ? 'success'
                    : statusLabel === 'Failed'
                      ? 'destructive'
                      : 'default'
                }
              >
                {statusLabel}
              </Badge>
              {isInTransition && <Loader2 size={14} className="animate-spin" />}
            </>
          )}
        </div>
      }
      subtitle={
        isLoadingDatabases ? (
          <ShimmeringLoader className="py-[11px]" />
        ) : (
          <div className="flex items-center gap-x-2 !mt-0">
            <ScaffoldDescription>ID: {identifier}</ScaffoldDescription>
            <CopyButton iconOnly type="default" text={identifier ?? ''} />
          </div>
        )
      }
      icon={
        <div className="shrink-0 w-10 h-10 relative bg-surface-100 border rounded-md flex items-center justify-center">
          <Database size={20} className="text-foreground-light" />
        </div>
      }
      breadcrumbs={[
        {
          label: 'Replication',
          href: `/project/${ref}/database/replication`,
        },
        {
          label: `Read Replica - ${regionLabel}`,
        },
      ]}
      secondaryActions={
        <ButtonTooltip
          type="default"
          className="w-7"
          icon={<Trash />}
          tooltip={{
            content: { side: 'bottom', text: 'Drop replica' },
          }}
          onClick={() => setShowConfirmDrop(true)}
        />
      }
      primaryActions={[
        <Button asChild key="logs" type="default">
          <Link
            href={`/project/${ref}/logs/postgres-logs${!!identifier ? `?db=${identifier}` : ''}`}
          >
            View logs
          </Link>
        </Button>,
        <Button
          key="drop"
          type="default"
          disabled={status !== 'ACTIVE_HEALTHY'}
          onClick={() => setShowConfirmRestart(true)}
        >
          Restart replica
        </Button>,
      ]}
    >
      <ReadReplicaDetails />

      <DropReplicaConfirmationModal
        selectedReplica={showConfirmDrop ? replica : undefined}
        onSuccess={() => router.push(`/project/${ref}/database/replication`)}
        onCancel={() => setShowConfirmDrop(false)}
      />

      <RestartReplicaConfirmationModal
        selectedReplica={showConfirmRestart ? replica : undefined}
        onSuccess={() => setStatusRefetchInterval(5000)}
        onCancel={() => setShowConfirmRestart(false)}
      />
    </PageLayout>
  )
}

DatabaseReadReplicaPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReadReplicaPage

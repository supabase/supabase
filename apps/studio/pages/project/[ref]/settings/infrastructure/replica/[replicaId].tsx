import { useParams } from 'common'
import { Database } from 'icons'
import { Loader2, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { AWS_REGIONS } from 'shared-data'
import { Badge, Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { DropReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/DropReplicaConfirmationModal'
import { ReadReplicaDetails } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaDetails'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicas.constants'
import {
  getIsInTransition,
  getStatusLabel,
} from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicas.utils'
import { RestartReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/RestartReplicaConfirmationModal'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import SettingsLayout from '@/components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldDescription, ScaffoldTitle } from '@/components/layouts/Scaffold'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import CopyButton from '@/components/ui/CopyButton'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from '@/data/read-replicas/replicas-status-query'
import type { NextPageWithLayout } from '@/types'

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'destructive' | 'default'> = {
  Healthy: 'success',
  Failed: 'destructive',
}

const InfrastructureReadReplicaPage: NextPageWithLayout = () => {
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

    const fixedStatuses = [
      REPLICA_STATUS.ACTIVE_HEALTHY,
      REPLICA_STATUS.ACTIVE_UNHEALTHY,
      REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
    ]
    const replicasInTransition = statuses.filter((db) => {
      const { status: init } = db.replicaInitializationStatus || {}
      return !fixedStatuses.includes(db.status) || init === ReplicaInitializationStatus.InProgress
    })
    const hasTransientStatus = replicasInTransition.length > 0

    if (!hasTransientStatus && statuses.length === databases.length) {
      setStatusRefetchInterval(false)
    }
  }, [databases.length, isSuccessReplicasStatuses, statuses])

  return (
    <PageLayout
      title={
        <div className="flex items-center gap-x-3">
          <ScaffoldTitle>Read Replica</ScaffoldTitle>
          {isSuccessDatabases && (
            <>
              <Badge variant={STATUS_BADGE_VARIANT[statusLabel] ?? 'default'}>{statusLabel}</Badge>
              {isInTransition && <Loader2 size={14} className="animate-spin" />}
            </>
          )}
        </div>
      }
      subtitle={
        isLoadingDatabases ? (
          <ShimmeringLoader className="py-[11px]" />
        ) : (
          <div className="flex items-center gap-x-2 mt-0!">
            <ScaffoldDescription>ID: {identifier}</ScaffoldDescription>
            <CopyButton iconOnly variant="default" text={identifier ?? ''} />
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
          label: 'Infrastructure',
          href: getInfrastructurePath(ref),
        },
        {
          label: `Read Replica - ${regionLabel}`,
        },
      ]}
      secondaryActions={
        <ButtonTooltip
          variant="default"
          className="w-7"
          icon={<Trash />}
          tooltip={{
            content: { side: 'bottom', text: 'Drop replica' },
          }}
          onClick={() => setShowConfirmDrop(true)}
        />
      }
      primaryActions={[
        <Button asChild key="logs" variant="default">
          <Link
            href={`/project/${ref}/logs/postgres-logs${!!identifier ? `?db=${identifier}` : ''}`}
          >
            View logs
          </Link>
        </Button>,
        <Button
          key="restart"
          variant="default"
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
        onSuccess={() => router.push(getInfrastructurePath(ref))}
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

InfrastructureReadReplicaPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Infrastructure">{page}</SettingsLayout>
  </DefaultLayout>
)

export default InfrastructureReadReplicaPage

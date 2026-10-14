import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  isWarehouseProvisioned,
  isWarehouseSettingUp,
  type WarehouseSetupStatus,
} from '../Integrations/Warehouse/Warehouse.utils'
import { WarehouseConnectionCard } from '../Integrations/Warehouse/WarehouseConnectSection'
import { AlertError } from '@/components/ui/AlertError'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'

const getNotProvisionedContent = (setupStatus?: WarehouseSetupStatus) => {
  if (isWarehouseSettingUp(setupStatus)) {
    return {
      type: 'default' as const,
      title: 'Warehouse is being set up',
      description: 'Connection details appear here once the first backfill finishes.',
      action: 'View progress',
    }
  }

  if (setupStatus === 'error') {
    return {
      type: 'warning' as const,
      title: 'Warehouse setup failed',
      description: 'Review the error and retry setup to get connection details.',
      action: 'View Warehouse',
    }
  }

  return {
    type: 'default' as const,
    title: 'Warehouse is not set up',
    description: 'Choose which schemas or tables to replicate in order to connect to Warehouse.',
    action: 'Choose tables',
  }
}

/**
 * Read-only view of the Warehouse connection details. Setting Warehouse up, changing which tables
 * replicate, and disabling it all live on the Warehouse integration instead.
 */
export const WarehouseTab = () => {
  const { ref: projectRef } = useParams()
  const { data, isPending, isFetching, isError, error, refetch } = useWarehouseSetupStatusQuery({
    projectRef,
  })
  const hasLiveTables = data?.tables.some((table) => table.state === 'live') ?? false
  const canShowConnectionDetails =
    data?.setup_status !== 'error' && (isWarehouseProvisioned(data?.setup_status) || hasLiveTables)

  let content: React.ReactNode

  if (isPending) content = <GenericSkeletonLoader />
  // Warehouse rides on the replication API, which isn't wired up in local development. Same
  // treatment Pipelines gives it, so a local dev doesn't read this as a broken build.
  else if (isError && checkLocalETLNotSetUp(error)) {
    content = (
      <Admonition
        type="default"
        title="Warehouse is unavailable locally"
        description="Configure the replication API to set up Warehouse in local development."
      />
    )
  } else if (isError) {
    content = (
      <AlertError
        subject="Failed to load Warehouse status"
        error={error}
        additionalActions={
          <Button variant="default" loading={isFetching} onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    )
  } else if (!canShowConnectionDetails) {
    const { type, title, description, action } = getNotProvisionedContent(data?.setup_status)

    content = (
      <Admonition
        type={type}
        layout="responsive"
        title={title}
        description={description}
        actions={[
          <Button key="open-warehouse" asChild variant="default">
            <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>{action}</Link>
          </Button>,
        ]}
      />
    )
  } else {
    return (
      <div>
        {isWarehouseSettingUp(data?.setup_status) && (
          <div className="px-8 pt-8">
            <Admonition
              type="default"
              layout="responsive"
              title="Warehouse setup is still running"
              description="Some tables are ready to query. The remaining tables will become available as their backfills finish."
              actions={[
                <Button key="view-progress" asChild variant="default">
                  <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>
                    View progress
                  </Link>
                </Button>,
              ]}
            />
          </div>
        )}
        <WarehouseConnectionCard variant="sheet" />
        <div className="border-t px-8 py-4">
          <Button asChild variant="default" size="tiny">
            <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>
              Manage Warehouse
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return <div className="p-8">{content}</div>
}

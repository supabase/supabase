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
  const { data, isPending, isError, error } = useWarehouseSetupStatusQuery({ projectRef })

  if (isPending) {
    return (
      <div className="p-8">
        <GenericSkeletonLoader />
      </div>
    )
  }

  // Warehouse rides on the replication API, which isn't wired up in local development. Same
  // treatment Pipelines gives it, so a local dev doesn't read this as a broken build.
  if (isError && checkLocalETLNotSetUp(error)) {
    return (
      <div className="p-8">
        <Admonition
          type="default"
          title="Warehouse is unavailable locally"
          description="Configure the replication API to set up Warehouse in local development."
        />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="p-8">
        <AlertError subject="Failed to load Warehouse status" error={error} />
      </div>
    )
  }

  if (!isWarehouseProvisioned(data?.setup_status)) {
    const { type, title, description, action } = getNotProvisionedContent(data?.setup_status)

    return (
      <div className="p-8">
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
      </div>
    )
  }

  return <WarehouseConnectionCard variant="sheet" />
}

import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildRetryTargets,
  isWarehouseSettingUp,
  type WarehouseSetupTarget,
} from './Warehouse.utils'
import { WarehouseConnectSection } from './WarehouseConnectSection'
import { WarehouseDisableCard } from './WarehouseDisableCard'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import {
  WarehouseEnablingProgress,
  WarehouseReplicatedTablesSection,
} from './WarehouseTableStatusList'
import { AlertError } from '@/components/ui/AlertError'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useTrack } from '@/lib/telemetry/track'

export const WarehouseSetupPanel = () => {
  const { ref: projectRef } = useParams()
  const track = useTrack()

  const { data, isPending, isError, error } = useWarehouseSetupStatusQuery(
    { projectRef },
    {
      refetchInterval: (query) =>
        isWarehouseSettingUp(query.state.data?.setup_status) ? 3000 : false,
    }
  )

  // Rendered inline by the picker rather than as a toast: a setup failure is something the user
  // has to act on, so it must not disappear.
  const setupMutation = useWarehouseSetupMutation({ onError: () => {} })

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) return

    setupMutation.mutate(
      { projectRef, body: { targets } },
      {
        onSuccess: () => {
          track('warehouse_enabled', {
            schemaTargetCount: targets.filter((target) => target.type === 'schema').length,
            tableTargetCount: targets.filter((target) => target.type === 'table').length,
          })
        },
      }
    )
  }

  if (isPending) return <GenericSkeletonLoader />

  // Warehouse rides on the replication API, which isn't wired up in local development. Same
  // treatment Pipelines gives it, so a local dev doesn't read this as a broken build.
  if (isError && checkLocalETLNotSetUp(error)) {
    return (
      <Admonition
        type="default"
        title="Warehouse is unavailable locally"
        description="Configure the replication API to set up Warehouse in local development."
      />
    )
  }
  if (isError) return <AlertError subject="Failed to load Warehouse status" error={error} />
  if (!data) return <GenericSkeletonLoader />

  const status = data.setup_status

  if (status === 'not_started') {
    return (
      <WarehouseSchemaTablePicker
        onSubmit={handleSetup}
        isSubmitting={setupMutation.isPending}
        error={setupMutation.error}
      />
    )
  }

  if (isWarehouseSettingUp(status)) {
    return <WarehouseEnablingProgress status={data} />
  }

  if (status === 'error') {
    const retryTargets = buildRetryTargets(data.tables)
    const failingStep = data.steps.find((step) => step.status === 'error')

    return (
      <AlertError
        subject="Warehouse setup failed"
        showErrorPrefix={false}
        error={{
          message: failingStep?.message ?? 'An unknown error occurred while setting up Warehouse.',
        }}
        additionalActions={
          retryTargets.length > 0 ? (
            <Button
              variant="default"
              loading={setupMutation.isPending}
              onClick={() => handleSetup(retryTargets)}
            >
              Retry
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <>
      <WarehouseReplicatedTablesSection tables={data.tables} />
      <WarehouseSchemaTablePicker
        isEditing
        onSubmit={handleSetup}
        isSubmitting={setupMutation.isPending}
        error={setupMutation.error}
      />
      <WarehouseConnectSection />
      <WarehouseDisableCard />
    </>
  )
}

import { useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { isWarehouseSettingUp, type WarehouseSetupTarget } from './Warehouse.utils'
import { WarehouseConnectSection } from './WarehouseConnectSection'
import { WarehouseDisableCard } from './WarehouseDisableCard'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import {
  WarehouseEnablingProgress,
  WarehouseReplicatedTablesSection,
} from './WarehouseTableStatusList'
import { AlertError } from '@/components/ui/AlertError'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useWarehouseDisableMutation } from '@/data/warehouse/warehouse-disable-mutation'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useTrack } from '@/lib/telemetry/track'

export const WarehouseSetupPanel = () => {
  const { ref: projectRef } = useParams()
  const track = useTrack()

  const { data, isPending, isFetching, isError, error, refetch } = useWarehouseSetupStatusQuery(
    { projectRef },
    {
      refetchInterval: (query) =>
        isWarehouseSettingUp(query.state.data?.setup_status) ||
        query.state.data?.setup_status === 'disabling'
          ? 3000
          : false,
    }
  )

  const disableMutation = useWarehouseDisableMutation({ onError: () => {} })
  // Rendered inline by the picker rather than as a toast: a setup failure is something the user
  // has to act on, so it must not disappear.
  const setupMutation = useWarehouseSetupMutation({ onError: () => {} })

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) return
    const isInitialSetup = data?.setup_status !== 'complete'

    setupMutation.mutate(
      { projectRef, body: { targets } },
      {
        onSuccess: () => {
          if (isInitialSetup) {
            track('warehouse_enabled', {
              source: 'integrations_overview',
              schemaTargetCount: targets.filter((target) => target.type === 'schema').length,
              tableTargetCount: targets.filter((target) => target.type === 'table').length,
            })
          }
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
  if (isError) {
    return (
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
  }
  if (!data) return <GenericSkeletonLoader />

  const status = data.setup_status

  if (status === 'not_started' || status === 'disabled') {
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

  if (status === 'disabling') {
    return (
      <Admonition
        type="default"
        title="Warehouse is being disabled"
        description="Warehouse resources are being removed. This can take a few minutes."
      />
    )
  }

  if (status === 'deletion_failed') {
    return (
      <AlertError
        subject="Failed to disable Warehouse"
        showErrorPrefix={false}
        error={{
          message: disableMutation.error?.message ?? data.error ?? 'Warehouse cleanup failed.',
        }}
        additionalActions={
          <Button
            variant="default"
            loading={disableMutation.isPending}
            disabled={!projectRef}
            onClick={() => {
              if (projectRef) {
                disableMutation.mutate({ projectRef, shouldDeleteData: data.delete_data ?? false })
              }
            }}
          >
            Retry
          </Button>
        }
      />
    )
  }

  if (status === 'error') {
    const failingStep = data.steps.find((step) => step.status === 'error')

    return (
      <WarehouseSchemaTablePicker
        initialTables={data.tables}
        onSubmit={handleSetup}
        isSubmitting={setupMutation.isPending}
        error={{
          message:
            setupMutation.error?.message ??
            failingStep?.message ??
            'An unknown error occurred while setting up Warehouse.',
        }}
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

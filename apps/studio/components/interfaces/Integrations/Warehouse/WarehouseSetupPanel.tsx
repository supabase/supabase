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

  // Rendered inline by the picker rather than as a toast: a setup failure is something the user
  // has to act on, so it must not disappear.
  const setupMutation = useWarehouseSetupMutation({ onError: () => {} })

  const disableMutation = useWarehouseDisableMutation()

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) {
      return
    }
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

  if (isPending) {
    return <GenericSkeletonLoader />
  }

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
  if (!data) {
    return <GenericSkeletonLoader />
  }

  const status = data.setup_status

  if (status === 'disabling') {
    return (
      <Admonition
        type="default"
        title="Disabling Warehouse"
        description={
          data.delete_data
            ? 'Stopping replication and deleting DuckLake data and catalog metadata. You can enable Warehouse again after cleanup finishes.'
            : 'Stopping replication and disconnecting Warehouse. Copied data and catalog metadata will be retained.'
        }
      />
    )
  }

  if (status === 'deletion_failed') {
    return (
      <AlertError
        subject="Warehouse cleanup failed"
        showErrorPrefix={false}
        error={{
          message: data.error ?? 'Cleanup is incomplete. Retry to finish disabling Warehouse.',
        }}
        additionalActions={
          <Button
            variant="default"
            loading={disableMutation.isPending}
            disabled={!projectRef}
            onClick={() => {
              if (projectRef) {
                disableMutation.mutate({ projectRef, deleteData: data.delete_data === true })
              }
            }}
          >
            Retry cleanup
          </Button>
        }
      />
    )
  }

  if (status === 'not_started' || status === 'disabled') {
    return (
      <>
        {status === 'disabled' && (
          <Admonition
            type="default"
            title="Warehouse disabled"
            description={
              data.delete_data
                ? 'DuckLake data and catalog metadata have been deleted. You can set up Warehouse again.'
                : 'Copied data and catalog metadata have been retained. You can enable Warehouse again.'
            }
          />
        )}
        <WarehouseSchemaTablePicker
          onSubmit={handleSetup}
          isSubmitting={setupMutation.isPending}
          error={setupMutation.error}
        />
      </>
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
          message:
            setupMutation.error?.message ??
            failingStep?.message ??
            'An unknown error occurred while setting up Warehouse.',
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

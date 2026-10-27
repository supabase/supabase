import { useParams } from 'common'
import { useEffect, useRef, useState } from 'react'
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
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useWarehouseDisableMutation } from '@/data/warehouse/warehouse-disable-mutation'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useIsOrioleDb, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'
import { WAREHOUSE_PUBLICATION_NAME } from '@/lib/warehouse'

export const WarehouseSetupPanel = () => {
  const [statusMessage, setStatusMessage] = useState('')
  const statusRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (statusMessage) statusRef.current?.focus()
  }, [statusMessage])

  return (
    <>
      <p ref={statusRef} role="status" tabIndex={-1} className="sr-only">
        {statusMessage}
      </p>
      <WarehouseSetupPanelContent onStatusChange={setStatusMessage} />
    </>
  )
}

const WarehouseSetupPanelContent = ({
  onStatusChange,
}: {
  onStatusChange: (message: string) => void
}) => {
  const { ref: projectRef } = useParams()
  const track = useTrack()
  const isOrioleDb = useIsOrioleDb()
  const {
    isPending: isProjectPending,
    isSuccess: isProjectSuccess,
    isFetched: isProjectFetched,
    isFetching: isProjectFetching,
    error: projectError,
    refetch: refetchProject,
  } = useSelectedProjectQuery()

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

  const shouldCheckCatalogCompatibility =
    data?.setup_status === 'not_started' ||
    data?.setup_status === 'disabled' ||
    data?.setup_status === 'error'

  const {
    data: destinations,
    isPending: isDestinationsPending,
    isSuccess: isDestinationsSuccess,
    isFetched: isDestinationsFetched,
    isFetching: isDestinationsFetching,
    error: destinationsError,
    refetch: refetchDestinations,
  } = useReplicationDestinationsQuery(
    { projectRef },
    {
      enabled: shouldCheckCatalogCompatibility && isOrioleDb === true,
    }
  )

  // Existing destinations may use another project's catalog; the API validates that project.
  const hasWarehouseDestination =
    destinations?.destinations.some(
      (destination) => destination.name === WAREHOUSE_PUBLICATION_NAME
    ) ?? false
  const canSetUpWarehouse =
    isProjectSuccess &&
    (isOrioleDb === false ||
      (isOrioleDb === true && isDestinationsSuccess && hasWarehouseDestination))

  const disableMutation = useWarehouseDisableMutation({ onError: () => {} })
  // Rendered inline by the picker rather than as a toast: a setup failure is something the user
  // has to act on, so it must not disappear.
  const setupMutation = useWarehouseSetupMutation({ onError: () => {} })

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) return
    if (shouldCheckCatalogCompatibility && !canSetUpWarehouse) return
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

  if (shouldCheckCatalogCompatibility) {
    if (isProjectPending && !isProjectFetched) return <GenericSkeletonLoader />
    if (!isProjectSuccess || isOrioleDb === undefined) {
      return (
        <AlertError
          subject="Failed to check project compatibility"
          error={projectError ?? { message: 'The project database version is unavailable.' }}
          projectRef={projectRef}
          additionalActions={
            <Button variant="default" loading={isProjectFetching} onClick={() => refetchProject()}>
              Retry
            </Button>
          }
        />
      )
    }
    if (isOrioleDb) {
      if (isDestinationsPending && !isDestinationsFetched) return <GenericSkeletonLoader />
      if (!isDestinationsSuccess) {
        return (
          <AlertError
            subject="Failed to load Warehouse destination"
            error={destinationsError}
            projectRef={projectRef}
            additionalActions={
              <Button
                variant="default"
                loading={isDestinationsFetching}
                onClick={async () => {
                  onStatusChange('')
                  const result = await refetchDestinations()
                  if (
                    result.isSuccess &&
                    result.data?.destinations.some(
                      (destination) => destination.name === WAREHOUSE_PUBLICATION_NAME
                    )
                  ) {
                    onStatusChange('Warehouse destination loaded. You can continue setup.')
                  }
                }}
              >
                Retry
              </Button>
            }
          />
        )
      }
      if (!hasWarehouseDestination) {
        return (
          <Admonition
            type="warning"
            title="This project cannot host a Warehouse catalog"
            description="Warehouse setup uses this project for its metadata catalog. OrioleDB is not supported. Set up Warehouse with a catalog on a project using standard Postgres."
          />
        )
      }
    }
  }

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

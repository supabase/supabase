import { useParams } from 'common'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'
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
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useTrack } from '@/lib/telemetry/track'

/**
 * `PageSection` cancels its own top padding with `first:pt-0`, which only applies to a real
 * `:first-child`. Without this wrapper the integration shell's markdown takes that slot and every
 * section keeps a 48px gap above it. Data API wraps its sections for the same reason.
 */
const Sections = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col">{children}</div>
)

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

  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onError: (error) => {
      toast.error(
        `Warehouse was enabled, but DuckLake catalog access could not be enabled automatically: ${error.message}. You can retry this from Warehouse settings.`
      )
    },
  })
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
          // Fire-and-forget: setup itself should proceed even if enabling catalog access fails.
          // Warehouse settings offers a manual toggle as the fallback.
          catalogMutation.mutate({ projectRef, body: { enabled: true } })
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
      <Sections>
        <WarehouseSchemaTablePicker
          onSubmit={handleSetup}
          isSubmitting={setupMutation.isPending}
          error={setupMutation.error}
        />
      </Sections>
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
    <Sections>
      <WarehouseReplicatedTablesSection tables={data.tables} />
      <WarehouseConnectSection canManageCatalog />
      <WarehouseSchemaTablePicker
        isEditing
        onSubmit={handleSetup}
        isSubmitting={setupMutation.isPending}
        error={setupMutation.error}
      />
      <WarehouseDisableCard />
    </Sections>
  )
}

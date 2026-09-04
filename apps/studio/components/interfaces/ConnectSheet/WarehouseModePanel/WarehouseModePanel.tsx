import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseConnectionDetails } from './WarehouseConnectionDetails'
import { WarehouseEnablingProgress } from './WarehouseEnablingProgress'
import type { WarehouseSetupTarget } from './WarehouseModePanel.utils'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import { AlertError } from '@/components/ui/AlertError'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'

const POLLING_SETUP_STATUSES = new Set(['setting_up', 'copying'])

interface WarehouseSetupCompleteProps {
  onSubmit: (targets: WarehouseSetupTarget[]) => void
  isSubmitting: boolean
}

const WarehouseSetupComplete = ({ onSubmit, isSubmitting }: WarehouseSetupCompleteProps) => {
  const [isEditingTables, setIsEditingTables] = useState(false)

  if (isEditingTables) {
    return (
      <WarehouseSchemaTablePicker
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        onBack={() => setIsEditingTables(false)}
      />
    )
  }

  return <WarehouseConnectionDetails onEditTables={() => setIsEditingTables(true)} />
}

export const WarehouseModePanel = () => {
  const { ref: projectRef } = useParams()

  const { data, isPending, isError, error } = useWarehouseSetupStatusQuery(
    { projectRef },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.setup_status
        return status && POLLING_SETUP_STATUSES.has(status) ? 3000 : false
      },
    }
  )

  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onError: (error) => {
      toast.error(
        `Warehouse was enabled, but DuckLake catalog access could not be enabled automatically: ${error.message}. You can retry this from the connection details.`
      )
    },
  })
  const setupMutation = useWarehouseSetupMutation()

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) return

    setupMutation.mutate(
      { projectRef, body: { targets } },
      {
        onSuccess: () => {
          // Fire-and-forget: setup itself should proceed even if enabling catalog access fails.
          // The connection details panel offers a manual "Enable catalog access" fallback.
          catalogMutation.mutate({ projectRef, body: { enabled: true } })
        },
      }
    )
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError subject="Failed to load Warehouse status" error={error} />
  if (!data) return <GenericSkeletonLoader />

  const status = data.setup_status

  if (status === 'not_started') {
    return (
      <WarehouseSchemaTablePicker onSubmit={handleSetup} isSubmitting={setupMutation.isPending} />
    )
  }

  if (status === 'setting_up' || status === 'copying') {
    return <WarehouseEnablingProgress status={data} />
  }

  if (status === 'error') {
    const retryTargets: WarehouseSetupTarget[] = (data.tables ?? []).map((table) => ({
      type: 'table' as const,
      schema: table.schema,
      name: table.name,
    }))
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

  // status === 'complete'
  return <WarehouseSetupComplete onSubmit={handleSetup} isSubmitting={setupMutation.isPending} />
}

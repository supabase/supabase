import { useParams } from 'common'
import { useState } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseConnectionDetails } from './WarehouseConnectionDetails'
import { WarehouseEnablingProgress } from './WarehouseEnablingProgress'
import type { WarehouseSetupTarget } from './WarehouseModePanel.utils'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import { AlertError } from '@/components/ui/AlertError'
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
      <div className="p-8">
        <WarehouseSchemaTablePicker
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          onBack={() => setIsEditingTables(false)}
        />
      </div>
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

  const setupMutation = useWarehouseSetupMutation()

  const handleSetup = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef || targets.length === 0) return

    setupMutation.mutate({ projectRef, body: { targets } })
  }

  if (isPending) {
    return (
      <div className="p-8">
        <GenericSkeletonLoader />
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
  if (!data) {
    return (
      <div className="p-8">
        <GenericSkeletonLoader />
      </div>
    )
  }

  const status = data.setup_status

  if (status === 'not_started') {
    return (
      <div className="p-8">
        <WarehouseSchemaTablePicker onSubmit={handleSetup} isSubmitting={setupMutation.isPending} />
      </div>
    )
  }

  if (status === 'setting_up' || status === 'copying') {
    return (
      <div className="p-8">
        <WarehouseEnablingProgress status={data} />
      </div>
    )
  }

  if (status === 'error') {
    const retryTargets: WarehouseSetupTarget[] = (data.tables ?? []).map((table) => ({
      type: 'table' as const,
      schema: table.schema,
      name: table.name,
    }))
    const failingStep = data.steps.find((step) => step.status === 'error')

    return (
      <div className="p-8">
        <AlertError
          subject="Warehouse setup failed"
          error={{
            message:
              failingStep?.message ?? 'An unknown error occurred while setting up Warehouse.',
          }}
          additionalActions={
            retryTargets.length > 0 ? (
              <Button loading={setupMutation.isPending} onClick={() => handleSetup(retryTargets)}>
                Retry
              </Button>
            ) : undefined
          }
        />
      </div>
    )
  }

  // status === 'complete'
  return <WarehouseSetupComplete onSubmit={handleSetup} isSubmitting={setupMutation.isPending} />
}

import { useParams } from 'common'
import { useState } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseConnectionDetails } from './WarehouseConnectionDetails'
import { WarehouseEnablingProgress } from './WarehouseEnablingProgress'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import { AlertError } from '@/components/ui/AlertError'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import {
  useWarehouseSetupStatusQuery,
  type WarehouseSetupStatusResponse,
} from '@/data/warehouse/warehouse-setup-status-query'

type PickerOverride = 'auto' | 'picker'
type WarehouseSetupStatus = WarehouseSetupStatusResponse['setup_status']

const POLLING_SETUP_STATUSES = new Set(['setting_up', 'copying'])

export const WarehouseModePanel = () => {
  const { ref: projectRef } = useParams()
  const [override, setOverride] = useState<PickerOverride>('auto')
  const [previousStatus, setPreviousStatus] = useState<WarehouseSetupStatus | undefined>(undefined)

  const { data, isPending, isError, error } = useWarehouseSetupStatusQuery(
    { projectRef },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.setup_status
        return status && POLLING_SETUP_STATUSES.has(status) ? 3000 : false
      },
    }
  )

  // Drop the manual "show me the picker" override once the server reports setup running again,
  // otherwise re-enabling from the picker lands back on the picker when it completes. Detected on
  // status transition rather than from a mutation callback: the picker unmounts the moment the
  // status query invalidates, and callbacks passed to `mutate()` are dropped on unmount.
  const currentStatus = data?.setup_status
  if (currentStatus !== previousStatus) {
    setPreviousStatus(currentStatus)
    if (currentStatus !== undefined && currentStatus !== 'complete') setOverride('auto')
  }

  const setupMutation = useWarehouseSetupMutation()

  // Re-submit the same tables that were already targeted -- the setup-status response tracks them
  // individually (with state), so we don't need to send the user back through the picker.
  const retryTargets = (data?.tables ?? []).map((table) => ({
    type: 'table' as const,
    schema: table.schema,
    name: table.name,
  }))

  const handleRetrySetup = () => {
    if (!projectRef || retryTargets.length === 0) return
    setupMutation.mutate({ projectRef, body: { targets: retryTargets } })
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError subject="Failed to load Warehouse status" error={error} />
  if (!data) return <GenericSkeletonLoader />

  const status = data.setup_status

  if (status === 'not_started') {
    return <WarehouseSchemaTablePicker />
  }

  if (status === 'setting_up' || status === 'copying') {
    return <WarehouseEnablingProgress status={data} />
  }

  if (status === 'error') {
    const failingStep = data.steps.find((step) => step.status === 'error')
    return (
      <AlertError
        subject="Warehouse setup failed"
        error={{
          message: failingStep?.message ?? 'An unknown error occurred while setting up Warehouse.',
        }}
        additionalActions={
          retryTargets.length > 0 ? (
            <Button variant="default" loading={setupMutation.isPending} onClick={handleRetrySetup}>
              Retry
            </Button>
          ) : undefined
        }
      />
    )
  }

  // status === 'complete'
  if (override === 'picker') {
    return <WarehouseSchemaTablePicker onBack={() => setOverride('auto')} />
  }

  return <WarehouseConnectionDetails onEditTables={() => setOverride('picker')} />
}

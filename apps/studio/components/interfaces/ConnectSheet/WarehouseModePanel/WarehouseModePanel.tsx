import { useParams } from 'common'
import { useState } from 'react'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { WarehouseConnectionDetails } from './WarehouseConnectionDetails'
import { WarehouseEnablingProgress } from './WarehouseEnablingProgress'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'

type PickerOverride = 'auto' | 'picker'

const POLLING_SETUP_STATUSES = new Set(['setting_up', 'copying'])

export const WarehouseModePanel = () => {
  const { ref: projectRef } = useParams()
  const [override, setOverride] = useState<PickerOverride>('auto')

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

  const handleRetrySetup = () => {
    if (!projectRef || !data) return

    // Re-submit the same tables that were already targeted -- the setup-status response tracks
    // them individually (with state), so we don't need to send the user back through the picker.
    const targets = data.tables.map((table) => ({
      type: 'table' as const,
      schema: table.schema,
      name: table.name,
    }))
    if (targets.length === 0) return

    setupMutation.mutate({ projectRef, body: { targets } })
  }

  if (isPending) return <GenericSkeletonLoader />
  if (isError) return <AlertError subject="Failed to load Warehouse status" error={error} />
  if (!data) return <GenericSkeletonLoader />

  const status = data.setup_status

  if (status === undefined || status === 'not_started') {
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
          message:
            failingStep?.message ?? 'An unknown error occurred while setting up Warehouse.',
        }}
        additionalActions={
          <Button variant="default" loading={setupMutation.isPending} onClick={handleRetrySetup}>
            Retry
          </Button>
        }
      />
    )
  }

  // status === 'complete'
  if (override === 'picker') {
    return <WarehouseSchemaTablePicker />
  }

  return <WarehouseConnectionDetails onEditTables={() => setOverride('picker')} />
}

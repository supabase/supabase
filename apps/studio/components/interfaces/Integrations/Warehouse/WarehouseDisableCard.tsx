import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { TextConfirmModal } from 'ui-patterns/Dialogs/TextConfirmModal'

import { warehouseKeys } from '@/data/warehouse/keys'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useTrack } from '@/lib/telemetry/track'

export const WarehouseDisableCard = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const track = useTrack()
  const [isConfirming, setIsConfirming] = useState(false)

  const setupMutation = useWarehouseSetupMutation({
    onSuccess: async () => {
      track('warehouse_disabled', {})
      // Disabling also turns off catalog access server-side, which the setup mutation doesn't know
      // to invalidate on its own.
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.catalog(projectRef) })
      setIsConfirming(false)
      toast.success('Warehouse disabled')
    },
  })

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Disable Warehouse</h3>
      <p className="text-sm text-foreground-light max-w-xl mb-3">
        Stops replication and removes the Warehouse pipeline, publication, catalog access, and
        foreign tables from this project.
      </p>

      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        Disable Warehouse
      </Button>

      <TextConfirmModal
        variant="destructive"
        visible={isConfirming}
        loading={setupMutation.isPending}
        title="Disable Warehouse"
        confirmLabel="Disable Warehouse"
        confirmPlaceholder="Type the project ref to confirm"
        confirmString={projectRef ?? ''}
        text="Disabling Warehouse stops replication and removes its pipeline, publication, catalog access, and foreign tables."
        alert={{
          title: 'Analytical tools will lose access',
          description:
            'Anything connected to the Warehouse endpoint stops working as soon as this is disabled.',
        }}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => projectRef && setupMutation.mutate({ projectRef, body: { targets: [] } })}
      />
    </div>
  )
}
